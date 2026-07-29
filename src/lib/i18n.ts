import { useSyncExternalStore } from "react";

export type Langue = "fr" | "rn" | "sw" | "en";

export const langues: { code: Langue; nom: string; drapeau: string }[] = [
  { code: "fr", nom: "Français", drapeau: "🇫🇷" },
  { code: "rn", nom: "Kirundi", drapeau: "🇧🇮" },
  { code: "sw", nom: "Kiswahili", drapeau: "🇹🇿" },
  { code: "en", nom: "English", drapeau: "🇬🇧" },
];

type Cle =
  | "accueil" | "jobs" | "market" | "chat" | "profil" | "vendeurs" | "favoris" | "wallet"
  | "parametres" | "notifications" | "retour" | "rechercher" | "rechercherPlaceholder"
  | "voirTout" | "acheter" | "panier" | "vendre" | "maBoutique" | "contactWhatsapp"
  | "selectionRecommandee" | "nouvellesAnnonces" | "tendances" | "pourVous" | "abonnements"
  | "bonjour" | "invite" | "seConnecter" | "seDeconnecter" | "creerCompte" | "langue"
  | "inscriptionRequise" | "inscriptionRequiseTexte" | "tout" | "aucunResultat"
  | "produitsCommunaute" | "prix" | "stock" | "categories" | "trouverVendeur" | "sloganAccueil";

const fr: Record<Cle, string> = {
  accueil: "Accueil", jobs: "Emplois", market: "Market", chat: "Chat", profil: "Profil",
  vendeurs: "Vendeurs", favoris: "Favoris", wallet: "Portefeuille", parametres: "Paramètres",
  notifications: "Notifications", retour: "Retour", rechercher: "Rechercher",
  rechercherPlaceholder: "Rechercher un produit, un service, un vendeur…",
  voirTout: "Voir tout", acheter: "Acheter", panier: "Panier", vendre: "Vendre",
  maBoutique: "Ma boutique", contactWhatsapp: "Contacter sur WhatsApp",
  selectionRecommandee: "Sélection recommandée", nouvellesAnnonces: "Nouvelles annonces",
  tendances: "Tendances", pourVous: "Pour vous", abonnements: "Abonnements",
  bonjour: "Bonjour", invite: "Invité", seConnecter: "Se connecter", seDeconnecter: "Se déconnecter",
  creerCompte: "Créer un compte", langue: "Langue",
  inscriptionRequise: "Inscription requise",
  inscriptionRequiseTexte: "Créez un compte gratuit pour utiliser Burundi Pi Connect.",
  tout: "Tout", aucunResultat: "Aucun résultat", produitsCommunaute: "Produits de la communauté",
  prix: "Prix", stock: "Stock", categories: "Catégories", trouverVendeur: "Trouver un vendeur",
  sloganAccueil: "Emplois, marché et paiements en Pi",
};

const rn: Record<Cle, string> = {
  accueil: "Ahabanza", jobs: "Akazi", market: "Isoko", chat: "Ubutumwa", profil: "Umwirondoro",
  vendeurs: "Abadandaza", favoris: "Ivyo nkunda", wallet: "Uruvyaro rwa Pi", parametres: "Ingene bimeze",
  notifications: "Integuza", retour: "Subira inyuma", rechercher: "Rondera",
  rechercherPlaceholder: "Rondera igicuruzwa, serivisi canke umudandaza…",
  voirTout: "Raba vyose", acheter: "Gura", panier: "Agasho", vendre: "Dandaza",
  maBoutique: "Iduka ryanje", contactWhatsapp: "Vugana kuri WhatsApp",
  selectionRecommandee: "Ivyatoranijwe", nouvellesAnnonces: "Ivyashizweho vishasha",
  tendances: "Ibikundwa", pourVous: "Kuri wewe", abonnements: "Abo ukurikira",
  bonjour: "Bwakeye", invite: "Umushitsi", seConnecter: "Injira", seDeconnecter: "Sohoka",
  creerCompte: "Iyandikishe", langue: "Ururimi",
  inscriptionRequise: "Kwiyandikisha birakenewe",
  inscriptionRequiseTexte: "Iyandikishe ku buntu kugira ukoreshe Burundi Pi Connect.",
  tout: "Vyose", aucunResultat: "Nta co vyabonetse", produitsCommunaute: "Ibicuruzwa vy'abanyagihugu",
  prix: "Igiciro", stock: "Ibihari", categories: "Ubwoko", trouverVendeur: "Rondera umudandaza",
  sloganAccueil: "Akazi, isoko n'ukuriha muri Pi",
};

