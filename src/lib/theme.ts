import { useSyncExternalStore } from "react";

export type Theme = "clair" | "sombre" | "auto";

const CLE = "wico-theme";
const abonnes = new Set<() => void>();
let courant: Theme = "auto";

function lireStockage(): Theme {
  if (typeof window === "undefined") return "auto";
  const v = window.localStorage.getItem(CLE);
  return v === "clair" || v === "sombre" || v === "auto" ? v : "auto";
}

function sombreSysteme() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function appliquer(theme: Theme) {
  if (typeof document === "undefined") return;
  const sombre = theme === "sombre" || (theme === "auto" && sombreSysteme());
  document.documentElement.classList.toggle("dark", sombre);
  document.documentElement.style.colorScheme = sombre ? "dark" : "light";
}

export function initTheme() {
  courant = lireStockage();
  appliquer(courant);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => courant === "auto" && appliquer(courant));
}

export function definirTheme(theme: Theme) {
  courant = theme;
  if (typeof window !== "undefined") window.localStorage.setItem(CLE, theme);
  appliquer(theme);
  abonnes.forEach((f) => f());
}

function abonner(f: () => void) {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

const snapshotServeur = () => "auto" as Theme;

export function useTheme(): Theme {
  return useSyncExternalStore(abonner, () => courant, snapshotServeur);
}

export const themes: { code: Theme; nom: string; icone: string }[] = [
  { code: "clair", nom: "Clair", icone: "☀️" },
  { code: "sombre", nom: "Sombre", icone: "🌙" },
  { code: "auto", nom: "Automatique (système)", icone: "🖥️" },
];
