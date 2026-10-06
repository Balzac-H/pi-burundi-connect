import { useCallback, useSyncExternalStore } from "react";

export type Langue = "fr" | "rn" | "sw" | "en";

export const langues: { code: Langue; nom: string; drapeau: string }[] = [
  { code: "fr", nom: "Français", drapeau: "🇫🇷" },
  { code: "rn", nom: "Kirundi", drapeau: "🇧🇮" },
  { code: "sw", nom: "Kiswahili", drapeau: "🇹🇿" },
  { code: "en", nom: "English", drapeau: "🇬🇧" },
];

type Cle =
  | "accueil"
  | "jobs"
  | "market"
  | "chat"
  | "profil"
  | "vendeurs"
  | "favoris"
  | "wallet"
  | "parametres"
  | "notifications"
  | "retour"
  | "rechercher"
  | "rechercherPlaceholder"
  | "voirTout"
  | "acheter"
  | "panier"
  | "vendre"
  | "maBoutique"
  | "contactWhatsapp"
  | "selectionRecommandee"
  | "nouvellesAnnonces"
  | "tendances"
  | "pourVous"
  | "abonnements"
  | "bonjour"
  | "invite"
  | "seConnecter"
  | "seDeconnecter"
  | "creerCompte"
  | "langue"
  | "inscriptionRequise"
  | "inscriptionRequiseTexte"
  | "tout"
  | "aucunResultat"
  | "produitsCommunaute"
  | "prix"
  | "stock"
  | "categories"
  | "trouverVendeur"
  | "sloganAccueil"
  | "seConnecterPi"
  | "piBrowserRequis"
  | "explorerSansCompte"
  | "mesCommandes"
  | "aucuneAnnonce"
  | "aucuneOffre"
  | "aucuneCommande"
  | "aucunMessage"
  | "aucuneConversation"
  | "aucuneNotification"
  | "aucunFavori"
  | "aucunSuivi"
  | "aucunAvis"
  | "conditions"
  | "confidentialite"
  | "aValider"
  | "confirmerReception"
  | "signalerProbleme"
  | "paiementEnCours"
  | "paiementConfirme"
  | "paiementAnnule"
  | "acheterMaintenant"
  | "ajouterPanier"
  | "connexionRequise"
  | "supprimerCompte"
  | "liberer"
  | "accesRestreint"
  | "produitsSauvegardes"
  | "profilsSuivis"
  | "tousLesMembres"
  | "derniereMaj"
  | "avis"
  | "statistiques"
  | "abonnes"
  | "abonnementsCourt"
  | "offresPubliees"
  | "ventesConfirmees";

const fr: Record<Cle, string> = {
  accueil: "Accueil",
  jobs: "Emplois",
  market: "Market",
  chat: "Chat",
  profil: "Profil",
  vendeurs: "Vendeurs",
  favoris: "Favoris",
  wallet: "Portefeuille",
  parametres: "Paramètres",
  notifications: "Notifications",
  retour: "Retour",
  rechercher: "Rechercher",
  rechercherPlaceholder: "Rechercher un produit, un service, un vendeur…",
  voirTout: "Voir tout",
  acheter: "Acheter",
  panier: "Panier",
  vendre: "Vendre",
  maBoutique: "Ma boutique",
  contactWhatsapp: "Contacter sur WhatsApp",
  selectionRecommandee: "Sélection recommandée",
  nouvellesAnnonces: "Nouvelles annonces",
  tendances: "Tendances",
  pourVous: "Pour vous",
  abonnements: "Abonnements",
  bonjour: "Bonjour",
  invite: "Invité",
  seConnecter: "Se connecter",
  seDeconnecter: "Se déconnecter",
  creerCompte: "Créer un compte",
  langue: "Langue",
  inscriptionRequise: "Inscription requise",
  inscriptionRequiseTexte: "Créez un compte gratuit pour utiliser WICO.",
  tout: "Tout",
  aucunResultat: "Aucun résultat",
  produitsCommunaute: "Produits de la communauté",
  prix: "Prix",
  stock: "Stock",
  categories: "Catégories",
  trouverVendeur: "Trouver un vendeur",
  sloganAccueil: "Emplois, marché et paiements en Pi",
  seConnecterPi: "Se connecter avec Pi",
  piBrowserRequis: "Ouvrez WICO dans le Pi Browser pour payer en Pi.",
  explorerSansCompte: "Explorer sans compte",
  mesCommandes: "Mes commandes et paiements",
  aucuneAnnonce: "Aucune annonce pour le moment.",
  aucuneOffre: "Aucune offre pour le moment.",
  aucuneCommande: "Aucune commande pour le moment.",
  aucunMessage: "Aucun message pour le moment.",
  aucuneConversation: "Aucune conversation pour le moment.",
  aucuneNotification: "Aucune notification pour le moment.",
  aucunFavori: "Aucun favori pour l'instant.",
  aucunSuivi: "Vous ne suivez encore personne.",
  aucunAvis: "Aucun avis pour le moment.",
  conditions: "Conditions",
  confidentialite: "Confidentialité",
  aValider: "Document à faire valider par un conseil juridique.",
  confirmerReception: "Confirmer la réception",
  signalerProbleme: "Signaler un problème",
  paiementEnCours: "Paiement en cours…",
  paiementConfirme: "Paiement confirmé",
  paiementAnnule: "Paiement annulé",
  acheterMaintenant: "Acheter maintenant",
  ajouterPanier: "Ajouter au panier",
  connexionRequise: "Connexion Pi requise",
  supprimerCompte: "Supprimer mon compte et mes données",
  liberer: "Libérer",
  accesRestreint: "Accès réservé aux administrateurs.",
  produitsSauvegardes: "Produits sauvegardés",
  profilsSuivis: "Profils suivis",
  tousLesMembres: "Tous les membres",
  derniereMaj: "Dernière mise à jour : 6 octobre 2026.",
  avis: "Avis",
  statistiques: "Statistiques",
  abonnes: "Abonnés",
  abonnementsCourt: "Abonnements",
  offresPubliees: "Offres publiées",
  ventesConfirmees: "Ventes confirmées",
};

