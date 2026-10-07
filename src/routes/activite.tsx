import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, LienBouton, TitreSection } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { formatPi } from "@/lib/store";
import { listerMesProduits, type ProduitDb } from "@/lib/comptes";
import {
  declarerLivraison,
  libelleStatut,
  mesCommandes,
  type CommandeAvecPaiement,
} from "@/lib/commandes";
import {
  mesClients,
  mesGains,
  totauxGains,
  type ClientVendeur,
  type GainsLigne,
  type TotauxGains,
} from "@/lib/activite";
import { BesoinCompte } from "@/components/BesoinCompte";
import { toast } from "sonner";
import { PackageCheck } from "lucide-react";

export const Route = createFileRoute("/activite")({
  head: () => ({
    meta: [
      { title: "Mon activité — WICO" },
      {
        name: "description",
        content: "Annonces, commandes reçues, clients et gains de votre espace vendeur WICO.",
      },
      { property: "og:title", content: "Mon activité — WICO" },
      { property: "og:description", content: "Votre espace vendeur en un coup d'œil." },
    ],
  }),
  component: ActiviteProtege,
});

type Onglet = "annonces" | "commandes" | "clients" | "gains";
type Filtre = "tous" | "attente" | "payee" | "recue" | "litige";

const FILTRES: Filtre[] = ["tous", "attente", "payee", "recue", "litige"];

