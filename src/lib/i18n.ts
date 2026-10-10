import { useCallback, useSyncExternalStore } from "react";

export type Langue = "fr" | "rn" | "sw" | "en";

export const langues: { code: Langue; nom: string }[] = [
  { code: "fr", nom: "Français" },
  { code: "rn", nom: "Kirundi" },
  { code: "sw", nom: "Kiswahili" },
  { code: "en", nom: "English" },
];

export type Cle =
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
  | "signalerAnnonce"
  | "connexionPiUniquement"
  | "afficherWhatsapp"
  | "modeTest"
  | "mentionIndependante"
  | "delaiReponse"
  | "paiementEnCours"
  | "paiementConfirme"
  | "paiementAnnule"
  | "paiementLabel"
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
  | "ventesConfirmees"
  | "monActivite"
  | "activerEspaceVendeur"
  | "espaceVendeurActif"
  | "activerPourPublier"
  | "piRequisPourVendre"
  | "espaceVendeurActive"
  | "noter"
  | "noteEnvoyee"
  | "avisImpossible"
  | "dejaNoteCommande"
  | "conflitInteret"
  | "validationEnAttente"
  | "validationDejaPremier"
  | "mesAnnonces"
  | "commandesRecues"
  | "mesClients"
  | "mesGains"
  | "marquerLivre"
  | "livraisonDeclaree"
  | "attente"
  | "payee"
  | "livreeRecue"
  | "litige"
  | "retenuEscrow"
  | "libereNet"
  | "commissionArija"
  | "montantBrut"
  | "net"
  | "aucunClient"
  | "aucunGain"
  | "messagerie"
  | "derniereCommande"
  | "commandes"
  | "journalAudit"
  | "roles"
  | "seuilDoubleValidation"
  | "reglagesAdmin"
  | "espaceResponsable"
  | "adminSeul"
  | "commandeConfirmee"
  | "payerEnPi"
  | "retourAuPanier"
  | "enAttenteValidation"
  | "continuer"
  | "passerCommande"
  | "panierVide"
  | "sousTotal"
  | "total"
  | "retirerArticle"
  | "articleIndisponible"
  | "annonceRetiree"
  | "stockInsuffisant"
  | "votreAnnonce"
  | "nbPaiements"
  | "connexionPiRequise"
  | "reprendrePaiement"
  | "filtreToutes"
  | "filtreEnAttente"
  | "filtreSucces"
  | "filtreAnnulees"
  | "filtreLitiges"
  | "etatEnAttente"
  | "etatSucces"
  | "etatAnnule"
  | "etatLitige"
  | "facture"
  | "copierTxid"
  | "acheteur"
  | "vendeur"
  | "quantite"
  | "lignes"
  | "ajouteAuPanier"
  | "sousTitre"
  | "nomCompletOng"
  | "initiativeOng"
  | "aPropos"
  | "transparence"
  | "support"
  | "donnees"
  | "espaceDonnees"
  | "donneesVueEnsemble"
  | "donneesTables"
  | "donneesCoherence"
  | "donneesExport"
  | "donneesLectureSeule"
  | "donneesRecherche"
  | "donneesChargement"
  | "donneesAucun"
  | "donneesPrecedent"
  | "donneesSuivant"
  | "donneesAfficherSensible"
  | "donneesMasque"
  | "donneesExporterCsv"
  | "donneesRafraichir"
  | "donneesProblemes"
  | "donneesAucunProbleme"
  | "donneesColonne"
  | "donneesValeur"
  | "donneesTotal"
  | "donneesTropDeLignes"
  | "donneesAssistant"
  | "donneesAssistantActif"
  | "cohPaidHeldSansDate"
  | "cohRembourseIncoherent"
  | "cohStockNegatif"
  | "cohPayeeSansPaiement"
  | "cohLitigeSansLitige";