const rn: Record<Cle, string> = {
  accueil: "Ahabanza",
  jobs: "Akazi",
  market: "Isoko",
  chat: "Ubutumwa",
  profil: "Umwirondoro",
  vendeurs: "Abadandaza",
  favoris: "Ivyo nkunda",
  wallet: "Uruvyaro rwa Pi",
  parametres: "Ingene bimeze",
  notifications: "Integuza",
  retour: "Subira inyuma",
  rechercher: "Rondera",
  rechercherPlaceholder: "Rondera igicuruzwa, serivisi canke umudandaza…",
  voirTout: "Raba vyose",
  acheter: "Gura",
  panier: "Agasho",
  vendre: "Dandaza",
  maBoutique: "Iduka ryanje",
  contactWhatsapp: "Vugana kuri WhatsApp",
  selectionRecommandee: "Ivyatoranijwe",
  nouvellesAnnonces: "Ivyashizweho vishasha",
  tendances: "Ibikundwa",
  pourVous: "Kuri wewe",
  abonnements: "Abo ukurikira",
  bonjour: "Bwakeye",
  invite: "Umushitsi",
  seConnecter: "Injira",
  seDeconnecter: "Sohoka",
  creerCompte: "Iyandikishe",
  langue: "Ururimi",
  inscriptionRequise: "Kwiyandikisha birakenewe",
  inscriptionRequiseTexte: "Iyandikishe ku buntu kugira ukoreshe WICO.",
  tout: "Vyose",
  aucunResultat: "Nta co vyabonetse",
  produitsCommunaute: "Ibicuruzwa vy'abanyagihugu",
  prix: "Igiciro",
  stock: "Ibihari",
  categories: "Ubwoko",
  trouverVendeur: "Rondera umudandaza",
  sloganAccueil: "Akazi, isoko n'ukuriha muri Pi",
  seConnecterPi: "Injira na Pi",
  piBrowserRequis: "Fungura WICO muri Pi Browser kugira ukore ukwishyura na Pi.",
  explorerSansCompte: "Shakisha nta konti",
  mesCommandes: "Amabwiriza n'ibishyurwa byanje",
  aucuneAnnonce: "Nta tandukiriza ine ubu.",
  aucuneOffre: "Nta muhaye akazi ubu.",
  aucuneCommande: "Nta kuguru ingirakamaro ubu.",
  aucunMessage: "Nta butumwa ubu.",
  aucuneConversation: "Nta kukigana ubu.",
  aucuneNotification: "Nta kumenyesha ubu.",
  aucunFavori: "Nta vyakunywe kora.",
  aucunSuivi: "Dahera utarikurikira.",
  aucunAvis: "Nta mitso ubu.",
  conditions: "Amategeko",
  confidentialite: "Kubitsa ibanga",
  aValider: "Uyu mwandiko rugenya kubw'umuyobozi w'amategeko.",
  confirmerReception: "Emeza kwakira",
  signalerProbleme: "Menyesha ikibazo",
  paiementEnCours: "Ubishyurwa…",
  paiementConfirme: "Ubishyurwe neza",
  paiementAnnule: "Kwishyura kwahagaritswe",
  acheterMaintenant: "Gura ubu",
  ajouterPanier: "Shyira mu gasho",
  connexionRequise: "Kwiyandikisha na Pi birakenewe",
  supprimerCompte: "Sensa konti n'amakuru yanjye",
  liberer: "Ohereza",
  accesRestreint: "Kwinjira ni abobozi gusa.",
  produitsSauvegardes: "Ibicuruzwa vyabitswe",
  profilsSuivis: "Umwirondoro wakurikiriwe",
  tousLesMembres: "Bose",
  derniereMaj: "Imbvura nyuma: 6 Ukwakira 2026.",
  avis: "Imitsa",
  statistiques: "Umubare",
  abonnes: "Bakugumye",
  abonnementsCourt: "Ukurikira",
  offresPubliees: "Amasomo yashizwe",
  ventesConfirmees: "Ibyatanzwe neza",
};

