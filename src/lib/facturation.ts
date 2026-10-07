import { useCallback, useSyncExternalStore } from "react";

/**
 * Taux de commission prélevé UNIQUEMENT côté vendeur, au moment où la vente
 * est confirmée. Configurable sans recoder via la variable d'environnement
 * VITE_TAUX_COMMISSION (exprimée en pourcentage, ex. "2.5").
 * Bornes métier : 1 % à 3 %.
 */
const TAUX_MIN = 0.01;
const TAUX_MAX = 0.03;
const TAUX_DEFAUT = 0.02;

export function tauxCommission(): number {
  const brut = Number(import.meta.env["VITE_TAUX_COMMISSION"]);
  if (!Number.isFinite(brut) || brut <= 0) return TAUX_DEFAUT;
  const taux = brut > 1 ? brut / 100 : brut;
  return Math.min(TAUX_MAX, Math.max(TAUX_MIN, taux));
}

export type LigneFacture = { libelle: string; quantite: number; montant: number };

export type Facture = {
  id: string;
  date: string; // ISO
  acheteur: string;
  vendeur: string;
  lignes: LigneFacture[];
  montantBrut: number; // payé par l'acheteur (prix affiché, sans frais cachés)
  livraison: number;
  tauxCommission: number; // ex. 0.02
  commission: number; // montant prélevé au vendeur
  montantNetVendeur: number;
  statut: "payee";
};

export function calculerFacture(params: {
  acheteur: string;
  vendeur: string;
  lignes: LigneFacture[];
  livraison?: number;
}): Facture {
  const livraison = params.livraison ?? 0;
  const produits = params.lignes.reduce((s, l) => s + l.montant, 0);
  const taux = tauxCommission();
  const commission = arrondi(produits * taux);
  return {
    id: `ARIJA-${Date.now().toString().slice(-10)}`,
    date: new Date().toISOString(),
    acheteur: params.acheteur,
    vendeur: params.vendeur,
    lignes: params.lignes,
    montantBrut: arrondi(produits + livraison),
    livraison,
    tauxCommission: taux,
    commission,
    montantNetVendeur: arrondi(produits - commission),
    statut: "payee",
  };
}

const arrondi = (n: number) => Math.round(n * 1e6) / 1e6;

/* ---- Stockage local des factures (en attendant l'intégration Pi) ---- */

const CLE = "wico-factures";
const VIDE: Facture[] = [];
let factures: Facture[] = VIDE;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  try {
    const brut = window.localStorage.getItem(CLE);
    if (brut) factures = JSON.parse(brut) as Facture[];
  } catch {
    factures = VIDE;
  }
}

function persister() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CLE, JSON.stringify(factures.slice(0, 100)));
  }
  listeners.forEach((l) => l());
}

export function enregistrerFacture(f: Facture) {
  factures = [f, ...factures].slice(0, 100);
  persister();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const getFactures = () => factures;
const getFacturesServer = () => VIDE;

export function useFactures(): Facture[] {
  return useSyncExternalStore(
    subscribe,
    useCallback(getFactures, []),
    useCallback(getFacturesServer, []),
  );
}
