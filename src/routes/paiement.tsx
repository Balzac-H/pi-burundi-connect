import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bouton, Carte, BandeauPi, LienBouton } from "@/components/ui-kit";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { store, useStore, formatPi7 } from "@/lib/store";
import {
  chargerProduitsParIds,
  construireEtatPanier,
  type EtatPanier,
  type GroupeVendeur,
} from "@/lib/panier";
import { creerCommandes, payerAvecPi, type CodeAchat, type CommandeCreee } from "@/lib/achat";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { piDisponible } from "@/lib/pi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BesoinCompte } from "@/components/BesoinCompte";

type PaiementSearch = {
  /** « Acheter maintenant » : un seul article, à côté du panier. */
  produits?: string;
  /** Reprise d'une commande déjà créée et restée « en attente de paiement ». */
  commande?: string;
};

export const Route = createFileRoute("/paiement")({
  validateSearch: (search: Record<string, unknown>): PaiementSearch => ({
    produits: typeof search.produits === "string" ? search.produits : undefined,
    commande: typeof search.commande === "string" ? search.commande : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Confirmer l'achat — Arija" },
      {
        name: "description",
        content: "Récapitulatif de commande et paiement sécurisé en Pi via Pi Network.",
      },
      { property: "og:title", content: "Confirmer l'achat — Arija" },
      { property: "og:description", content: "Paiement sécurisé en Pi, livraison au Burundi." },
    ],
  }),
  component: PaiementProtege,
});

const MESSAGES: Record<CodeAchat, string> = {
  PI_ABSENT: "Ouvrez Arija dans le Pi Browser pour payer en Pi.",
  NON_CONNECTE: "Connexion Pi requise.",
  ANNULE: "Paiement annulé.",
  ERREUR: "Le paiement a échoué.",
};