const sw: Record<Cle, string> = {
  accueil: "Mwanzo",
  jobs: "Kazi",
  market: "Soko",
  chat: "Gumzo",
  profil: "Wasifu",
  vendeurs: "Wauzaji",
  favoris: "Vipendwa",
  wallet: "Pochi ya Pi",
  parametres: "Mipangilio",
  notifications: "Arifa",
  retour: "Rudi",
  rechercher: "Tafuta",
  rechercherPlaceholder: "Tafuta bidhaa, huduma au muuzaji…",
  voirTout: "Ona zote",
  acheter: "Nunua",
  panier: "Kikapu",
  vendre: "Uza",
  maBoutique: "Duka langu",
  contactWhatsapp: "Wasiliana kwa WhatsApp",
  selectionRecommandee: "Uteuzi uliopendekezwa",
  nouvellesAnnonces: "Matangazo mapya",
  tendances: "Zinazovuma",
  pourVous: "Kwa ajili yako",
  abonnements: "Unaofuata",
  bonjour: "Habari",
  invite: "Mgeni",
  seConnecter: "Ingia",
  seDeconnecter: "Toka",
  creerCompte: "Fungua akaunti",
  langue: "Lugha",
  inscriptionRequise: "Usajili unahitajika",
  inscriptionRequiseTexte: "Fungua akaunti bure ili kutumia WICO.",
  tout: "Zote",
  aucunResultat: "Hakuna matokeo",
  produitsCommunaute: "Bidhaa za jamii",
  prix: "Bei",
  stock: "Hisa",
  categories: "Makundi",
  trouverVendeur: "Tafuta muuzaji",
  sloganAccueil: "Kazi, soko na malipo kwa Pi",
  seConnecterPi: "Ingia kwa Pi",
  piBrowserRequis: "Fungua WICO kwenye Pi Browser ili kulipa kwa Pi.",
  explorerSansCompte: "Vinjiri bila akaunti",
  mesCommandes: "Maagizo na malipo yangu",
  aucuneAnnonce: "Hakuna matangazo kwa sasa.",
  aucuneOffre: "Hakuna nafasi za kazi kwa sasa.",
  aucuneCommande: "Hakuna agizo kwa sasa.",
  aucunMessage: "Hakuna ujumbe kwa sasa.",
  aucuneConversation: "Hakuna mazungumzo kwa sasa.",
  aucuneNotification: "Hakuna arifa kwa sasa.",
  aucunFavori: "Hakuna unayopenda kwa sasa.",
  aucunSuivi: "Bado hufuati mtu yeyote.",
  aucunAvis: "Hakuna maoni kwa sasa.",
  conditions: "Masharti",
  confidentialite: "Faragha",
  aValider: "Hati hii inahitajika kuthibitishwa na mwanasheria.",
  confirmerReception: "Thibitisha upokeaji",
  signalerProbleme: "Ripoti tatizo",
  paiementEnCours: "Malipo yanapoendelea…",
  paiementConfirme: "Malipo yamethibitishwa",
  paiementAnnule: "Malipo yameghairiwa",
  acheterMaintenant: "Nunua sasa",
  ajouterPanier: "Weka kikapuni",
  connexionRequise: "Uhusishaji wa Pi unahitajika",
  supprimerCompte: "Futa akaunti na data yangu",
  liberer: "Tolea",
  accesRestreint: "Ufikiaji ni kwa wasimamizi pekee.",
  produitsSauvegardes: "Bidhaa ulizohifadhi",
  profilsSuivis: "Wasifu unaofuatiliwa",
  tousLesMembres: "Wote",
  derniereMaj: "Sasisho la mwisho: 6 Oktoba 2026.",
  avis: "Maoni",
  statistiques: "Takwimu",
  abonnes: "Wanafuatao",
  abonnementsCourt: "Unafuatilia",
  offresPubliees: "Nafasi zilizotangazwa",
  ventesConfirmees: "Mauzo yaliyothibitishwa",
};

