/** Chemin de retour après connexion : strictement local (« /…”), jamais externe. */
export function cheminRetour(brut: unknown, defaut = "/"): string {
  if (typeof brut !== "string") return defaut;
  if (!brut.startsWith("/") || brut.startsWith("//") || brut.startsWith("/\\")) return defaut;
  return brut;
}

/** Lien de connexion qui ramène l'utilisateur à sa page d'origine. */
export function lienConnexion(retour: string): string {
  return `/connexion?retour=${encodeURIComponent(retour)}`;
}
