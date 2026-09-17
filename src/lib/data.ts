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

export const utilisateurs: Utilisateur[] = [
  {
    id: "u-moi",
    nom: "Didier N.",
    emoji: "🧑🏿‍🔧",
    metier: "Menuisier, Électricien",
    note: 4.8,
    avis: 45,
    ville: "Bujumbura, Burundi",
    distanceKm: 0,
    bio: "Travailleur fiable depuis 2 ans, spécialisé en menuiserie sur mesure.",
    competences: ["Menuiserie", "Électricité", "Rénovation"],
    followers: 234,
    following: 45,
    jobsCompletes: 52,
    ventes: 120,
    satisfaction: 98,
    prixHoraire: 0.012,
    whatsapp: null, // numéro non vérifié (profil de démonstration)
    membreDepuis: "2023",
  },
  {
    id: "u-jean",
    nom: "Jean M.",
    emoji: "👨🏿‍💼",
    metier: "Entrepreneur en construction",
    note: 4.7,
    avis: 89,
    ville: "Rohero, Bujumbura",
    distanceKm: 2,
    bio: "Entrepreneur en construction, partenaire fiable.",
    competences: ["Construction", "Menuiserie", "Gestion de chantier"],
    followers: 1240,
    following: 87,
    jobsCompletes: 45,
    ventes: 12,
    satisfaction: 98,
    whatsapp: null, // numéro non vérifié (profil de démonstration)
    membreDepuis: "2022",
  },
  {
    id: "u-marie",
    nom: "Farmer Marie",
    emoji: "👩🏿‍🌾",
    metier: "Agricultrice",
    note: 4.9,
    avis: 234,
    ville: "Kinama, Bujumbura",
    distanceKm: 3,
    bio: "Agricultrice spécialisée en légumes biologiques.",
    competences: ["Maraîchage", "Livraison", "Bio"],
    followers: 5234,
    following: 120,
    jobsCompletes: 8,
    ventes: 980,
    satisfaction: 99,
    whatsapp: null, // numéro non vérifié (profil de démonstration)
    membreDepuis: "2022",
  },
  {
    id: "u-robert",
    nom: "Robert P.",
    emoji: "🧑🏿‍🏭",
    metier: "Plombier",
    note: 4.8,
    avis: 61,
    ville: "Ngagara, Bujumbura",
    distanceKm: 6,
    bio: "Plombier certifié, interventions rapides 7j/7.",
    competences: ["Plomberie", "Tuyauterie", "Urgences"],
    followers: 412,
    following: 33,
    jobsCompletes: 130,
    ventes: 4,
    satisfaction: 96,
    prixHoraire: 0.015,
    whatsapp: null, // numéro non vérifié (profil de démonstration)
    membreDepuis: "2021",
  },
  {
    id: "u-fashion",
    nom: "Fashion Store",
    emoji: "🧕🏿",
    metier: "Boutique de vêtements",
    note: 4.6,
    avis: 156,
    ville: "Centre-ville, Bujumbura",
    distanceKm: 1,
    bio: "Vêtements neufs et tendance à prix Pi.",
    competences: ["Vêtements", "Accessoires"],
    followers: 2310,
    following: 54,
    jobsCompletes: 0,
    ventes: 640,
    satisfaction: 95,
    whatsapp: null, // numéro non vérifié (profil de démonstration)
    membreDepuis: "2023",
  },
];

export const parUtilisateur = (id: string) => utilisateurs.find((u) => u.id === id) ?? utilisateurs[0];

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