const en: Record<Cle, string> = {
  accueil: "Home",
  jobs: "Jobs",
  market: "Market",
  chat: "Chat",
  profil: "Profile",
  vendeurs: "Sellers",
  favoris: "Favourites",
  wallet: "Pi Wallet",
  parametres: "Settings",
  notifications: "Notifications",
  retour: "Back",
  rechercher: "Search",
  rechercherPlaceholder: "Search a product, a service, a seller…",
  voirTout: "See all",
  acheter: "Buy",
  panier: "Cart",
  vendre: "Sell",
  maBoutique: "My shop",
  contactWhatsapp: "Contact on WhatsApp",
  selectionRecommandee: "Recommended selection",
  nouvellesAnnonces: "New listings",
  tendances: "Trending",
  pourVous: "For you",
  abonnements: "Following",
  bonjour: "Hello",
  invite: "Guest",
  seConnecter: "Sign in",
  seDeconnecter: "Sign out",
  creerCompte: "Create account",
  langue: "Language",
  inscriptionRequise: "Sign-up required",
  inscriptionRequiseTexte: "Create a free account to use WICO.",
  tout: "All",
  aucunResultat: "No results",
  produitsCommunaute: "Community products",
  prix: "Price",
  stock: "Stock",
  categories: "Categories",
  trouverVendeur: "Find a seller",
  sloganAccueil: "Jobs, marketplace and payments in Pi",
  seConnecterPi: "Sign in with Pi",
  piBrowserRequis: "Open WICO in the Pi Browser to pay with Pi.",
  explorerSansCompte: "Browse without an account",
  mesCommandes: "My orders and payments",
  aucuneAnnonce: "No listings yet.",
  aucuneOffre: "No job offers yet.",
  aucuneCommande: "No orders yet.",
  aucunMessage: "No messages yet.",
  aucuneConversation: "No conversations yet.",
  aucuneNotification: "No notifications yet.",
  aucunFavori: "No favourites yet.",
  aucunSuivi: "You are not following anyone yet.",
  aucunAvis: "No reviews yet.",
  conditions: "Terms",
  confidentialite: "Privacy",
  aValider: "This document must be reviewed by a legal adviser.",
  confirmerReception: "Confirm receipt",
  signalerProbleme: "Report a problem",
  paiementEnCours: "Payment in progress…",
  paiementConfirme: "Payment confirmed",
  paiementAnnule: "Payment cancelled",
  acheterMaintenant: "Buy now",
  ajouterPanier: "Add to cart",
  connexionRequise: "Pi sign-in required",
  supprimerCompte: "Delete my account and data",
  liberer: "Release",
  accesRestreint: "Administrators only.",
  produitsSauvegardes: "Saved listings",
  profilsSuivis: "Followed profiles",
  tousLesMembres: "All members",
  derniereMaj: "Last updated: 6 October 2026.",
  avis: "Reviews",
  statistiques: "Statistics",
  abonnes: "Followers",
  abonnementsCourt: "Following",
  offresPubliees: "Jobs posted",
  ventesConfirmees: "Confirmed sales",
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

function getLangue() {
  return langueCourante;
}

function getLangueServer() {
  return "fr" as Langue;
}

export function useLangue(): Langue {
  const getSnapshot = useCallback(getLangue, []);
  const getServerSnapshot = useCallback(getLangueServer, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useT() {
  const l = useLangue();
  return (cle: Cle) => dictionnaires[l][cle] ?? dictionnaires.fr[cle];
}
