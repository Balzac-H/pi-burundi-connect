import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bouton, Carte, BandeauPi, LienBouton } from "@/components/ui-kit";
import { chargerProfilCache, listerProduits, type ProduitDb, type Profil } from "@/lib/comptes";
import { store, useStore, formatPi } from "@/lib/store";
import { creerCommande, payerAvecPi, type CodeAchat } from "@/lib/achat";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { BesoinCompte } from "@/components/BesoinCompte";

export const Route = createFileRoute("/paiement")({
  head: () => ({
    meta: [
      { title: "Confirmer l'achat — WICO" },
      {
        name: "description",
        content: "Récapitulatif de commande et paiement sécurisé en Pi via Pi Network.",
      },
      { property: "og:title", content: "Confirmer l'achat — WICO" },
      { property: "og:description", content: "Paiement sécurisé en Pi, livraison au Burundi." },
    ],
  }),
  component: PaiementProtege,
});

const MESSAGES: Record<CodeAchat, string> = {
  PI_ABSENT: "Ouvrez WICO dans le Pi Browser pour payer en Pi.",
  NON_CONNECTE: "Connexion Pi requise.",
  ANNULE: "Paiement annulé.",
  ERREUR: "Le paiement a échoué.",
};

function Paiement() {
  const t = useT();
  const panier = useStore((s) => s.panier);
  const { utilisateur } = useSession();
  const [lignes, setLignes] = useState<{ produit: ProduitDb; quantite: number }[]>([]);
  const [vendeurs, setVendeurs] = useState<Record<string, Profil | null>>({});
  const [etat, setEtat] = useState<"saisie" | "paiement" | "ok">("saisie");
  const [payes, setPayes] = useState<string[]>([]);

  useEffect(() => {
    let vivant = true;
    listerProduits()
      .then(async (p) => {
        const trouvees = panier
          .map((l) => {
            const produit = p.find((x) => x.id === l.produitId);
            return produit ? { produit, quantite: l.quantite } : null;
          })
          .filter((x): x is { produit: ProduitDb; quantite: number } => !!x);
        if (!vivant) return;
        setLignes(trouvees);
        const ids = [...new Set(trouvees.map((l) => l.produit.vendeur_id))];
        const profils = await Promise.all(ids.map((id) => chargerProfilCache(id)));
        if (vivant) setVendeurs(Object.fromEntries(ids.map((id, i) => [id, profils[i]])));
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [panier]);

  const sousTotal = lignes.reduce((s, l) => s + Number(l.produit.prix) * l.quantite, 0);
  const total = Math.round(sousTotal * 1e7) / 1e7;

  if (etat === "ok") {
    return (
      <Carte className="mx-auto max-w-lg space-y-3 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="text-2xl font-extrabold text-accent">{t("paiementConfirme")}</h1>
        <p className="text-sm text-muted-foreground">
          {payes.length} commande{payes.length > 1 ? "s" : ""} payée{payes.length > 1 ? "s" : ""} ·{" "}
          {formatPi(total)}
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

  if (lignes.length === 0) {
    return (
      <Carte className="mx-auto max-w-lg space-y-3 text-center">
        <p className="font-semibold">{t("aucuneAnnonce")}</p>
        <LienBouton to="/market" taille="sm">
          {t("market")}
        </LienBouton>
      </Carte>
    );
  }

  async function payer() {
    if (!utilisateur || etat === "paiement") return;
    setEtat("paiement");
    const aPayer: {
      orderId: string;
      titre: string;
      montant: number;
      vendeurId: string;
      produitId: string;
      quantite: number;
    }[] = [];
    for (const l of lignes) {
      const min = Math.max(1, l.produit.quantite_min ?? 1);
      if (l.quantite < min || l.quantite > l.produit.stock) {
        toast.error(
          `« ${l.produit.titre} » : quantité entre ${min} et ${l.produit.stock} ${l.produit.unite}.`,
        );
        setEtat("saisie");
        return;
      }
      const commande = await creerCommande({
        acheteurId: utilisateur.id,
        vendeurId: l.produit.vendeur_id,
        produitId: l.produit.id,
        titre: l.produit.titre,
        quantite: l.quantite,
        unite: l.produit.unite,
        montant: Math.round(Number(l.produit.prix) * l.quantite * 1e7) / 1e7,
      });
      if ("erreur" in commande) {
        toast.error(commande.erreur);
        setEtat("saisie");
        return;
      }
      aPayer.push({
        orderId: commande.orderId,
        titre: l.produit.titre,
        montant: Math.round(Number(l.produit.prix) * l.quantite * 1e7) / 1e7,
        vendeurId: l.produit.vendeur_id,
        produitId: l.produit.id,
        quantite: l.quantite,
      });
    }

    const res = await payerAvecPi(aPayer);
    if (res.ok) {
      setPayes(res.payes);
      res.echecs.forEach((e) => toast.error(`${e.orderId.slice(0, 8)} — ${e.erreur}`));
      res.payes.forEach((orderId) => {
        const ligne = aPayer.find((x) => x.orderId === orderId);
        if (ligne) store.retirerDuPanier(ligne.produitId);
      });
      setEtat("ok");
      toast.success(t("paiementConfirme"));
      return;
    }
    toast.error(res.erreur || MESSAGES[res.code]);
    setEtat("saisie");
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">{t("acheterMaintenant")}</h1>

      <Carte className="space-y-2">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">{t("panier")}</h2>
        {lignes.map((l) => (
          <div key={l.produit.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              {l.produit.titre} × {l.quantite}
            </span>
            <span className="font-semibold">{formatPi(Number(l.produit.prix) * l.quantite)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-primary">
          <span>TOTAL</span>
          <span>{formatPi(total)}</span>
        </div>
      </Carte>

      <Carte className="space-y-1 text-sm">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Vendeurs</h2>
        {[...new Set(lignes.map((l) => l.produit.vendeur_id))].map((id) => (
          <p key={id} className="truncate text-xs text-muted-foreground">
            {vendeurs[id]?.nom ?? "…"} {vendeurs[id]?.ville ? `· ${vendeurs[id]?.ville}` : ""}
          </p>
        ))}
        <p className="text-xs text-muted-foreground">
          Chaque commande est payée séparément (un paiement Pi par commande).
        </p>
      </Carte>

      <BandeauPi />

      <div className="flex gap-2">
        <Bouton className="flex-1" disabled={etat === "paiement"} onClick={payer}>
          {etat === "paiement" ? t("paiementEnCours") : t("acheterMaintenant")}
        </Bouton>
        <Bouton variante="contour" onClick={() => store.viderPanier()}>
          ANNULER
        </Bouton>
      </div>
      <p className="text-center text-xs text-muted-foreground">🔒 {t("piBrowserRequis")}</p>
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
