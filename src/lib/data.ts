export type Utilisateur = {
  id: string;
  nom: string;
  emoji: string;
  metier: string;
  note: number;
  avis: number;
  ville: string;
  distanceKm: number;
  bio: string;
  competences: string[];
  followers: number;
  following: number;
  jobsCompletes: number;
  ventes: number;
  satisfaction: number;
  prixHoraire?: number;
  whatsapp: string | null;
  membreDepuis: string;
};

export const utilisateurs: Utilisateur[] = [];

const MEMBRE_INCONNU: Utilisateur = { id: "", nom: "Membre", emoji: "👤", metier: "", note: 0, avis: 0, ville: "", distanceKm: 0, bio: "", competences: [], followers: 0, following: 0, jobsCompletes: 0, ventes: 0, satisfaction: 0, whatsapp: null, membreDepuis: "" };
export const parUtilisateur = (id: string) => utilisateurs.find((u) => u.id === id) ?? { ...MEMBRE_INCONNU, id };

export type Job = {
  id: string;
  titre: string;
  categorie: string;
  employeurId: string;
  salaire: string;
  salairePi: number;
  duree: string;
  lieu: string;
  urgent: boolean;
  postes: number;
  dateDebut: string;
  description: string;
  competences: string[];
  niveau: string;
  certification: boolean;
};

export const jobs: Job[] = [];

export const parJob = (id: string) => jobs.find((j) => j.id === id);

export type Produit = {
  id: string;
  titre: string;
  emoji: string;
  categorie: string;
  vendeurId: string;
  prix: number;
  unite: string;
  stock: number;
  lieu: string;
  livraison: string;
  disponible: string;
  description: string;
  vues: number;
  favoris: number;
  note: number;
  avis: number;
};

export const produits: Produit[] = [];

export const parProduit = (id: string) => produits.find((p) => p.id === id);

export const avisProduit: { auteur: string; note: number; texte: string; date: string }[] = [];

export const conversations: { id: string; utilisateurId: string; contexte: string; apercu: string; temps: string; nonLu: boolean; messages: { moi: boolean; texte: string; temps: string }[] }[] = [];

export const parConversation = (id: string) => conversations.find((c) => c.id === id);

export const transactions: { date: string; type: string; montant: number; tiers: string; statut: string }[] = [];

export const notifications: { id: string; icone: string; titre: string; texte: string; temps: string; nonLu: boolean }[] = [];

export const activiteRecente: { icone: string; texte: string; detail: string }[] = [];

export const categoriesJobs = [
  "Menuiserie",
  "Électricité",
  "Construction",
  "Nettoyage",
  "Plomberie",
  "Transport",
  "Agriculture",
];

export const categoriesMarket = [
  "Fruits & Légumes",
  "Vêtements",
  "Électronique",
  "Maison",
  "Services",
];
