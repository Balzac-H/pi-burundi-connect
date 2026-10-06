import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * État local de l'application (hors compte).
 * Tout ce qui concerne le compte, les annonces, les commandes et les suivis
 * vit dans Supabase ; ici il ne reste que les préférences de l'appareil.
 */
export type AppState = {
  favoris: string[];
  panier: { produitId: string; quantite: number }[];
  candidatures: string[];
};

const initial: AppState = {
  favoris: [],
  panier: [],
  candidatures: [],
};

let state: AppState = initial;
const listeners = new Set<() => void>();

const CLE = "bpc-preferences";

function set(partiel: Partial<AppState>) {
  state = { ...state, ...partiel };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CLE, JSON.stringify(state));
    } catch {
      /* stockage indisponible */
    }
  }
  listeners.forEach((l) => l());
}

/** Restaure les préférences de l'appareil après le rendu (évite tout écart SSR). */
export function chargerEtatLocal() {
  if (typeof window === "undefined") return;
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return;
    const lu = JSON.parse(brut) as Partial<AppState>;
    state = {
      favoris: Array.isArray(lu.favoris) ? lu.favoris : [],
      panier: Array.isArray(lu.panier) ? lu.panier : [],
      candidatures: Array.isArray(lu.candidatures) ? lu.candidatures : [],
    };
    listeners.forEach((l) => l());
  } catch {
    state = initial;
  }
}

export const store = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
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
      ? state.panier.map((p) =>
          p.produitId === produitId ? { ...p, quantite: p.quantite + quantite } : p,
        )
      : [...state.panier, { produitId, quantite }];
    set({ panier });
  },
  retirerDuPanier(produitId: string) {
    set({ panier: state.panier.filter((p) => p.produitId !== produitId) });
  },
  definirQuantite(produitId: string, quantite: number) {
    set({ panier: state.panier.map((p) => (p.produitId === produitId ? { ...p, quantite } : p)) });
  },
  viderPanier() {
    set({ panier: [] });
  },
  postuler(jobId: string) {
    if (!state.candidatures.includes(jobId)) set({ candidatures: [...state.candidatures, jobId] });
  },
  annulerCandidature(jobId: string) {
    set({ candidatures: state.candidatures.filter((c) => c !== jobId) });
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

  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
}

export const formatPi = (n: number) =>
  `${n.toLocaleString("fr-FR", { minimumFractionDigits: n < 0.01 ? 3 : 2, maximumFractionDigits: 4 })} π`;

export { shallowEqual };
