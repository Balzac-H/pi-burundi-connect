import { calculerFacture, enregistrerFacture, type Facture, type LigneFacture } from "@/lib/facturation";

export type DemandePaiement = {
  acheteur: string;
  vendeur: string;
  lignes: LigneFacture[];
  livraison?: number;
};

export type ResultatPaiement =
  | { ok: true; reference: string; facture: Facture }
  | { ok: false; erreur: string };

/**
 * Point d'entrée UNIQUE du paiement.
 * Aujourd'hui : simulation locale (aucun paiement réel).
 * Demain : remplacer le corps par l'appel Pi App Studio / Pi SDK,
 * la signature et la facturation restent identiques.
 */
export async function processPayment(demande: DemandePaiement): Promise<ResultatPaiement> {
  const total =
    demande.lignes.reduce((s, l) => s + l.montant, 0) + (demande.livraison ?? 0);
  if (total <= 0) return { ok: false, erreur: "Montant invalide." };

  const facture = calculerFacture(demande);
  enregistrerFacture(facture);
  return { ok: true, reference: facture.id, facture };
}
