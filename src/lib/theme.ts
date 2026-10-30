import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  supabase.auth.onAuthStateChange((evt, session) => {
    if ((evt === "SIGNED_IN" || evt === "INITIAL_SESSION") && session?.user) {
      setTimeout(() => chargerThemeCompte(session.user.id), 0);
    }
  });
}

function appliquerLocal(theme: Theme) {
  courant = theme;
  if (typeof window !== "undefined") window.localStorage.setItem(CLE, theme);
  appliquer(theme);
  abonnes.forEach((f) => f());
}

/** Charge le thème mémorisé dans le compte à chaque connexion. */
async function chargerThemeCompte(userId: string) {
  const { data } = await supabase.from("profils").select("theme").eq("id", userId).maybeSingle();
  const t = (data as { theme?: string | null } | null)?.theme;
  if (t === "clair" || t === "sombre" || t === "auto") appliquerLocal(t);
}

export function definirTheme(theme: Theme) {
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) supabase.from("profils").update({ theme } as never).eq("id", data.user.id).then(() => {});
  });
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
