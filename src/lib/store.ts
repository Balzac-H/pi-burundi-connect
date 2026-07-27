import { useSyncExternalStore } from "react";

export type AppState = {
  connecte: boolean;
  utilisateurId: string;
  suivis: string[];
  favoris: string[];
  panier: { produitId: string; quantite: number }[];
  soldePi: number;
  soldeEscrow: number;
  notificationsNonLues: number;
  candidatures: string[];
};

const initial: AppState = {
  connecte: true,
  utilisateurId: "u-moi",
  suivis: ["u-marie"],
  favoris: ["p-tomates"],
  panier: [],
  soldePi: 15230,
  soldeEscrow: 2500,
  notificationsNonLues: 3,
  candidatures: ["j-menuiserie"],
};

let state: AppState = initial;
const listeners = new Set<() => void>();

function set(partiel: Partial<AppState>) {
  state = { ...state, ...partiel };
  listeners.forEach((l) => l());
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  basculerSuivi(id: string) {
    const suivis = state.suivis.includes(id)
      ? state.suivis.filter((s) => s !== id)
      : [...state.suivis, id];
    set({ suivis });
  },
  basculerFavori(id: string) {
    const favoris = state.favoris.includes(id)
      ? state.favoris.filter((s) => s !== id)
      : [...state.favoris, id];
    set({ favoris });
  },
  ajouterAuPanier(produitId: string, quantite = 1) {
    const existant = state.panier.find((p) => p.produitId === produitId);
    const panier = existant
      ? state.panier.map((p) => (p.produitId === produitId ? { ...p, quantite: p.quantite + quantite } : p))
      : [...state.panier, { produitId, quantite }];
    set({ panier });
  },
  retirerDuPanier(produitId: string) {
    set({ panier: state.panier.filter((p) => p.produitId !== produitId) });
  },
  viderPanier() {
    set({ panier: [] });
  },
  debiter(montant: number) {
    set({ soldePi: Math.max(0, state.soldePi - montant) });
  },
  postuler(jobId: string) {
    if (!state.candidatures.includes(jobId)) set({ candidatures: [...state.candidatures, jobId] });
  },
  annulerCandidature(jobId: string) {
    set({ candidatures: state.candidatures.filter((c) => c !== jobId) });
  },
  lireNotifications() {
    set({ notificationsNonLues: 0 });
  },
};

export function useStore<T>(selecteur: (s: AppState) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selecteur(state),
    () => selecteur(initial),
  );
}

export const formatPi = (n: number) => `${n.toLocaleString("fr-FR")} Pi`;
export const enFBu = (pi: number) => `${(pi * 3).toLocaleString("fr-FR")} FBu`;
