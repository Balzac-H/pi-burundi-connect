import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bouton,
  Carte,
  Champ,
  Etiquette,
  LienBouton,
  Saisie,
  Selection,
} from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import {
  listerSignalements,
  marquerTraite,
  raisonsSignalement,
  roleResponsable,
  type Responsable,
  type SignalementDb,
} from "@/lib/annonces";
import {
  listerLitiges,
  lireAssistantActif,
  lireSeuilDoubleValidation,
  paiementsEnAttente,
  remboursementsARefectuer,
  type RemboursementARefectuer,
} from "@/lib/admin";
import {
  gererRole,
  listerJournalAudit,
  listerLiberationsEnAttente,
  listerMembres,
  messageErreurServeur,
  modifierReglage,
  traiterLitige,
  type LigneAudit,
  type MembreAdmin,
} from "@/lib/admin.functions";
import { libelleStatut, type CommandeAvecPaiement, type LitigeDb } from "@/lib/commandes";
import { piRefund, piRelease } from "@/lib/pi.functions";
import { formatPi } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Administration — Arija Connect" },
      {
        name: "description",
        content: "Espace administrateur Arija Connect : signalements, litiges et fonds en escrow.",
      },
      { property: "og:title", content: "Administration — Arija Connect" },
      { property: "og:description", content: "Modération de la communauté Arija Connect." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Onglet = "signalements" | "litiges" | "fonds" | "reglages";

function Admin() {
  const t = useT();
  const { utilisateur, chargement } = useSession();
  const [role, setRole] = useState<Responsable | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("signalements");
  const [signalements, setSignalements] = useState<SignalementDb[]>([]);
  const [litiges, setLitiges] = useState<LitigeDb[]>([]);
  const [commandes, setCommandes] = useState<CommandeAvecPaiement[]>([]);
  const [membres, setMembres] = useState<MembreAdmin[]>([]);
  const [audit, setAudit] = useState<LigneAudit[]>([]);
  const [enAttente, setEnAttente] = useState<
    { id: string; payment_id: string; montant: number; premier_admin: string }[]
  >([]);
  const [remboursements, setRemboursements] = useState<RemboursementARefectuer[]>([]);
  const [confirmeRemb, setConfirmeRemb] = useState<Record<string, boolean>>({});
  const [txidRemb, setTxidRemb] = useState<Record<string, string>>({});
  const [seuil, setSeuil] = useState<string>("0");
  const [assistantActif, setAssistantActif] = useState<boolean>(true);
  const [cibleRole, setCibleRole] = useState<string>("");
  const [roleAccorde, setRoleAccorde] = useState<"admin" | "moderator">("moderator");

  const estAdminRole = role === "admin";

  useEffect(() => {
    if (!utilisateur) return;
    roleResponsable(utilisateur.id).then(setRole);
  }, [utilisateur]);

  useEffect(() => {
    if (!role) return;
    if (onglet === "signalements")
      listerSignalements()
        .then(setSignalements)
        .catch(() => toast.error("Chargement impossible."));
    if (onglet === "litiges")
      listerLitiges()
        .then(setLitiges)
        .catch(() => toast.error("Chargement impossible."));
    if (onglet === "fonds" && estAdminRole)
      Promise.all([paiementsEnAttente(), remboursementsARefectuer()])
        .then(([c, r]) => {
          setCommandes(c);
          setRemboursements(r);
        })
        .catch(() => toast.error("Chargement impossible."));
    if (onglet === "reglages" && estAdminRole) {
      Promise.all([
        listerMembres(),
        listerJournalAudit(),
        listerLiberationsEnAttente(),
        lireSeuilDoubleValidation(),
        lireAssistantActif(),
      ])
        .then(([m, a, l, s, assistant]) => {
          setMembres(m);
          setAudit(a);
          setEnAttente(l);
          setSeuil(String(s));
          setAssistantActif(assistant);
        })
        .catch(() => toast.error("Chargement impossible."));
    }
  }, [role, onglet, estAdminRole]);

  const compteurs = useMemo(() => {
    const m = new Map<string, number>();
    signalements.forEach((s) =>
      m.set(s.utilisateur_signale_id, (m.get(s.utilisateur_signale_id) ?? 0) + 1),
    );
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [signalements]);

  if (chargement) return null;
  if (!utilisateur)
    return (
      <Carte>
        Connectez-vous.{" "}
        <Link to="/connexion" className="font-semibold text-primary">
          Se connecter
        </Link>
      </Carte>
    );
  if (role === null) return <Carte>Vérification…</Carte>;
  if (!role) return <Carte>{t("adminSeul")}</Carte>;

  const basculerSignalement = async (s: SignalementDb) => {
    const statut = s.statut === "ouvert" ? "traite" : "ouvert";
    await marquerTraite(s.id, statut);
    setSignalements((l) => l.map((x) => (x.id === s.id ? { ...x, statut } : x)));
  };

  const changerStatutLitige = async (l: LitigeDb, statut: string) => {
    try {
      await traiterLitige({
        data: { litigeId: l.id, statut: statut as "ouvert" | "resolu" | "rejete" },
      });
      setLitiges((liste) => liste.map((x) => (x.id === l.id ? { ...x, statut } : x)));
      toast.success("Litige mis à jour.");
    } catch (e) {
      toast.error(messageErreurServeur(e, t));
    }
  };

  const liberer = async (paymentId: string) => {
    try {
      const r = await piRelease({ data: { paymentId } });
      toast.success(`Fonds libérés : ${formatPi(Number(r.commission))} de commission enregistrés.`);
      setCommandes((liste) =>
        liste.map((c) => ({
          ...c,
          payments: c.payments.map((p) =>
            p.id === paymentId ? { ...p, statut: "released", commission: r.commission } : p,
          ),
        })),
      );
    } catch (e) {
      toast.error(messageErreurServeur(e, t));
    }
  };

  const rembourser = async (paymentId: string, confirme: boolean, txid?: string) => {
    try {
      const r = await piRefund({ data: { paymentId, confirme, txid: txid || undefined } });
      if (r.enAttente) {
        toast.success("Remboursement placé dans la file « à effectuer ».");
        const maj = await remboursementsARefectuer();
        setRemboursements(maj);
        return;
      }
      toast.success("Remboursement confirmé et enregistré.");
      setRemboursements((liste) => liste.filter((x) => x.payment_id !== paymentId));
      setCommandes((liste) =>
        liste.map((c) => ({
          ...c,
          payments: c.payments.map((p) => (p.id === paymentId ? { ...p, statut: "refunded" } : p)),
        })),
      );
    } catch (e) {
      toast.error(messageErreurServeur(e, t));
    }
  };

  const onglets: [Onglet, string][] = [
    ["signalements", `Signalements (${signalements.filter((s) => s.statut === "ouvert").length})`],
    ["litiges", `Litiges (${litiges.filter((l) => l.statut === "ouvert").length})`],
  ];
  if (estAdminRole) {
    onglets.push(["fonds", `Fonds retenus (${commandes.length})`]);
    onglets.push(["reglages", t("reglagesAdmin")]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">{t("espaceResponsable")}</h1>
      {role === "moderator" && (
        <Carte className="text-sm text-muted-foreground">{t("accesRestreint")}</Carte>
      )}

      <div className="flex flex-wrap gap-2">
        {onglets.map(([code, libelle]) => (
          <Bouton
            key={code}
            taille="sm"
            variante={onglet === code ? "primaire" : "contour"}
            onClick={() => setOnglet(code)}
          >
            {libelle}
          </Bouton>
        ))}
        {estAdminRole && (
          <LienBouton to="/admin/donnees" variante="contour" taille="sm">
            {t("espaceDonnees")}
          </LienBouton>
        )}
      </div>

      {onglet === "signalements" && (
        <>
          <Carte className="space-y-2">
            <h2 className="font-semibold">Membres les plus signalés</h2>
            {compteurs.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun signalement.</p>
            )}
            {compteurs.map(([id, n]) => (
              <div key={id} className="flex items-center justify-between text-sm">
                <Link to="/profil/$id" params={{ id }} className="font-semibold text-primary">
                  {id.slice(0, 8)}…
                </Link>
                <Etiquette ton={n >= 3 ? "urgent" : undefined}>{n} signalement(s)</Etiquette>
              </div>
            ))}
          </Carte>
          {signalements.map((s) => (
            <Carte key={s.id} className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {raisonsSignalement.find((r) => r.code === s.raison)?.nom ?? s.raison} ·{" "}
                  {s.cible_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(s.created_at).toLocaleString("fr-FR")}
                </span>
              </div>
              {s.details && <p className="text-muted-foreground">{s.details}</p>}
              <Bouton
                taille="sm"
                variante={s.statut === "ouvert" ? "primaire" : "contour"}
                onClick={() => basculerSignalement(s)}
              >
                {s.statut === "ouvert" ? "Marquer traité" : "Rouvrir"}
              </Bouton>
            </Carte>
          ))}
        </>
      )}

      {onglet === "litiges" && (
        <>
          {litiges.length === 0 && (
            <Carte className="text-sm text-muted-foreground">Aucun litige ouvert.</Carte>
          )}
          {litiges.map((l) => (
            <Carte key={l.id} className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">Commande {l.order_id.slice(0, 8)}…</span>
                <Etiquette ton={l.statut === "ouvert" ? "attente" : "succes"}>{l.statut}</Etiquette>
              </div>
              <p className="text-muted-foreground">{l.description}</p>
              <p className="text-xs text-muted-foreground">
                Ouvert le {new Date(l.created_at).toLocaleString("fr-FR")} par{" "}
                {l.auteur_id.slice(0, 8)}…
              </p>
              <div className="flex flex-wrap gap-2">
                <LienVersCommande id={l.order_id} />
                {l.statut === "ouvert" ? (
                  <>
                    <Bouton taille="sm" onClick={() => changerStatutLitige(l, "resolu")}>
                      RÉSOUDRE
                    </Bouton>
                    <Bouton
                      taille="sm"
                      variante="contour"
                      onClick={() => changerStatutLitige(l, "rejete")}
                    >
                      REJETER
                    </Bouton>
                  </>
                ) : (
                  <Bouton
                    taille="sm"
                    variante="contour"
                    onClick={() => changerStatutLitige(l, "ouvert")}
                  >
                    ROUVRIR
                  </Bouton>
                )}
              </div>
            </Carte>
          ))}
        </>
      )}

      {onglet === "fonds" && (
        <>
          {enAttente.length > 0 && (
            <Carte className="space-y-2 text-sm">
              <h2 className="font-semibold">{t("enAttenteValidation")}</h2>
              {enAttente.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <span className="font-mono text-xs">{a.payment_id.slice(0, 8)}…</span>
                  <span className="font-semibold">{formatPi(Number(a.montant))}</span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{t("validationEnAttente")}</p>
            </Carte>
          )}

          {remboursements.length > 0 && (
            <Carte className="space-y-2 text-sm">
              <h2 className="font-semibold">Remboursements à effectuer</h2>
              <p className="text-xs text-muted-foreground">
                L'application ne renvoie pas l'argent automatiquement : effectuez le remboursement
                dans Pi, puis confirmez-le ici avec le numéro de transaction (facultatif).
              </p>
              {remboursements.map((r) => (
                <div key={r.payment_id} className="space-y-2 border-t border-border pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{r.titre}</span>
                    <span className="font-semibold text-primary">{formatPi(r.montant)}</span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    paiement {r.payment_id.slice(0, 8)}…
                  </p>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={confirmeRemb[r.payment_id] ?? false}
                      onChange={(e) =>
                        setConfirmeRemb((m) => ({ ...m, [r.payment_id]: e.target.checked }))
                      }
                    />
                    Remboursement effectué dans Pi
                  </label>
                  {confirmeRemb[r.payment_id] && (
                    <Saisie
                      placeholder="Numéro de transaction (facultatif)"
                      value={txidRemb[r.payment_id] ?? ""}
                      onChange={(e) =>
                        setTxidRemb((m) => ({ ...m, [r.payment_id]: e.target.value }))
                      }
                    />
                  )}
                  <Bouton
                    taille="sm"
                    variante={confirmeRemb[r.payment_id] ? "primaire" : "contour"}
                    onClick={() =>
                      rembourser(
                        r.payment_id,
                        confirmeRemb[r.payment_id] ?? false,
                        txidRemb[r.payment_id],
                      )
                    }
                  >
                    {confirmeRemb[r.payment_id]
                      ? "CONFIRMER LE REMBOURSEMENT"
                      : "MARQUER À REMBOURSER"}
                  </Bouton>
                </div>
              ))}
            </Carte>
          )}

          {commandes.length === 0 && (
            <Carte className="text-sm text-muted-foreground">Aucun fonds retenu en escrow.</Carte>
          )}
          {commandes.map((c) =>
            c.payments
              .filter((p) => p.statut === "paid_held")
              .map((p) => (
                <Carte key={p.id} className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">{c.titre}</span>
                    <span className="font-semibold text-primary">
                      {formatPi(Number(p.montant))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {libelleStatut(c.statut)} · commande {c.id.slice(0, 8)}… ·{" "}
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={confirmeRemb[p.id] ?? false}
                      onChange={(e) => setConfirmeRemb((m) => ({ ...m, [p.id]: e.target.checked }))}
                    />
                    Remboursement effectué dans Pi
                  </label>
                  {confirmeRemb[p.id] && (
                    <Saisie
                      placeholder="Numéro de transaction (facultatif)"
                      value={txidRemb[p.id] ?? ""}
                      onChange={(e) => setTxidRemb((m) => ({ ...m, [p.id]: e.target.value }))}
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Bouton taille="sm" onClick={() => liberer(p.id)}>
                      LIBÉRER LES FONDS (2 %)
                    </Bouton>
                    <Bouton
                      taille="sm"
                      variante="contour"
                      onClick={() => rembourser(p.id, confirmeRemb[p.id] ?? false, txidRemb[p.id])}
                    >
                      {confirmeRemb[p.id] ? "CONFIRMER LE REMBOURSEMENT" : "MARQUER À REMBOURSER"}
                    </Bouton>
                    <LienVersCommande id={c.id} />
                  </div>
                </Carte>
              )),
          )}
        </>
      )}

      {onglet === "reglages" && estAdminRole && (
        <>
          <Carte className="space-y-3 text-sm">
            <h2 className="font-semibold">{t("seuilDoubleValidation")}</h2>
            <Champ label={t("seuilDoubleValidation")}>
              <Saisie
                type="number"
                min={0}
                step={0.01}
                value={seuil}
                onChange={(e) => setSeuil(e.target.value)}
              />
            </Champ>
            <Bouton
              taille="sm"
              onClick={async () => {
                try {
                  await modifierReglage({
                    data: { cle: "seuil_double_validation", valeur: Number(seuil) || 0 },
                  });
                  toast.success("Réglage enregistré.");
                } catch (e) {
                  toast.error(messageErreurServeur(e, t));
                }
              }}
            >
              ENREGISTRER
            </Bouton>

            <label className="flex items-center gap-2 border-t border-border pt-3 text-sm">
              <input
                type="checkbox"
                checked={assistantActif}
                onChange={async (e) => {
                  const valeur = e.target.checked;
                  setAssistantActif(valeur);
                  try {
                    await modifierReglage({ data: { cle: "assistant_actif", valeur } });
                    toast.success("Réglage enregistré.");
                  } catch (err) {
                    setAssistantActif(!valeur);
                    toast.error(messageErreurServeur(err, t));
                  }
                }}
              />
              {t("donneesAssistant")}
            </label>
            <p className="text-xs text-muted-foreground">{t("donneesAssistantActif")}</p>
          </Carte>

          <Carte className="space-y-3 text-sm">
            <h2 className="font-semibold">{t("roles")}</h2>
            <div className="flex flex-wrap gap-2">
              <Selection value={cibleRole} onChange={(e) => setCibleRole(e.target.value)}>
                <option value="">—</option>
                {membres.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nom} ({m.roles.join(", ")})
                  </option>
                ))}
              </Selection>
              <Selection
                value={roleAccorde}
                onChange={(e) => setRoleAccorde(e.target.value as "admin" | "moderator")}
              >
                <option value="moderator">moderator</option>
                <option value="admin">admin</option>
              </Selection>
              <Bouton
                taille="sm"
                disabled={!cibleRole}
                onClick={async () => {
                  try {
                    await gererRole({
                      data: { userId: cibleRole, role: roleAccorde, actif: true },
                    });
                    setMembres((liste) =>
                      liste.map((m) =>
                        m.id === cibleRole && !m.roles.includes(roleAccorde)
                          ? { ...m, roles: [...m.roles, roleAccorde] }
                          : m,
                      ),
                    );
                    toast.success("Rôle accordé.");
                  } catch (e) {
                    toast.error(messageErreurServeur(e, t));
                  }
                }}
              >
                ACCORDER
              </Bouton>
            </div>
            {membres
              .filter((m) => m.roles.includes("admin") || m.roles.includes("moderator"))
              .map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <Link
                    to="/profil/$id"
                    params={{ id: m.id }}
                    className="font-semibold text-primary"
                  >
                    {m.nom}
                  </Link>
                  <div className="flex flex-wrap gap-2">
                    {m.roles
                      .filter((r) => r !== "user")
                      .map((r) => (
                        <Bouton
                          key={r}
                          taille="sm"
                          variante="contour"
                          onClick={async () => {
                            try {
                              await gererRole({
                                data: {
                                  userId: m.id,
                                  role: r as "admin" | "moderator",
                                  actif: false,
                                },
                              });
                              setMembres((liste) =>
                                liste.map((x) =>
                                  x.id === m.id
                                    ? { ...x, roles: x.roles.filter((y) => y !== r) }
                                    : x,
                                ),
                              );
                              toast.success("Rôle retiré.");
                            } catch (e) {
                              toast.error(messageErreurServeur(e, t));
                            }
                          }}
                        >
                          Retirer {r}
                        </Bouton>
                      ))}
                  </div>
                </div>
              ))}
          </Carte>

          <Carte className="space-y-2 text-sm">
            <h2 className="font-semibold">{t("journalAudit")}</h2>
            {audit.length === 0 && <p className="text-muted-foreground">—</p>}
            {audit.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs">{a.action}</span>
                <span className="text-xs text-muted-foreground">
                  {a.acteur?.slice(0, 8)}… · {a.cible?.slice(0, 8)}… ·{" "}
                  {new Date(a.date).toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
          </Carte>
        </>
      )}
    </div>
  );
}

function LienVersCommande({ id: _id }: { id: string }) {
  return (
    <Link to="/portefeuille" className="self-center text-xs font-semibold text-primary">
      Voir la commande
    </Link>
  );
}
