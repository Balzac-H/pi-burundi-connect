const depuisProcess = (cle: string): string => {
  if (typeof process === "undefined") return "";
  return process.env?.[cle] ?? "";
};

const BRUT_BASE = String(import.meta.env.VITE_APP_URL || depuisProcess("VITE_APP_URL") || "");

export const BASE_URL = BRUT_BASE.replace(/\/+$/, "");

export function urlAbsolue(chemin: string): string {
  if (!BASE_URL) return chemin;
  return `${BASE_URL}${chemin.startsWith("/") ? "" : "/"}${chemin}`;
}

const BRUT_DOMAINE = String(
  import.meta.env.VITE_ACCOUNT_EMAIL_DOMAIN || depuisProcess("VITE_ACCOUNT_EMAIL_DOMAIN") || "",
);

export const DOMAINE_EMAIL_COMPTE =
  BRUT_DOMAINE.replace(/^@/, "").replace(/\.+$/, "") || "pi.wico.app";