function Paiement() {
  const t = useT();
  const panier = useStore((s) => s.panier);
  const { utilisateur } = useSession();
  const recherche = Route.useSearch();
  const [produits, setProduits] = useState<Awaited<ReturnType<typeof chargerProduitsParIds>>>([]);
  const [vendeurs, setVendeurs] = useState<Record<string, Profil | null>>({});
  const [etat, setEtat] = useState<"saisie" | "confirmation" | "paiement" | "ok">("saisie");
  const [payes, setPayes] = useState<string[]>([]);
  const [creees, setCreees] = useState<CommandeCreee[]>([]);
  const [enChargement, setEnChargement] = useState(true);
  const [pi, setPi] = useState(true);

  useEffect(() => setPi(piDisponible()), []);

  // Reprise d'une commande interrompue (?commande=…) : on la relecture en base.
  const commandeId = recherche.commande;
  const acheteurId = utilisateur?.id;

  useEffect(() => {
    if (!commandeId || !acheteurId) return;
    let vivant = true;
    setEnChargement(true);
    (async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", commandeId)
          .maybeSingle();
        if (!vivant) return;
        if (!data || data.acheteur_id !== acheteurId || data.statut !== "en_attente_paiement") {
          setEnChargement(false);
          return;
        }
        setCreees([
          {
            orderId: data.id,
            montant: Number(data.montant),
            titre: data.titre,
            unite: data.unite,
            vendeurId: data.vendeur_id,
            produitId: data.produit_id,
            quantite: data.quantite,
          },
        ]);
        const v = await chargerProfilCache(data.vendeur_id).catch(() => null);
        if (vivant) {
          setVendeurs({ [data.vendeur_id]: v });
          setEtat("confirmation");
          setEnChargement(false);
        }
      } catch {
        if (vivant) setEnChargement(false);
      }
    })();
    return () => {
      vivant = false;
    };
  }, [commandeId, acheteurId]);

  const panierSource = recherche.produits
    ? panier.filter((l) => l.produitId === recherche.produits)
    : panier;

  const etatPanier: EtatPanier = construireEtatPanier(
    panierSource,
    produits,
    utilisateur?.id ?? null,
  );
  const groupes: GroupeVendeur[] = etatPanier.groupes;

  useEffect(() => {
    if (recherche.commande || !utilisateur?.id) return;
    let vivant = true;
    setEnChargement(true);
    chargerProduitsParIds(panierSource.map((l) => l.produitId))
      .then(async (p) => {
        if (!vivant) return;
        setProduits(p);
        const e = construireEtatPanier(panierSource, p, utilisateur.id);
        if (e.aRetirer.length) store.retirerPlusieursDuPanier(e.aRetirer);
        const idsV = [
          ...new Set(e.lignes.map((l) => l.produit?.vendeur_id).filter((x): x is string => !!x)),
        ];
        const profils = await Promise.all(idsV.map((id) => chargerProfilCache(id)));
        if (vivant) setVendeurs(Object.fromEntries(idsV.map((id, i) => [id, profils[i]])));
      })
      .catch(() => undefined)
      .finally(() => {
        if (vivant) setEnChargement(false);
      });
    return () => {
      vivant = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche.produits, recherche.commande, panier, utilisateur?.id]);

  const totalBase = creees.reduce((s, c) => s + c.montant, 0);

  /** Retire du panier les articles réellement payés (lu dans `order_items`). */
  async function viderPayes(idsCommandes: string[]) {
    if (!idsCommandes.length) return;
    const { data } = await supabase
      .from("order_items")
      .select("produit_id")
      .in("order_id", idsCommandes);
    const idsProduits = [
      ...new Set((data ?? []).map((l) => l.produit_id).filter(Boolean)),
    ] as string[];
    if (idsProduits.length) store.retirerPlusieursDuPanier(idsProduits);
  }

  async function confirmer() {
    if (!utilisateur || etat !== "saisie") return;
    if (!groupes.length) return;
    setEtat("paiement");
    const r = await creerCommandes({
      acheteurId: utilisateur.id,
      lignes: groupes.flatMap((g) =>
        g.lignes.map((l) => ({ produitId: l.produitId, quantite: l.quantite })),
      ),
    });
    if ("erreur" in r) {
      toast.error(r.erreur);
      setEtat("saisie");
      return;
    }
    setCreees(r.commandes);
    setEtat("confirmation");
    toast.success(t("commandeConfirmee"));
  }

  async function payer() {
    if (!utilisateur || etat !== "confirmation" || !creees.length) return;
    setEtat("paiement");
    const aPayer = creees.map((c) => ({
      orderId: c.orderId,
      titre: c.titre,
      montant: c.montant,
      vendeurId: c.vendeurId,
      produitId: c.produitId ?? "",
      quantite: c.quantite,
    }));

    const res = await payerAvecPi(aPayer);
    if (res.ok) {
      setPayes(res.payes);
      res.echecs.forEach((e) => toast.error(`${e.orderId.slice(0, 8)} — ${e.erreur}`));
      await viderPayes(res.payes);
      setEtat("ok");
      toast.success(t("paiementConfirme"));
      return;
    }
    toast.error(res.erreur || MESSAGES[res.code]);
    setEtat("confirmation");
  }

  if (etat === "ok") {
    return (
      <Carte className="mx-auto max-w-lg space-y-3 text-center">
        <h1 className="text-2xl font-semibold text-success">{t("paiementConfirme")}</h1>
        <p className="text-sm text-muted-foreground">
          {payes.length} commande{payes.length > 1 ? "s" : ""} payée{payes.length > 1 ? "s" : ""} ·{" "}
          {formatPi7(totalBase)}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <LienBouton to="/portefeuille" taille="sm">
            {t("mesCommandes")}
          </LienBouton>
          <LienBouton to="/market" variante="contour" taille="sm">
            {t("voirTout")} {t("market")}
          </LienBouton>
        </div>
      </Carte>
    );
  }

  if (etat === "confirmation" || etat === "paiement") {
    const nbPaiements = creees.length;
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">{t("acheterMaintenant")}</h1>

        <Carte className="space-y-2">
          <p className="section-label">{t("commandeConfirmee")}</p>
          <h2 className="section-label">{t("panier")}</h2>
          {creees.map((c) => (
            <div key={c.orderId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {c.titre} × {c.quantite} {c.unite}
                {vendeurs[c.vendeurId]?.nom ? (
                  <span className="text-xs text-muted-foreground">
                    {" · "}
                    {vendeurs[c.vendeurId]?.nom}
                  </span>
                ) : null}
              </span>
              <span className="font-semibold">{formatPi7(c.montant)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-primary">
            <span>{t("total")}</span>
            <span>{formatPi7(totalBase)}</span>
          </div>
        </Carte>

        {nbPaiements > 1 && (
          <p className="text-xs font-semibold text-primary">
            {t("nbPaiements").replace("{n}", String(nbPaiements))}
          </p>
        )}

        {!pi && (
          <Carte className="text-sm font-semibold text-primary">{t("piBrowserRequis")}</Carte>
        )}

        <BandeauPi />

        <div className="flex gap-2">
          <Bouton className="flex-1" disabled={etat === "paiement"} onClick={payer}>
            {etat === "paiement" ? t("paiementEnCours") : t("payerEnPi")}
          </Bouton>
          <Bouton
            variante="contour"
            disabled={etat === "paiement"}
            onClick={() => {
              setCreees([]);
              setEtat("saisie");
            }}
          >
            {t("retourAuPanier")}
          </Bouton>
        </div>
        <p className="text-center text-xs text-muted-foreground">{t("piBrowserRequis")}</p>
      </div>
    );
  }

  if (enChargement) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  }

  if (!groupes.length) {
    return (
      <Carte className="mx-auto max-w-lg space-y-3 text-center">
        <p className="font-semibold">{t("panierVide")}</p>
        <LienBouton to="/panier" taille="sm">
          {t("retourAuPanier")}
        </LienBouton>
      </Carte>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">{t("acheterMaintenant")}</h1>

      {groupes.map((groupe) => (
        <Carte key={groupe.vendeurId} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="section-label">
              {t("vendeur")} · {vendeurs[groupe.vendeurId]?.nom ?? "…"}
            </h2>
            <span className="text-xs text-muted-foreground">{t("sousTotal")}</span>
          </div>
          {groupe.lignes.map((l) => (
            <div key={l.produitId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate">
                {l.titre} × {l.quantite} {l.unite}
              </span>
              <span className="font-semibold">{formatPi7(l.sousTotal)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold text-primary">
            <span>{t("sousTotal")}</span>
            <span>{formatPi7(groupe.sousTotal)}</span>
          </div>
        </Carte>
      ))}

      <Carte className="flex items-center justify-between text-base font-semibold text-primary">
        <span>{t("total")}</span>
        <span>{formatPi7(etatPanier.total)}</span>
      </Carte>

      {groupes.length > 1 && (
        <p className="text-xs font-semibold text-primary">
          {t("nbPaiements").replace("{n}", String(groupes.length))}
        </p>
      )}

      {!pi && <Carte className="text-sm font-semibold text-primary">{t("piBrowserRequis")}</Carte>}

      <BandeauPi />

      <div className="flex gap-2">
        <Bouton className="flex-1" onClick={confirmer}>
          {t("continuer")}
        </Bouton>
        <LienBouton to="/panier" variante="contour">
          {t("retourAuPanier")}
        </LienBouton>
      </div>
      <p className="text-center text-xs text-muted-foreground">{t("piBrowserRequis")}</p>
    </div>
  );
}

function PaiementProtege() {
  const t = useT();
  return (
    <BesoinCompte
      titre={t("acheterMaintenant")}
      message="Connectez-vous avec Pi pour payer votre panier."
    >
      <Paiement />
    </BesoinCompte>
  );
}