export const jobs: Job[] = [
  {
    id: "j-menuiserie",
    titre: "Fabrication portes / fenêtres en bois",
    categorie: "Menuiserie",
    employeurId: "u-jean",
    salaire: "0,15 π",
    salairePi: 0.15,
    duree: "3 jours (8h – 17h)",
    lieu: "Quartier Rohero, Bujumbura",
    urgent: true,
    postes: 2,
    dateDebut: "À partir du 15 août",
    description:
      "Besoin de 2 menuisiers expérimentés pour fabriquer des portes et fenêtres sur mesure. Matériaux fournis. Travail de qualité demandé. Permis de construire requis.",
    competences: ["Menuiserie", "Sur mesure", "Bois massif"],
    niveau: "Expert",
    certification: true,
  },
  {
    id: "j-nettoyage",
    titre: "Nettoyage de bureau — 2x par semaine",
    categorie: "Nettoyage",
    employeurId: "u-marie",
    salaire: "0,05 π / jour",
    salairePi: 0.05,
    duree: "Permanent",
    lieu: "Kinama, Bujumbura",
    urgent: false,
    postes: 1,
    dateDebut: "Immédiat",
    description:
      "Nettoyage complet d'un bureau de 120 m², deux fois par semaine. Produits fournis. Ponctualité indispensable.",
    competences: ["Nettoyage", "Ponctualité"],
    niveau: "Débutant",
    certification: false,
  },
  {
    id: "j-electricite",
    titre: "Cherche 3 électriciens — URGENT",
    categorie: "Électricité",
    employeurId: "u-jean",
    salaire: "0,6 π",
    salairePi: 0.6,
    duree: "2 semaines",
    lieu: "Mutanga Nord, Bujumbura",
    urgent: true,
    postes: 3,
    dateDebut: "Commencer maintenant",
    description:
      "Installation électrique complète de deux immeubles résidentiels. Équipe expérimentée demandée, certification obligatoire.",
    competences: ["Électricité", "Câblage", "Tableau électrique"],
    niveau: "Intermédiaire",
    certification: true,
  },
  {
    id: "j-renovation",
    titre: "Rénovation de 2 appartements",
    categorie: "Construction",
    employeurId: "u-robert",
    salaire: "0,45 π",
    salairePi: 0.45,
    duree: "3 semaines",
    lieu: "Kiriri, Bujumbura",
    urgent: true,
    postes: 4,
    dateDebut: "1er septembre",
    description:
      "Rénovation complète : peinture, plomberie, carrelage. Chantier encadré, paiement hebdomadaire en Pi.",
    competences: ["Peinture", "Carrelage", "Plomberie"],
    niveau: "Intermédiaire",
    certification: false,
  },
];

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

export const produits: Produit[] = [
  {
    id: "p-tomates",
    titre: "Tomates fraîches du jour (50 kg)",
    emoji: "🍅",
    categorie: "Fruits & Légumes",
    vendeurId: "u-marie",
    prix: 0.25,
    unite: "lot de 50 kg",
    stock: 20,
    lieu: "Quartier Kinama, Bujumbura",
    livraison: "Gratuite (5 km) · 0,02 π au-delà",
    disponible: "Jusqu'à demain 18h",
    description:
      "Tomates cultivées localement sans pesticides. Fraîches du jour. Parfait pour restaurants ou familles. Possibilité de livraison. Commande minimum 10 kg.",
    vues: 1234,
    favoris: 234,
    note: 4.9,
    avis: 234,
  },
  {
    id: "p-tshirt",
    titre: "T-shirt coton (taille M)",
    emoji: "👕",
    categorie: "Vêtements",
    vendeurId: "u-fashion",
    prix: 0.08,
    unite: "unité",
    stock: 50,
    lieu: "Centre-ville, Bujumbura",
    livraison: "Gratuite (3 km) · 0,015 π au-delà",
    disponible: "En permanence",
    description: "T-shirt 100 % coton, coupe classique, plusieurs coloris disponibles.",
    vues: 890,
    favoris: 456,
    note: 4.6,
    avis: 156,
  },
  {
    id: "p-mangues",
    titre: "Mangues du Burundi (20 kg)",
    emoji: "🥭",
    categorie: "Fruits & Légumes",
    vendeurId: "u-marie",
    prix: 0.08,
    unite: "lot de 20 kg",
    stock: 50,
    lieu: "Kinama, Bujumbura",
    livraison: "Gratuite (5 km)",
    disponible: "Cette semaine",
    description: "Mangues sucrées récoltées à maturité, idéales pour la revente ou les jus.",
    vues: 640,
    favoris: 98,
    note: 4.8,
    avis: 74,
  },
  {
    id: "p-radio",
    titre: "Radio solaire portable",
    emoji: "📻",
    categorie: "Électronique",
    vendeurId: "u-fashion",
    prix: 0.14,
    unite: "unité",
    stock: 12,
    lieu: "Centre-ville, Bujumbura",
    livraison: "0,02 π partout à Bujumbura",
    disponible: "Stock limité",
    description: "Radio FM/AM à panneau solaire intégré, batterie 2000 mAh, port USB.",
    vues: 320,
    favoris: 41,
    note: 4.5,
    avis: 28,
  },
];

export const parProduit = (id: string) => produits.find((p) => p.id === id);

