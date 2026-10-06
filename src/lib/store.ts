import { useCallback, useRef, useSyncExternalStore } from "react";

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
  suivis: [],
  favoris: [],
  panier: [],
  soldePi: 0,
  soldeEscrow: 0,
  notificationsNonLues: 0,
  candidatures: [],
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

function shallowEqual(a: unknown, b: unknown) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a == null || b == null) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if ((b as Record<string, unknown>)[k] !== (a as Record<string, unknown>)[k]) return false;
  }
  return true;
}

const serverSnapshots = new WeakMap<(s: AppState) => unknown, unknown>();

export function useStore<T>(selecteur: (s: AppState) => T): T {
  const selecteurRef = useRef(selecteur);
  selecteurRef.current = selecteur;

  const getSnapshot = useCallback(() => selecteurRef.current(state), []);

  const getServerSnapshot = useCallback(() => {
    let cached = serverSnapshots.get(selecteurRef.current);
    if (cached === undefined) {
      cached = selecteurRef.current(initial);
      serverSnapshots.set(selecteurRef.current, cached);
    }
    return cached as T;
  }, []);

  return useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getServerSnapshot,
  );
}

export const formatPi = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: n < 0.01 ? 3 : 2, maximumFractionDigits: 4 })} π`;
export const enFBu = (pi: number) =>
  `${Math.round(pi * 3_000_000).toLocaleString("fr-FR")} FBu`;