const fr: Record<Cle, string> = {
  sousTitre: "Marché et emplois solidaires au Burundi",
  nomCompletOng:
    "ARIJA : Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples",
  initiativeOng:
    "Arija Connect est une initiative de l'ONG ARIJA : Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples.",
  aPropos: "À propos",
  transparence: "Transparence",
  support: "Support",
  donnees: "Données",
  espaceDonnees: "Espace données",
  donneesVueEnsemble: "Vue d'ensemble",
  donneesTables: "Tables",
  donneesCoherence: "Contrôle de cohérence",
  donneesExport: "Export CSV",
  donneesLectureSeule:
    "Espace administrateur en lecture seule. Aucune donnée n'est modifiée depuis cette page.",
  donneesRecherche: "Rechercher dans cette table…",
  donneesChargement: "Chargement…",
  donneesAucun: "Aucune ligne.",
  donneesPrecedent: "Précédent",
  donneesSuivant: "Suivant",
  donneesAfficherSensible: "Afficher les données sensibles",
  donneesMasque: "Masqué",
  donneesExporterCsv: "Exporter en CSV",
  donneesRafraichir: "Rafraîchir",
  donneesProblemes: "Anomalies détectées",
  donneesAucunProbleme: "Aucune anomalie détectée.",
  donneesColonne: "Colonne",
  donneesValeur: "Valeur",
  donneesTotal: "Total",
  donneesTropDeLignes: "Export limité à 5000 lignes.",
  donneesAssistant: "Assistant virtuel activé",
  donneesAssistantActif: "L'assistant répond aux utilisateurs.",
  cohPaidHeldSansDate: "Fonds retenus sans date de retenue (paid_held_at manquant).",
  cohRembourseIncoherent: "Paiements marqués à rembourser mais déjà remboursés.",
  cohStockNegatif: "Annonces avec un stock négatif.",
  cohPayeeSansPaiement: "Commandes payées sans paiement retenu correspondant.",
  cohLitigeSansLitige: "Commandes en litige sans dossier de litige.",

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
  inscriptionRequiseTexte: "Créez un compte gratuit pour utiliser Arija Connect.",
  tout: "Tout",
  aucunResultat: "Aucun résultat",
  produitsCommunaute: "Produits de la communauté",
  prix: "Prix",
  stock: "Stock",
  categories: "Catégories",
  trouverVendeur: "Trouver un vendeur",
  seConnecterPi: "Se connecter avec Pi",
  piBrowserRequis: "Ouvrez Arija Connect dans le Pi Browser pour payer en Pi.",
  explorerSansCompte: "Explorer sans compte",
  mesCommandes: "Mes commandes",
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
  signalerAnnonce: "Signaler cette annonce",
  connexionPiUniquement: "Connectez-vous avec Pi pour récupérer votre compte.",
  afficherWhatsapp: "Afficher mon WhatsApp",
  modeTest: "Mode test",
  mentionIndependante: "Application indépendante, non affiliée à Pi Network ni à la Pi Core Team.",
  delaiReponse: "Délai de réponse : 48 heures ouvrées.",
  paiementEnCours: "Paiement en cours…",
  paiementConfirme: "Paiement confirmé",
  paiementAnnule: "Paiement annulé",
  paiementLabel: "Paiement",
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
  monActivite: "Mon activité",
  activerEspaceVendeur: "Activer mon espace vendeur",
  espaceVendeurActif: "Espace vendeur actif",
  activerPourPublier: "Activez votre espace vendeur depuis votre profil pour publier une annonce.",
  piRequisPourVendre: "Enregistrez votre identifiant Pi dans votre profil pour être payé.",
  espaceVendeurActive: "Espace vendeur activé !",
  noter: "Noter",
  noteEnvoyee: "Merci, votre avis a été publié.",
  avisImpossible: "Un avis n'est possible qu'après réception de la commande.",
  dejaNoteCommande: "Vous avez déjà noté cette commande.",
  conflitInteret: "Conflit d'intérêt : un autre responsable doit traiter ce dossier.",
  validationEnAttente:
    "Montant supérieur au seuil : une seconde validation administrateur est nécessaire.",
  validationDejaPremier:
    "Cette libération attend déjà votre validation : faites-valider par un autre administrateur.",
  mesAnnonces: "Mes annonces",
  commandesRecues: "Commandes reçues",
  mesClients: "Mes clients",
  mesGains: "Mes gains",
  marquerLivre: "Marquer comme livré",
  livraisonDeclaree: "Livraison déclarée : l'acheteur peut confirmer la réception.",
  attente: "En attente",
  payee: "Payée",
  livreeRecue: "Livrée / Reçue",
  litige: "Litige",
  retenuEscrow: "Retenu en escrow",
  libereNet: "Libéré net",
  commissionArija: "Commission Arija Connect (2 %)",
  montantBrut: "Montant brut",
  net: "Net",
  aucunClient: "Aucun client pour le moment.",
  aucunGain: "Aucun gain pour le moment.",
  messagerie: "Messagerie",
  derniereCommande: "Dernière commande",
  commandes: "commandes",
  journalAudit: "Journal d'audit",
  roles: "Rôles",
  seuilDoubleValidation: "Seuil de double validation (π)",
  reglagesAdmin: "Réglages admin",
  espaceResponsable: "Espace responsables",
  adminSeul: "Réservé aux administrateurs.",
  commandeConfirmee: "Commande créée — montant confirmé par la base.",
  payerEnPi: "PAYER EN PI",
  retourAuPanier: "Retour au panier",
  enAttenteValidation: "Libérations en attente de 2ᵉ validation",
  continuer: "Continuer",
  passerCommande: "Passer la commande",
  panierVide: "Votre panier est vide.",
  sousTotal: "Sous-total",
  total: "Total",
  retirerArticle: "Retirer",
  articleIndisponible: "Article indisponible",
  annonceRetiree: "Cette annonce n'est plus en vente.",
  stockInsuffisant: "Stock insuffisant.",
  votreAnnonce: "C'est votre annonce : article retiré du panier.",
  nbPaiements: "Vous allez confirmer {n} paiements dans Pi, un par vendeur.",
  connexionPiRequise: "Connectez-vous avec Pi pour finaliser votre commande.",
  reprendrePaiement: "Reprendre le paiement",
  filtreToutes: "Toutes",
  filtreEnAttente: "En attente",
  filtreSucces: "Succès",
  filtreAnnulees: "Annulées",
  filtreLitiges: "Litiges",
  etatEnAttente: "En attente",
  etatSucces: "Succès",
  etatAnnule: "Annulé",
  etatLitige: "Litige",
  facture: "Facture",
  copierTxid: "Copier le txid",
  acheteur: "Acheteur",
  vendeur: "Vendeur",
  quantite: "Quantité",
  lignes: "Articles",
  ajouteAuPanier: "Ajouté au panier",
};