function Activite() {
  const t = useT();
  const { utilisateur } = useSession();
  const [onglet, setOnglet] = useState<Onglet>("annonces");
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [annonces, setAnnonces] = useState<ProduitDb[]>([]);
  const [commandes, setCommandes] = useState<CommandeAvecPaiement[]>([]);
  const [clients, setClients] = useState<ClientVendeur[]>([]);
  const [gains, setGains] = useState<GainsLigne[]>([]);
  const [totaux, setTotaux] = useState<TotauxGains | null>(null);

  const recharger = useCallback(() => {
    if (!utilisateur?.id) return;
    const id = utilisateur.id;
    Promise.all([
      listerMesProduits(id),
      mesCommandes(id),
      mesClients(id),
      mesGains(id),
      totauxGains(id),
    ])
      .then(([a, c, cl, g, to]) => {
        setAnnonces(a);
        setCommandes(c.filter((x) => x.vendeur_id === id));
        setClients(cl);
        setGains(g);
        setTotaux(to);
      })
      .catch(() => undefined);
  }, [utilisateur?.id]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const libelleFiltre = (f: Filtre) =>
    f === "tous"
      ? t("tout")
      : f === "attente"
        ? t("attente")
        : f === "payee"
          ? t("payee")
          : f === "recue"
            ? t("livreeRecue")
            : t("litige");

  const vendeur = commandes.filter((c) =>
    filtre === "tous"
      ? true
      : filtre === "attente"
        ? c.statut === "en_attente_paiement"
        : c.statut === filtre,
  );

  const marquerLivree = async (c: CommandeAvecPaiement) => {
    try {
      await declarerLivraison(c.id);
      toast.success(t("livraisonDeclaree"));
      recharger();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    }
  };

  const onglets: [Onglet, string][] = [
    ["annonces", `${t("mesAnnonces")} (${annonces.length})`],
    ["commandes", `${t("commandesRecues")} (${commandes.length})`],
    ["clients", t("mesClients")],
    ["gains", t("mesGains")],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">{t("monActivite")}</h1>

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
      </div>

      {onglet === "annonces" && (
        <>
          <LienBouton to="/market/vendre" taille="sm" variante="secondaire">
            + {t("vendre")}
          </LienBouton>
          {annonces.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucuneAnnonce")}</Carte>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {annonces.map((p) => (
                <Carte key={p.id} className="space-y-2">
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.titre}
                      className="h-28 w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-28 place-items-center rounded-lg bg-primary-soft text-4xl">
                      🛍️
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate font-bold">{p.titre}</h3>
                    <Etiquette ton={p.publie ? "succes" : "neutre"}>
                      {p.publie ? "✓" : "—"}
                    </Etiquette>
                  </div>
                  <p className="text-sm font-extrabold text-primary">
                    {formatPi(Number(p.prix))} / {p.unite}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("stock")} : {p.stock}
                  </p>
                </Carte>
              ))}
            </div>
          )}
        </>
      )}

      {onglet === "commandes" && (
        <>
          <div className="flex flex-wrap gap-2">
            {FILTRES.map((f) => (
              <Bouton
                key={f}
                taille="sm"
                variante={filtre === f ? "primaire" : "contour"}
                onClick={() => setFiltre(f)}
              >
                {libelleFiltre(f)}
              </Bouton>
            ))}
          </div>
          {vendeur.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucuneCommande")}</Carte>
          ) : (
            vendeur.map((c) => (
              <Carte key={c.id} className="space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="min-w-0 truncate font-bold">{c.titre}</p>
                  <Etiquette
                    ton={
                      c.statut === "recue" || c.statut === "payee"
                        ? "succes"
                        : c.statut === "litige"
                          ? "urgent"
                          : "neutre"
                    }
                  >
                    {libelleStatut(c.statut)}
                  </Etiquette>
                </div>
                <p className="text-xs text-muted-foreground">
                  {c.quantite} {c.unite} · {new Date(c.created_at).toLocaleDateString("fr-FR")} ·{" "}
                  <Link to="/profil/$id" params={{ id: c.acheteur_id }} className="text-accent">
                    {c.acheteur_id.slice(0, 8)}…
                  </Link>
                </p>
                <p className="text-base font-extrabold text-primary">
                  {formatPi(Number(c.montant))}
                </p>
                {c.statut === "payee" && !c.livre_declare_at && (
                  <Bouton taille="sm" variante="contour" onClick={() => marquerLivree(c)}>
                    <PackageCheck className="size-4" /> {t("marquerLivre")}
                  </Bouton>
                )}
              </Carte>
            ))
          )}
        </>
      )}

      {onglet === "clients" && (
        <section className="space-y-3">
          <TitreSection>{t("mesClients")}</TitreSection>
          {clients.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucunClient")}</Carte>
          ) : (
            clients.map((c) => (
              <Carte key={c.acheteur_id} className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  to="/profil/$id"
                  params={{ id: c.acheteur_id }}
                  className="min-w-0 flex-1 truncate font-semibold text-primary"
                >
                  {c.acheteur_id.slice(0, 8)}…
                </Link>
                <span className="text-muted-foreground">
                  {c.nb_commandes} {t("commandes")}
                </span>
                <span className="font-extrabold text-primary">{formatPi(Number(c.total))}</span>
                <span className="text-xs text-muted-foreground">
                  {t("derniereCommande")} :{" "}
                  {new Date(c.derniere_commande).toLocaleDateString("fr-FR")}
                </span>
              </Carte>
            ))
          )}
        </section>
      )}

      {onglet === "gains" && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Carte>
              <p className="text-[0.7rem] uppercase text-muted-foreground">{t("retenuEscrow")}</p>
              <p className="text-lg font-extrabold text-secondary">
                {formatPi(Number(totaux?.en_escrow ?? 0))}
              </p>
            </Carte>
            <Carte>
              <p className="text-[0.7rem] uppercase text-muted-foreground">{t("libereNet")}</p>
              <p className="text-lg font-extrabold text-accent">
                {formatPi(Number(totaux?.libere_net ?? 0))}
              </p>
            </Carte>
            <Carte>
              <p className="text-[0.7rem] uppercase text-muted-foreground">{t("commissionWico")}</p>
              <p className="text-lg font-extrabold text-primary">
                {formatPi(Number(totaux?.commission_payee ?? 0))}
              </p>
            </Carte>
          </div>

          {gains.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucunGain")}</Carte>
          ) : (
            gains.map((g) => (
              <Carte key={g.order_id} className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-bold">{g.titre}</span>
                  <Etiquette ton={g.paiement_statut === "released" ? "succes" : "neutre"}>
                    {g.paiement_statut ?? "—"}
                  </Etiquette>
                </div>
                <p className="text-xs text-muted-foreground">
                  {libelleStatut(g.statut)} · {new Date(g.created_at).toLocaleDateString("fr-FR")}
                </p>
                <div className="flex flex-wrap gap-4">
                  <span>
                    {t("montantBrut")} :{" "}
                    <b className="text-primary">{formatPi(Number(g.montant))}</b>
                  </span>
                  <span>
                    {t("net")} : <b className="text-accent">{formatPi(Number(g.libere_net))}</b>
                  </span>
                </div>
              </Carte>
            ))
          )}
        </>
      )}
    </div>
  );
}

function ActiviteProtege() {
  const t = useT();
  return (
    <BesoinCompte titre={t("monActivite")} message="Connectez-vous pour voir votre activité.">
      <Activite />
    </BesoinCompte>
  );
}