const sw: Record<Cle, string> = {
  accueil: "Mwanzo", jobs: "Kazi", market: "Soko", chat: "Gumzo", profil: "Wasifu",
  vendeurs: "Wauzaji", favoris: "Vipendwa", wallet: "Pochi ya Pi", parametres: "Mipangilio",
  notifications: "Arifa", retour: "Rudi", rechercher: "Tafuta",
  rechercherPlaceholder: "Tafuta bidhaa, huduma au muuzaji…",
  voirTout: "Ona zote", acheter: "Nunua", panier: "Kikapu", vendre: "Uza",
  maBoutique: "Duka langu", contactWhatsapp: "Wasiliana kwa WhatsApp",
  selectionRecommandee: "Uteuzi uliopendekezwa", nouvellesAnnonces: "Matangazo mapya",
  tendances: "Zinazovuma", pourVous: "Kwa ajili yako", abonnements: "Unaofuata",
  bonjour: "Habari", invite: "Mgeni", seConnecter: "Ingia", seDeconnecter: "Toka",
  creerCompte: "Fungua akaunti", langue: "Lugha",
  inscriptionRequise: "Usajili unahitajika",
  inscriptionRequiseTexte: "Fungua akaunti bure ili kutumia Burundi Pi Connect.",
  tout: "Zote", aucunResultat: "Hakuna matokeo", produitsCommunaute: "Bidhaa za jamii",
  prix: "Bei", stock: "Hisa", categories: "Makundi", trouverVendeur: "Tafuta muuzaji",
  sloganAccueil: "Kazi, soko na malipo kwa Pi",
};

const en: Record<Cle, string> = {
  accueil: "Home", jobs: "Jobs", market: "Market", chat: "Chat", profil: "Profile",
  vendeurs: "Sellers", favoris: "Favourites", wallet: "Pi Wallet", parametres: "Settings",
  notifications: "Notifications", retour: "Back", rechercher: "Search",
  rechercherPlaceholder: "Search a product, a service, a seller…",
  voirTout: "See all", acheter: "Buy", panier: "Cart", vendre: "Sell",
  maBoutique: "My shop", contactWhatsapp: "Contact on WhatsApp",
  selectionRecommandee: "Recommended selection", nouvellesAnnonces: "New listings",
  tendances: "Trending", pourVous: "For you", abonnements: "Following",
  bonjour: "Hello", invite: "Guest", seConnecter: "Sign in", seDeconnecter: "Sign out",
  creerCompte: "Create account", langue: "Language",
  inscriptionRequise: "Sign-up required",
  inscriptionRequiseTexte: "Create a free account to use Burundi Pi Connect.",
  tout: "All", aucunResultat: "No results", produitsCommunaute: "Community products",
  prix: "Price", stock: "Stock", categories: "Categories", trouverVendeur: "Find a seller",
  sloganAccueil: "Jobs, marketplace and payments in Pi",
};

const dictionnaires: Record<Langue, Record<Cle, string>> = { fr, rn, sw, en };

const CLE_STOCKAGE = "bpc-langue";
let langueCourante: Langue = "fr";
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  const sauvegardee = window.localStorage.getItem(CLE_STOCKAGE) as Langue | null;
  if (sauvegardee && dictionnaires[sauvegardee]) langueCourante = sauvegardee;
}

export function definirLangue(l: Langue) {
  langueCourante = l;
  if (typeof window !== "undefined") window.localStorage.setItem(CLE_STOCKAGE, l);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useLangue(): Langue {
  return useSyncExternalStore(subscribe, () => langueCourante, () => "fr" as Langue);
}

export function useT() {
  const l = useLangue();
  return (cle: Cle) => dictionnaires[l][cle] ?? dictionnaires.fr[cle];
}