const rn: Record<Cle, string> = {
  sousTitre: "Isoko n'akazi mu Burundi",
  nomCompletOng:
    "ARIJA : Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples",
  initiativeOng:
    "Arija Connect ni umushinga w'Umuco ARIJA : Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples.",
  aPropos: "Ibijanye na Arija Connect",
  transparence: "Transparence",
  support: "Ubufasha",
  donnees: "Amakuru",
  espaceDonnees: "Umwanya w'amakuru",
  donneesVueEnsemble: "Incamake",
  donneesTables: "Imbonerahamwe",
  donneesCoherence: "Igenzura ry'ubwuzuzane",
  donneesExport: "Kohereza CSV",
  donneesLectureSeule: "Umwanya w'abayobozi ugereranywa gusa. Nta makuru ahindurwa kuri iyi paji.",
  donneesRecherche: "Shakisha muri iyi mbonerahamwe…",
  donneesChargement: "Biratwarwa…",
  donneesAucun: "Nta murongo.",
  donneesPrecedent: "Ibibanza",
  donneesSuivant: "Ibikurikira",
  donneesAfficherSensible: "Erekana amakuru y'agaciro",
  donneesMasque: "Yahishe",
  donneesExporterCsv: "Kohereza muri CSV",
  donneesRafraichir: "Vugurura",
  donneesProblemes: "Ubudahuye bwabonetse",
  donneesAucunProbleme: "Nta budahuye bwabonetse.",
  donneesColonne: "Ikibanza",
  donneesValeur: "Agaciro",
  donneesTotal: "Igiteranyo",
  donneesTropDeLignes: "Kohereza bigarukira ku mirongo 5000.",
  donneesAssistant: "Umufasha w'ikirundo arakora",
  donneesAssistantActif: "Umufasha yishura abakoresha.",
  cohPaidHeldSansDate: "Amafaranga afashwe nta itariki (paid_held_at ibura).",
  cohRembourseIncoherent: "Amafaranga yashizwe ku kurihwa ariko yaramaze kurihwa.",
  cohStockNegatif: "Amatangazo afise stock mbi.",
  cohPayeeSansPaiement: "Ibisabwa vyishyuwe nta kwishyura gufashwe bihuye.",
  cohLitigeSansLitige: "Ibisabwa biri mu manza nta dosiye y'urubanza.",

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
  inscriptionRequiseTexte: "Iyandikishe ku buntu kugira ukoreshe Arija Connect.",
  tout: "Vyose",
  aucunResultat: "Nta co vyabonetse",
  produitsCommunaute: "Ibicuruzwa vy'abanyagihugu",
  prix: "Igiciro",
  stock: "Ibihari",
  categories: "Ubwoko",
  trouverVendeur: "Rondera umudandaza",
  seConnecterPi: "Injira na Pi",
  piBrowserRequis: "Fungura Arija Connect muri Pi Browser kugira ukore ukwishyura na Pi.",
  explorerSansCompte: "Shakisha nta konti",
  mesCommandes: "Amabwiriza yange",
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
  signalerAnnonce: "Kwerekana iyi singano",
  connexionPiUniquement: "Injira na Pi kugira ngo ubone konti yawo.",
  afficherWhatsapp: "Eherekanza WhatsApp yanjye",
  modeTest: "Uburyo bwo gerageza",
  mentionIndependante: "Porogaramu idahujwe na Pi Network cyangwa na Pi Core Team.",
  delaiReponse: "Igihe cyo gusubiza: amasaha 48 y'akazi.",
  paiementEnCours: "Ubishyurwa…",
  paiementConfirme: "Ubishyurwe neza",
  paiementAnnule: "Kwishyura kwahagaritswe",
  paiementLabel: "Ibishyura",
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
  monActivite: "Umurimo wanjye",
  activerEspaceVendeur: "Gutangiza uru rugero rwa kugurisha",
  espaceVendeurActif: "Uru rugero rwa kugurisha rutangijwe",
  activerPourPublier:
    "Gutangiza uru rugero rwa kugurisha ukoreshe urubuga rwawe kugira utangire itangwa.",
  piRequisPourVendre: "Andika umwanya wawe wa Pi muri urubuga rwawe kugira uhabwe ibishyura.",
  espaceVendeurActive: "Uru rugero rwa kugurisha rutangijwe!",
  noter: "Impa imigane",
  noteEnvoyee: "Murakoze, itsindiri ryawe ryashizweho.",
  avisImpossible: "Itsindiri riba ryanyuma gusa yo kubona kuguru ku mwanya urangira.",
  dejaNoteCommande: "Waba wasanzwe usanzwe impa imigane ku kuguru uyu.",
  conflitInteret: "Ihene ry'ingabane : undi witegetse agomba gukemura iki kintu.",
  validationEnAttente: "Igiciro kirenze urwego: keneye ubufasha bwa kabiri bw'umuyobozi.",
  validationDejaPremier: "Uku kuroho gusubirwa kwa cyawe: hicwe na umuyobozi undi.",
  mesAnnonces: "Ivyatanzwe vyanjye",
  commandesRecues: "Amabwiriza yakiriwe",
  mesClients: "Abakiriya banjye",
  mesGains: "Ibyinjiye",
  marquerLivre: "Emera nk'ubwatse",
  livraisonDeclaree: "Kubarira ko ubwatse: ugurishi ashobora kwemera ko abyakiriye.",
  attente: "Bitegereje",
  payee: "Ibishyurwe",
  livreeRecue: "Ubwatse / Yakiriwe",
  litige: "Ibazo",
  retenuEscrow: "Bibitswe mu gipfuko",
  libereNet: "Byakurwemo buteparo",
  commissionArija: "Umugabane wa Arija Connect (2 %)",
  montantBrut: "Igiciro gihari",
  net: "Buteparo",
  aucunClient: "Nta bakiriya ubu.",
  aucunGain: "Nta kintu cyinjiye ubu.",
  messagerie: "Ubutumwa",
  derniereCommande: "Iguriza rishasha",
  commandes: "amabwiriza",
  journalAudit: "Igitabo c'igenzura",
  roles: "Inshingano",
  seuilDoubleValidation: "Urwego rwa kugenzura kabiri (π)",
  reglagesAdmin: "Ibyiyerejwe n'umuyobozi",
  espaceResponsable: "Ahantu h'abitegetse",
  adminSeul: "Kubw'abayobozi gusa.",
  commandeConfirmee: "Kuguru kwakozwe — igiciro kemejwe na vidiyo.",
  payerEnPi: "ISHYURA NA PI",
  retourAuPanier: "Subira mu gasho",
  enAttenteValidation: "Ibyo guroho bisubirje kugenzurwa",
  continuer: "Komeza",
  passerCommande: "Kora igikuru",
  panierVide: "Agasho kawe karimo ubusa.",
  sousTotal: "Igiteranyo gicukiriye",
  total: "Igiteranyo cyose",
  retirerArticle: "Kuraho",
  articleIndisponible: "Igicuruzwa ntigiboneka",
  annonceRetiree: "Iri tangazo rihanwa ku isoko.",
  stockInsuffisant: "Ingano idashoboka.",
  votreAnnonce: "Ni yo tangazo yawe : igicuruzwa cyakurwemo mu gasho.",
  nbPaiements: "Uzemeza {n} ishyurwa na Pi, imwe kuri buri mwandazi.",
  connexionPiRequise: "Injira na Pi kugira ukomeze uguha.",
  reprendrePaiement: "Subira mu ishyura",
  filtreToutes: "Byose",
  filtreEnAttente: "Bitegereje",
  filtreSucces: "Byakunze",
  filtreAnnulees: "Bikurwemu",
  filtreLitiges: "Amakosi",
  etatEnAttente: "Bitegereje",
  etatSucces: "Byakunze",
  etatAnnule: "Bikurwemu",
  etatLitige: "Amakosi",
  facture: "Ifagitire",
  copierTxid: "Koporora txid",
  acheteur: "Umuguzi",
  vendeur: "Uwandazi",
  quantite: "Ingano",
  lignes: "Ibicuruzwa",
  ajouteAuPanier: "Byashyizwe mu gasho",
};