export const avisProduit = [
  { auteur: "Jean D.", note: 5, texte: "Fraîches et délicieuses !", date: "il y a 2 jours" },
  { auteur: "Sarah K.", note: 5, texte: "Excellente qualité, livraison rapide.", date: "il y a 5 jours" },
  { auteur: "Marc L.", note: 4, texte: "Bon produit, mais un peu cher.", date: "il y a 1 semaine" },
];

export const conversations = [
  {
    id: "c-jean",
    utilisateurId: "u-jean",
    contexte: "Emploi : Fabrication portes",
    apercu: "D'accord, j'accepte ta postulation pour demain 8h",
    temps: "il y a 2 min",
    nonLu: true,
    messages: [
      { moi: false, texte: "Ton profil m'intéresse, tu es dispo cette semaine ?", temps: "il y a 12 min" },
      { moi: true, texte: "Oui, j'ai 3 ans d'expérience en menuiserie.", temps: "il y a 10 min" },
      { moi: false, texte: "Tes qualifications correspondent parfaitement. Je te paie 0,15 π pour 3 jours.", temps: "il y a 8 min" },
      { moi: true, texte: "Merci ! Je confirme pour demain.", temps: "il y a 5 min" },
      { moi: false, texte: "D'accord, j'accepte ta postulation pour demain 8h. Rendez-vous à 7h30 à Rohero.", temps: "il y a 2 min" },
    ],
  },
  {
    id: "c-marie",
    utilisateurId: "u-marie",
    contexte: "Achat : Tomates 50 kg",
    apercu: "Merci pour l'achat ! Livraison demain à 10h",
    temps: "il y a 1 h",
    nonLu: false,
    messages: [
      { moi: true, texte: "Bonjour, la livraison est possible à Rohero ?", temps: "il y a 3 h" },
      { moi: false, texte: "Oui bien sûr, 0,02 π de frais.", temps: "il y a 2 h" },
      { moi: false, texte: "Merci pour l'achat ! Livraison demain à 10h.", temps: "il y a 1 h" },
    ],
  },
  {
    id: "c-robert",
    utilisateurId: "u-robert",
    contexte: "Service : Réparation tuyauterie",
    apercu: "Ton profil m'intéresse, tu cherches du travail ?",
    temps: "il y a 1 jour",
    nonLu: false,
    messages: [{ moi: false, texte: "Ton profil m'intéresse, tu cherches du travail ?", temps: "il y a 1 jour" }],
  },
];

export const parConversation = (id: string) => conversations.find((c) => c.id === id);

export const transactions = [
  { date: "15/08", type: "Paiement reçu", montant: 0.05, tiers: "Job complété — Nettoyage", statut: "Confirmé" },
  { date: "14/08", type: "Achat", montant: -0.25, tiers: "Tomates fraîches — Farmer Marie", statut: "Confirmé" },
  { date: "13/08", type: "Paiement reçu", montant: 0.08, tiers: "Service plomberie", statut: "Confirmé" },
  { date: "12/08", type: "Frais", montant: -0.03, tiers: "Frais plateforme", statut: "Confirmé" },
  { date: "11/08", type: "Transfert", montant: 0.1, tiers: "Ami Marie", statut: "Confirmé" },
  { date: "10/08", type: "Achat", montant: -0.08, tiers: "T-shirt coton", statut: "Confirmé" },
];

export const notifications = [
  { id: "n1", icone: "💼", titre: "Candidature acceptée", texte: "Jean M. a accepté votre postulation pour « Fabrication portes ».", temps: "il y a 2 min", nonLu: true },
  { id: "n2", icone: "💬", titre: "Nouveau message", texte: "Farmer Marie : « Livraison demain à 10h ».", temps: "il y a 1 h", nonLu: true },
  { id: "n3", icone: "💰", titre: "Paiement reçu", texte: "Vous avez reçu 0,05 π pour un job complété.", temps: "il y a 3 h", nonLu: true },
  { id: "n4", icone: "❤️", titre: "Baisse de prix", texte: "Les mangues du Burundi sont passées à 0,08 π.", temps: "hier", nonLu: false },
];

export const activiteRecente = [
  { icone: "✅", texte: "Robert P. a complété un job de plomberie", detail: "« Excellent résultat ! » — ⭐ 5/5" },
  { icone: "🥭", texte: "Farmer Marie a publié « Mangues du Burundi »", detail: "0,08 π · En stock : 50 kg" },
  { icone: "💬", texte: "Jean M. a écrit « Cherche 3 électriciens URGENT »", detail: "0,6 π · Commencer maintenant" },
];

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
