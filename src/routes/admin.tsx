import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bouton, Carte, Etiquette } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import {
  estAdmin,
  listerSignalements,
  marquerTraite,
  raisonsSignalement,
  type SignalementDb,
} from "@/lib/annonces";
import { listerLitiges, modifierStatutLitige, paiementsEnAttente } from "@/lib/admin";
import { libelleStatut, type CommandeAvecPaiement, type LitigeDb } from "@/lib/commandes";
import { piRelease } from "@/lib/pi.functions";
import { formatPi } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — WICO" },
      {
        name: "description",
        content: "Espace administrateur WICO : signalements, litiges et fonds en escrow.",
      },
      { property: "og:title", content: "Administration — WICO" },
      { property: "og:description", content: "Modération de la communauté WICO." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Onglet = "signalements" | "litiges" | "fonds";

function Admin() {
  const { utilisateur, chargement } = useSession();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("signalements");
  const [signalements, setSignalements] = useState<SignalementDb[]>([]);
  const [litiges, setLitiges] = useState<LitigeDb[]>([]);
  const [commandes, setCommandes] = useState<CommandeAvecPaiement[]>([]);

  useEffect(() => {
    if (!utilisateur) return;
    estAdmin(utilisateur.id).then((ok) => setAdmin(ok));
  }, [utilisateur]);

  useEffect(() => {
    if (admin !== true) return;
    if (onglet === "signalements")
      listerSignalements()
        .then(setSignalements)
        .catch(() => toast.error("Chargement impossible."));
    if (onglet === "litiges")
      listerLitiges()
        .then(setLitiges)
        .catch(() => toast.error("Chargement impossible."));
    if (onglet === "fonds")
      paiementsEnAttente()
        .then(setCommandes)
        .catch(() => toast.error("Chargement impossible."));
  }, [admin, onglet]);

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
        <Link to="/connexion" className="font-semibold text-accent">
          Se connecter
        </Link>
      </Carte>
    );
  if (admin === null) return <Carte>Vérification…</Carte>;
  if (!admin) return <Carte>Accès réservé aux administrateurs.</Carte>;

  const basculerSignalement = async (s: SignalementDb) => {
    const statut = s.statut === "ouvert" ? "traite" : "ouvert";
    await marquerTraite(s.id, statut);
    setSignalements((l) => l.map((x) => (x.id === s.id ? { ...x, statut } : x)));
  };

  const changerStatutLitige = async (l: LitigeDb, statut: string) => {
    try {
      await modifierStatutLitige(l.id, statut);
      setLitiges((liste) => liste.map((x) => (x.id === l.id ? { ...x, statut } : x)));
      toast.success("Litige mis à jour.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Modification impossible.");
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
      toast.error(e instanceof Error ? e.message : "Libération impossible.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Administration</h1>

      <div className="flex flex-wrap gap-2">
        {(
          [
            [
              "signalements",
              `Signalements (${signalements.filter((s) => s.statut === "ouvert").length})`,
            ],
            ["litiges", `Litiges (${litiges.filter((l) => l.statut === "ouvert").length})`],
            ["fonds", `Fonds retenus (${commandes.length})`],
          ] as [Onglet, string][]
        ).map(([code, libelle]) => (
          <Bouton
            key={code}
            taille="sm"
            variante={onglet === code ? "primaire" : "contour"}
            onClick={() => setOnglet(code)}
          >
            {libelle}
          </Bouton>
        ))}
      </div>

      {onglet === "signalements" && (
        <>
          <Carte className="space-y-2">
            <h2 className="font-bold">Membres les plus signalés</h2>
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
                <span className="font-bold">
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
                <span className="font-bold">Commande {l.order_id.slice(0, 8)}…</span>
                <Etiquette ton={l.statut === "ouvert" ? "urgent" : "succes"}>{l.statut}</Etiquette>
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
          {commandes.length === 0 && (
            <Carte className="text-sm text-muted-foreground">Aucun fonds retenu en escrow.</Carte>
          )}
          {commandes.map((c) =>
            c.payments
              .filter((p) => p.statut === "paid_held")
              .map((p) => (
                <Carte key={p.id} className="space-y-2 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold">{c.titre}</span>
                    <span className="font-extrabold text-primary">
                      {formatPi(Number(p.montant))}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {libelleStatut(c.statut)} · commande {c.id.slice(0, 8)}… ·{" "}
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Bouton taille="sm" onClick={() => liberer(p.id)}>
                      LIBÉRER LES FONDS (2 %)
                    </Bouton>
                    <LienVersCommande id={c.id} />
                  </div>
                </Carte>
              )),
          )}
        </>
      )}
    </div>
  );
}

function LienVersCommande({ id }: { id: string }) {
  return (
    <Link to="/portefeuille" className="self-center text-xs font-semibold text-accent">
      Voir la commande →
    </Link>
  );
}