const sw: Record<Cle, string> = {
  sousTitre: "Soko na kazi za ushirikiano Burundi",
  nomCompletOng:
    "ARIJA : Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples",
  initiativeOng:
    "Arija Connect ni mradi wa shirika ARIJA : Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples.",
  aPropos: "Kuhusu Arija Connect",
  transparence: "Uwazi",
  support: "Msaada",
  donnees: "Data",
  espaceDonnees: "Eneo la data",
  donneesVueEnsemble: "Muhtasari",
  donneesTables: "Majedwali",
  donneesCoherence: "Ukaguzi wa uwiano",
  donneesExport: "Hamisha CSV",
  donneesLectureSeule:
    "Eneo la msimamizi la kusoma tu. Hakuna data inayobadilishwa kwenye ukurasa huu.",
  donneesRecherche: "Tafuta katika jedwali hili…",
  donneesChargement: "Inapakia…",
  donneesAucun: "Hakuna safu.",
  donneesPrecedent: "Iliyotangulia",
  donneesSuivant: "Inayofuata",
  donneesAfficherSensible: "Onyesha data nyeti",
  donneesMasque: "Imefichwa",
  donneesExporterCsv: "Hamisha kama CSV",
  donneesRafraichir: "Onyesha upya",
  donneesProblemes: "Hitilafu zilizogunduliwa",
  donneesAucunProbleme: "Hakuna hitilafu iliyogunduliwa.",
  donneesColonne: "Safu wima",
  donneesValeur: "Thamani",
  donneesTotal: "Jumla",
  donneesTropDeLignes: "Uhamishaji umezuiwa kwa safu 5000.",
  donneesAssistant: "Msaidizi amewashwa",
  donneesAssistantActif: "Msaidizi hujibu watumiaji.",
  cohPaidHeldSansDate: "Fedha zilizoshikiliwa bila tarehe (paid_held_at haipo).",
  cohRembourseIncoherent: "Malipo yaliyowekwa kwa kurejeshwa lakini tayari yamerejeshwa.",
  cohStockNegatif: "Matangazo yenye stock hasi.",
  cohPayeeSansPaiement: "Oda zilizolipiwa bila malipo yaliyoshikiliwa yanayolingana.",
  cohLitigeSansLitige: "Oda zenye mgogoro bila faili ya mgogoro.",

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
  inscriptionRequiseTexte: "Fungua akaunti bure ili kutumia Arija Connect.",
  tout: "Zote",
  aucunResultat: "Hakuna matokeo",
  produitsCommunaute: "Bidhaa za jamii",
  prix: "Bei",
  stock: "Hisa",
  categories: "Makundi",
  trouverVendeur: "Tafuta muuzaji",
  seConnecterPi: "Ingia kwa Pi",
  piBrowserRequis: "Fungua Arija Connect kwenye Pi Browser ili kulipa kwa Pi.",
  explorerSansCompte: "Vinjiri bila akaunti",
  mesCommandes: "Maagizo yangu",
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
  signalerAnnonce: "Ripoti tangazo hili",
  connexionPiUniquement: "Ingia kwa Pi ili kupata akaunti yako.",
  afficherWhatsapp: "Onyesha WhatsApp yangu",
  modeTest: "Hali ya majaribio",
  mentionIndependante: "Programu huru, haihusiani na Pi Network wala Pi Core Team.",
  delaiReponse: "Muda wa kujibu: saa 48 za kazi.",
  paiementEnCours: "Malipo yanapoendelea…",
  paiementConfirme: "Malipo yamethibitishwa",
  paiementAnnule: "Malipo yameghairiwa",
  paiementLabel: "Malipo",
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
  monActivite: "Shughuli yangu",
  activerEspaceVendeur: "Washa nafasi yangu ya muuzaji",
  espaceVendeurActif: "Nafasi ya muuzaji imewashwa",
  activerPourPublier: "Washa nafasi yako ya muuzaji kutoka kwenye wasifu ili kutangaza.",
  piRequisPourVendre: "Weka kitambulisho chako cha Pi kwenye wasifu wako ili kulipwa.",
  espaceVendeurActive: "Nafasi ya muuzaji imewashwa!",
  noter: "Kupa alama",
  noteEnvoyee: "Asante, maoni yako yamewekwa.",
  avisImpossible: "Maoni yanawezekana tu baada ya kupokea agizo linalomalizika.",
  dejaNoteCommande: "Tayari umeona agizo hili awali.",
  conflitInteret: "Mgongano wa maslahi: mhusika mwingine anapaswa kushughulikia kesi hii.",
  validationEnAttente: "Kiasi kiko juu ya kikomo: hitajika uthibitisho wa pili wa msimamizi.",
  validationDejaPremier:
    "Utoleaji huu tayari unasubiri uthibitisho wako: pata uthibitisho wa msimamizi mwingine.",
  mesAnnonces: "Matangazo yangu",
  commandesRecues: "Maagizo yaliyopokelewa",
  mesClients: "Wateja wangu",
  mesGains: "Mapato yangu",
  marquerLivre: "Weka kama imefika",
  livraisonDeclaree: "Umefika: mnunuzi anaweza kuthibitisha upokeaji.",
  attente: "Inasubiri",
  payee: "Imelipwa",
  livreeRecue: "Imefika / Imepokelewa",
  litige: "Mgogoro",
  retenuEscrow: "Imeshikwa kwenye escrow",
  libereNet: "Iliyotolewa halisi",
  commissionArija: "Kamisheni ya Arija Connect (2%)",
  montantBrut: "Kiasi ghafi",
  net: "Halisi",
  aucunClient: "Hakuna mteja kwa sasa.",
  aucunGain: "Hakuna mapato kwa sasa.",
  messagerie: "Ujumbe",
  derniereCommande: "Agizo la mwisho",
  commandes: "maagizo",
  journalAudit: "Kumbukumbu za ufuatiliaji",
  roles: "Majukumu",
  seuilDoubleValidation: "Kikomo cha uthibitisho wa pili (π)",
  reglagesAdmin: "Mipangilio ya msimamizi",
  espaceResponsable: "Nafasi ya wahusika",
  adminSeul: "Kwa wasimamizi pekee.",
  commandeConfirmee: "Agizo limeundwa — kiasi kimethibitishwa na database.",
  payerEnPi: "LIPA KWA PI",
  retourAuPanier: "Rudi kikapuni",
  enAttenteValidation: "Utoleaji unasubiri uthibitisho wa pili",
  continuer: "Endelea",
  passerCommande: "Tengeneza agizo",
  panierVide: "Kikapu chako ni tupu.",
  sousTotal: "Jumla ndogo",
  total: "Jumla",
  retirerArticle: "Ondoa",
  articleIndisponible: "Bidhaa haipo",
  annonceRetiree: "Tangazo haliwezi tena kuuzwa.",
  stockInsuffisant: "Stoo haitoshi.",
  votreAnnonce: "Ni tangazo lako: bidhaa imeondolewa kikapuni.",
  nbPaiements: "Utathibitisha malipo {n} ya Pi, kwa kila muuzaji.",
  connexionPiRequise: "Ingia kwa Pi ili kamilisha agizo lako.",
  reprendrePaiement: "Endelea malipo",
  filtreToutes: "Zote",
  filtreEnAttente: "Inasubiri",
  filtreSucces: "Mafanikio",
  filtreAnnulees: "Zilizoghairiwa",
  filtreLitiges: "Migogoro",
  etatEnAttente: "Inasubiri",
  etatSucces: "Mafanikio",
  etatAnnule: "Imeghairiwa",
  etatLitige: "Mgogoro",
  facture: "Ankara",
  copierTxid: "Nakili txid",
  acheteur: "Mnunuzi",
  vendeur: "Muuzaji",
  quantite: "Idadi",
  lignes: "Bidhaa",
  ajouteAuPanier: "Imewekwa kikapuni",
};

