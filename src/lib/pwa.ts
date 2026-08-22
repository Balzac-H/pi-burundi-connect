/**
 * Enregistrement contrôlé du service worker (mode hors-ligne).
 * Jamais actif en développement, dans un iframe ou dans les aperçus Lovable.
 */
const CHEMIN_SW = "/sw.js";

function contexteInterdit(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  const h = window.location.hostname;
  if (h.startsWith("id-preview--") || h.startsWith("preview--")) return true;
  if (h === "lovableproject.com" || h.endsWith(".lovableproject.com")) return true;
  if (h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com")) return true;
  if (h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function desenregistrer() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? "").endsWith(CHEMIN_SW))
      .map((r) => r.unregister()),
  );
}

export function enregistrerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (contexteInterdit()) {
    void desenregistrer();
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(CHEMIN_SW, { scope: "/" }).catch(() => {
      /* hors-ligne : réessai au prochain chargement */
    });
  });
}
