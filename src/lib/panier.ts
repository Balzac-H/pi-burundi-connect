import { supabase } from "@/integrations/supabase/client";
import type { ProduitDb } from "@/lib/comptes";
import { arrondi7 } from "@/lib/store";

/** État d'une ligne du panier après relecture de la base. */
export type EtatLigne = "ok" | "retire" | "stock" | "propre";

export type LignePanier = {
  produitId: string;
  quantite: number;
  titre: string;
  photo: string | null;
  unite: string;
  prixUnitaire: number;
  produit: ProduitDb | null;
  etat: EtatLigne;
  sousTotal: number;
};

export type GroupeVendeur = {
  vendeurId: string;
  lignes: LignePanier[];
  sousTotal: number;
  nbLignes: number;
};

export type EtatPanier = {
  lignes: LignePanier[];
  groupes: GroupeVendeur[];
  total: number;
  /** Annonces de l'utilisateur lui-même : à retirer du panier (auto-achat). */
  aRetirer: string[];
};

/** Relecture du stock réel depuis la base (à chaque ouverture du panier). */
export async function chargerProduitsParIds(ids: string[]): Promise<ProduitDb[]> {
  const uniques = [...new Set(ids)].filter((x) => !!x);
  if (!uniques.length) return [];
  const { data } = await supabase.from("produits").select("*").in("id", uniques);
  return (data as ProduitDb[] | null) ?? [];
}

/**
 * Croise le panier local avec l'état courant de la base.
 *  · produit introuvable ou retiré → « retire », exclu du total ;
 *  · stock insuffisant            → « stock », exclu du total ;
 *  · annonce de l'utilisateur     → « propre », retiré du panier ;
 *  · quantité < quantite_min      → relevée au minimum.
 */
export function construireEtatPanier(
  panier: { produitId: string; quantite: number; titre?: string }[],
  produits: ProduitDb[],
  moiId: string | null,
): EtatPanier {
  const aRetirer: string[] = [];
  const lignes: LignePanier[] = panier.map((l) => {
    const produit = produits.find((p) => p.id === l.produitId) ?? null;
    const base = {
      produitId: l.produitId,
      titre: produit?.titre ?? l.titre ?? "Article",
      photo: produit?.photo_url ?? null,
      unite: produit?.unite ?? "unité",
      prixUnitaire: produit ? Number(produit.prix) : 0,
      produit,
    };
    // Auto-achat interdit : l'annonce appartient à l'utilisateur.
    if (moiId && produit?.vendeur_id === moiId) {
      aRetirer.push(l.produitId);
      return { ...base, quantite: l.quantite, etat: "propre", sousTotal: 0 };
    }
    // Annonce supprimée ou mise hors ligne.
    if (!produit || !produit.publie) {
      return { ...base, quantite: l.quantite, etat: "retire", sousTotal: 0 };
    }
    const min = Math.max(1, produit.quantite_min ?? 1);
    const quantite = Math.max(min, Math.floor(l.quantite) || min);
    if (quantite > produit.stock) {
      return { ...base, quantite, etat: "stock", sousTotal: 0 };
    }
    return {
      ...base,
      quantite,
      etat: "ok",
      sousTotal: arrondi7(base.prixUnitaire * quantite),
    };
  });

  const groupes = regrouperParVendeur(lignes.filter((l) => l.etat === "ok"));
  const total = arrondi7(groupes.reduce((s, g) => s + g.sousTotal, 0));
  return { lignes, groupes, total, aRetirer };
}

/** Un panier se règle vendeur par vendeur : une commande = un vendeur. */
export function regrouperParVendeur(lignes: LignePanier[]): GroupeVendeur[] {
  const parVendeur = new Map<string, LignePanier[]>();
  for (const l of lignes) {
    const vendeurId = l.produit?.vendeur_id;
    if (!vendeurId) continue;
    const liste = parVendeur.get(vendeurId);
    if (liste) liste.push(l);
    else parVendeur.set(vendeurId, [l]);
  }
  return [...parVendeur.entries()]
    .map(([vendeurId, ls]) => ({
      vendeurId,
      lignes: ls,
      sousTotal: arrondi7(ls.reduce((s, l) => s + l.sousTotal, 0)),
      nbLignes: ls.length,
    }))
    .sort((a, b) => a.vendeurId.localeCompare(b.vendeurId));
}