const en: Record<Cle, string> = {
  sousTitre: "Solidarity marketplace and jobs in Burundi",
  nomCompletOng:
    "ARIJA: Alliance for the Reinforcement of the values of Integrity, Socio-economic Justice and Friendship between Peoples",
  initiativeOng:
    "Arija Connect is an initiative of the NGO ARIJA: Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples.",
  aPropos: "About",
  transparence: "Transparency",
  support: "Support",
  donnees: "Data",
  espaceDonnees: "Data space",
  donneesVueEnsemble: "Overview",
  donneesTables: "Tables",
  donneesCoherence: "Consistency check",
  donneesExport: "CSV export",
  donneesLectureSeule: "Administrator area, read-only. No data is modified from this page.",
  donneesRecherche: "Search within this table…",
  donneesChargement: "Loading…",
  donneesAucun: "No rows.",
  donneesPrecedent: "Previous",
  donneesSuivant: "Next",
  donneesAfficherSensible: "Reveal sensitive data",
  donneesMasque: "Hidden",
  donneesExporterCsv: "Export as CSV",
  donneesRafraichir: "Refresh",
  donneesProblemes: "Anomalies detected",
  donneesAucunProbleme: "No anomaly detected.",
  donneesColonne: "Column",
  donneesValeur: "Value",
  donneesTotal: "Total",
  donneesTropDeLignes: "Export limited to 5000 rows.",
  donneesAssistant: "Virtual assistant enabled",
  donneesAssistantActif: "The assistant answers users.",
  cohPaidHeldSansDate: "Held funds without a hold date (paid_held_at missing).",
  cohRembourseIncoherent: "Payments flagged for refund but already refunded.",
  cohStockNegatif: "Listings with negative stock.",
  cohPayeeSansPaiement: "Paid orders without a matching held payment.",
  cohLitigeSansLitige: "Orders in dispute without a dispute file.",

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
  inscriptionRequiseTexte: "Create a free account to use Arija Connect.",
  tout: "All",
  aucunResultat: "No results",
  produitsCommunaute: "Community products",
  prix: "Price",
  stock: "Stock",
  categories: "Categories",
  trouverVendeur: "Find a seller",
  seConnecterPi: "Sign in with Pi",
  piBrowserRequis: "Open Arija Connect in the Pi Browser to pay with Pi.",
  explorerSansCompte: "Browse without an account",
  mesCommandes: "My orders",
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
  signalerAnnonce: "Report this listing",
  connexionPiUniquement: "Sign in with Pi to recover your account.",
  afficherWhatsapp: "Show my WhatsApp",
  modeTest: "Test mode",
  mentionIndependante:
    "Independent application, not affiliated with Pi Network or the Pi Core Team.",
  delaiReponse: "Response time: 48 business hours.",
  paiementEnCours: "Payment in progress…",
  paiementConfirme: "Payment confirmed",
  paiementAnnule: "Payment cancelled",
  paiementLabel: "Payment",
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
  monActivite: "My activity",
  activerEspaceVendeur: "Activate my seller space",
  espaceVendeurActif: "Seller space active",
  activerPourPublier: "Activate your seller space from your profile to publish a listing.",
  piRequisPourVendre: "Add your Pi username to your profile to get paid.",
  espaceVendeurActive: "Seller space activated!",
  noter: "Rate",
  noteEnvoyee: "Thank you, your review has been published.",
  avisImpossible: "You can only review after the order has been received.",
  dejaNoteCommande: "You have already rated this order.",
  conflitInteret: "Conflict of interest: another officer must handle this case.",
  validationEnAttente: "Above the threshold: a second administrator validation is required.",
  validationDejaPremier:
    "This release already awaits your validation: get it approved by another administrator.",
  mesAnnonces: "My listings",
  commandesRecues: "Received orders",
  mesClients: "My customers",
  mesGains: "My earnings",
  marquerLivre: "Mark as delivered",
  livraisonDeclaree: "Delivery declared: the buyer can confirm receipt.",
  attente: "Pending",
  payee: "Paid",
  livreeRecue: "Delivered / Received",
  litige: "Dispute",
  retenuEscrow: "Held in escrow",
  libereNet: "Net released",
  commissionArija: "Arija Connect commission (2%)",
  montantBrut: "Gross amount",
  net: "Net",
  aucunClient: "No customers yet.",
  aucunGain: "No earnings yet.",
  messagerie: "Messages",
  derniereCommande: "Last order",
  commandes: "orders",
  journalAudit: "Audit log",
  roles: "Roles",
  seuilDoubleValidation: "Double validation threshold (π)",
  reglagesAdmin: "Admin settings",
  espaceResponsable: "Officers' space",
  adminSeul: "Administrators only.",
  commandeConfirmee: "Order created — amount confirmed by the database.",
  payerEnPi: "PAY WITH PI",
  retourAuPanier: "Back to cart",
  enAttenteValidation: "Releases awaiting 2nd validation",
  continuer: "Continue",
  passerCommande: "Checkout",
  panierVide: "Your cart is empty.",
  sousTotal: "Subtotal",
  total: "Total",
  retirerArticle: "Remove",
  articleIndisponible: "Item unavailable",
  annonceRetiree: "This listing is no longer for sale.",
  stockInsuffisant: "Not enough stock.",
  votreAnnonce: "This is your own listing: item removed from the cart.",
  nbPaiements: "You are about to confirm {n} Pi payments, one per seller.",
  connexionPiRequise: "Sign in with Pi to complete your order.",
  reprendrePaiement: "Resume payment",
  filtreToutes: "All",
  filtreEnAttente: "Pending",
  filtreSucces: "Success",
  filtreAnnulees: "Cancelled",
  filtreLitiges: "Disputes",
  etatEnAttente: "Pending",
  etatSucces: "Success",
  etatAnnule: "Cancelled",
  etatLitige: "Dispute",
  facture: "Invoice",
  copierTxid: "Copy txid",
  acheteur: "Buyer",
  vendeur: "Seller",
  quantite: "Quantity",
  lignes: "Items",
  ajouteAuPanier: "Added to cart",
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
