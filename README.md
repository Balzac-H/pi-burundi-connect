# PI BURUNDI CONNECT

## Mise en production (paiements Pi)

L'application est prête côté code. Il ne reste que la configuration Pi :

1. **Créer l'application** dans le [Pi Developer Portal](https://developers.minepi.com)
   avec l'URL publique du site (domaine Lovable ou domaine personnalisé).
2. **Ajouter la clé API** : placez `PI_API_KEY` dans les variables d'environnement
   du serveur (secret, jamais dans le navigateur). Voir `.env.example`.
3. **Coller la clé de validation du domaine** dans `public/validation-key.txt`
   (le fichier doit rester accessible sur `https://<domaine>/validation-key.txt`).
4. **Réseau** : `VITE_PI_SANDBOX=true` (Testnet) pendant les tests, puis
   `VITE_PI_SANDBOX=false` pour passer en Mainnet.
5. **Migrations** : appliquez tout ce qui se trouve dans `supabase/migrations/`
   (notamment `20261006120000_wico_paiements_escrow.sql` et la contrainte
   unique sur `payments.pi_payment_id`).

Commandes utiles :

```bash
npm install        # ou bun install
npm run dev        # développement (http://localhost:8080)
npm run build      # build de production
npm run lint       # ESLint + Prettier
npx tsc --noEmit   # vérification des types
```

Flux de paiement : `payerAvecPi()` crée une commande, le serveur vérifie le
montant et l'utilisateur, Pi approuve puis finalise (`piComplete`), les fonds
sont retenus (`paid_held`) puis libérés par un admin (`piRelease`, commission
2 %, TODO A2U). La page « Mes commandes et paiements » est sur `/portefeuille`.

---


Crée une application web React complète appelée "BURUNDI PI CONNECT" - une plateforme 
peer-to-peer multiservices pour le Burundi avec les spécifications suivantes:

═══════════════════════════════════════════════════════════════════════════════════

## DESIGN & BRANDING

Couleurs principales:
- Primary: #1F4E3D (vert foncé - Burundi inspired)
- Secondary: #FF9800 (orange - énergie)
- Accent: #4CAF50 (vert Pi)
- Text: #333333
- Background: #F5F5F5
- Card: #FFFFFF

Typography:
- Headlines: Bold, taille 24-28px
- Subheadings: Semi-bold, 16-18px
- Body: Regular, 14-16px
- Font: Poppins ou similaire (sans-serif moderne)

Design: Mobile-first, responsive, simple et intuitif
Langue: FRANÇAIS (100% du texte en français)
Thème: Lumineux avec accent sur Pi Network (doré/bleu Pi)

═══════════════════════════════════════════════════════════════════════════════════

## AUTHENTIFICATION & PROFIL UTILISATEUR

### Page Login/Register
- Champs:
  * Numéro téléphone (obligatoire)
  * Email (optionnel)
  * Mot de passe
  * Bouton "Se connecter avec Pi Wallet" (pour intégration future)
  * Lien "Créer un compte"
  * Lien "Mot de passe oublié"

### Page Profile Utilisateur (vue complète)
Structure:


┌─────────────────────────────────────┐
│  [Photo profil] Nom Utilisateur    │
│  ⭐ 4.8 (45 avis)                  │
│  📍 Bujumbura, Burundi             │
│  🏷️ Menuisier, Électricien         │
│  📝 "Travailleur fiable depuis 2ans"│
├─────────────────────────────────────┤
│ [FOLLOW] [CONTACT] [PARTAGER]      │
├─────────────────────────────────────┤
│ STATISTIQUES                        │
│ 👤 234 Followers | 45 Following    │
│ 💼 52 Jobs complétés               │
│ 🛍️ 120 ventes Market              │
│ ✅ Taux de satisfaction: 98%       │
├─────────────────────────────────────┤
│ HISTORIQUE & AVIS                   │
│ Emplois complétés, ventes, services│
│ Dernier: "Rénovation cuisines"     │
│ Avis: ⭐⭐⭐⭐⭐ "Excellent travail!"│
│                                     │
└─────────────────────────────────────┘


Boutons spécifiques:
- [FOLLOW] : Suivre cet utilisateur (toggle Follow/Unfollow)
- [CONTACT] : Ouvrir le chat direct
- [PARTAGER] : Partager le profil
- [MODIFIER] : Si c'est mon profil
- [SIGNALER] : Option rapport utilisateur

Champs éditables (mon profil):
- Photo de profil (upload)
- Bio/Description
- Compétences/Tags
- Localisation
- Numéro de téléphone
- Prix horaire (si service provider)
- Portefeuille Pi (affichage)

═══════════════════════════════════════════════════════════════════════════════════

## MODULE 1: JOBS (Emplois)

### Page Jobs - Liste
Layout:


┌─────────────────────────────────────────────────────────────┐
│ JOBS 💼      [Mes offres] [Créer offre]                     │
├─────────────────────────────────────────────────────────────┤
│ Filtres: [Catégorie ▼] [Salaire min ▼] [Distance ▼]       │
│ Recherche: [________________________________________]       │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👨‍💼 Jean M. | ⭐4.7 | 📍2km away                     │   │
│ │ Menuiserie : Fabrication portes/fenêtres           │   │
│ │ Salaire: 1500 Pi | Durée: 3 jours | Urgent         │   │
│ │ [VOIR DÉTAIL] [POSTULER]                            │   │
│ └──────────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👩‍💼 Marie R. | ⭐4.9 | 📍5km away                     │   │
│ │ Nettoyage : Nettoyage bureau - 2x par semaine      │   │
│ │ Salaire: 500 Pi/jour | Durée: Permanent           │   │
│ │ [VOIR DÉTAIL] [POSTULER]                            │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘


### Page Job Detail


┌─────────────────────────────────────────────────────────────┐
│ ← RETOUR                                                    │
├─────────────────────────────────────────────────────────────┤
│ Fabrication Portes/Fenêtres en Bois                        │
│ Employeur: Jean M. | ⭐4.7 (89 avis) | 📍2km              │
│                                                             │
│ 💼 Catégorie: Menuiserie                                   │
│ 💰 Salaire: 1500 Pi                                        │
│ ⏱️ Durée: 3 jours (8h-17h)                                 │
│ 📍 Lieu: Quartier Rohero, Bujumbura                       │
│ ⚡ Urgence: OUI                                            │
│ 👥 Postes: 2 ouvriers                                      │
│ 📅 Date: À partir du 15 août                              │
│                                                             │
│ DESCRIPTION:                                               │
│ "Besoin de 2 menuisiers expérimentés pour fabriquer       │
│ des portes et fenêtres sur mesure. Matériaux fournis.     │
│ Travail de qualité demandé. Permis de construire requis." │
│                                                             │
│ PROFIL EMPLOYEUR:                                          │
│ [Photo] Jean M.                                            │
│ "Entrepreneur en construction, partenaire fiable"          │
│ ✅ 45 emplois publiés | ✅ 98% satisfaction              │
│ [VISITER PROFIL] [FOLLOW]                                 │
│                                                             │
│ ════════════════════════════════════════════════════════   │
│ [POSTULER MAINTENANT] [PARTAGER] [SIGNALER]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘


### Page Créer Offre d'Emploi (Employeur)
Formulaire:
- Titre du poste *
- Catégorie (Menuiserie, Électricité, Construction, etc.) *
- Description détaillée *
- Salaire en Pi *
- Durée (Heures, jours, semaines, permanent)
- Date de début *
- Nombre de postes *
- Localisation/Adresse *
- Compétences requises (tags)
- Niveau d'expérience (Débutant, Intermédiaire, Expert)
- Permis/Certification requis? (Oui/Non)
- Urgent? (checkbox)
- [PUBLIER OFFRE] [APERÇU] [BROUILLON]

### Page Mes Postulations (Travailleur)


Filtres: [Toutes] [Acceptées] [En attente] [Rejetées]

En attente (5):

Menuiserie | 1500 Pi | Jean M. | ⏳ Depuis 3 jours [ANNULER POSTULATION]

Acceptées (2):

Nettoyage | 500 Pi/jour | Marie R. | ✅ Commence demain [VOIR DÉTAIL] [CHAT] [MARQUER COMMENCÉ]

Terminées (23):

Rénovation cuisine | 3000 Pi | Robert P. | ✅ COMPLÉTÉE [AVIS: ⭐⭐⭐⭐⭐ "Excellent!"] [LAISSER AVIS]


═══════════════════════════════════════════════════════════════════════════════════

## MODULE 2: MARKET (Marché/Achats-Ventes)

### Page Market - Liste Produits


┌─────────────────────────────────────────────────────────────┐
│ MARKET 🛍️    [Ma boutique] [Vendre]                       │
├─────────────────────────────────────────────────────────────┤
│ Catégories: [Fruits] [Vêtements] [Électronique] [Maison]  │
│ Filtres: [Prix ▼] [Distance ▼] [Vendeurs suivis]         │
│ Recherche: [________________________________________]       │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [Image produit]                                      │   │
│ │ 🍅 Tomates fraiches (50kg)                          │   │
│ │ Vendeur: Farmer Marie | ⭐4.9 | 📍3km away          │   │
│ │ Prix: 2500 Pi | ✅ Stock: 20x                       │   │
│ │ [❤️] [👁️ Suivi: 234] [👤 Vendeur]                  │   │
│ │ [ACHETER] [AJOUTER PANIER]                          │   │
│ └──────────────────────────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ [Image produit]                                      │   │
│ │ 👕 T-shirt coton (taille M)                        │   │
│ │ Vendeur: Fashion Store | ⭐4.6 | 📍1km away         │   │
│ │ Prix: 800 Pi | ✅ Stock: 50x                        │   │
│ │ [❤️] [👁️ Suivi: 456] [👤 Vendeur]                  │   │
│ │ [ACHETER] [AJOUTER PANIER]                          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘


### Page Product Detail


┌─────────────────────────────────────────────────────────────┐
│ ← RETOUR | [❤️] Ajouter aux favoris | [📤] Partager       │
├─────────────────────────────────────────────────────────────┤
│ GALERIE PHOTOS (slider):                                   │
│ [Grande image produit]                                      │
│ [Thumbnails: img1 img2 img3]                               │
│                                                             │
│ INFORMATIONS PRODUIT:                                       │
│ Tomates fraiches du jour                                    │
│ Prix: 2500 Pi pour 50kg                                    │
│ ⭐⭐⭐⭐⭐ 4.9 (234 avis)                                    │
│ ✅ En stock: 20 disponibles                               │
│ 📍 Lieu: Quartier Kinama, Bujumbura                       │
│ 🚚 Livraison: Gratuite (5km) | 200 Pi (plus loin)        │
│ 📅 Disponible: Jusqu'à demain 18h                         │
│                                                             │
│ DESCRIPTION:                                               │
│ "Tomates cultivées localement sans pesticides.             │
│  Fraiches du jour. Parfait pour restaurants ou familles.   │
│  Possibilité de livraison. Commande minimum 10kg."         │
│                                                             │
│ VENDEUR:                                                    │
│ [Photo] Farmer Marie                                       │
│ "Agricultrice spécialisée en légumes biologiques"          │
│ ⭐ 4.9 (234 avis) | 👥 5234 Followers                     │
│ ✅ Membre depuis 2 ans | 98% satisfaction                 │
│ [PROFIL VENDEUR] [FOLLOW] [CHAT DIRECT]                  │
│                                                             │
│ AVIS CLIENTS:                                              │
│ ⭐⭐⭐⭐⭐ "Fraiches et délicieuses!" - Jean D. (il y a 2j) │
│ ⭐⭐⭐⭐⭐ "Excellente qualité, livraison rapide" - Sarah   │
│ ⭐⭐⭐⭐ "Bon, mais un peu cher" - Marc L.                 │
│ [VOIR TOUS LES AVIS (234)]                                │
│                                                             │
│ ════════════════════════════════════════════════════════   │
│ Quantité: [1 ▼] kg/unités                                  │
│ [AJOUTER AU PANIER] [ACHETER MAINTENANT] [SIGNALER]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘


### Page "Vendre" (Créer Annonce)
Formulaire:
- Photos produit (min 3, max 10) * [Upload drag-drop]
- Titre du produit *
- Catégorie * (Fruits, Électronique, Vêtements, Maison, Services, etc.)
- Description détaillée *
- Prix en Pi *
- Quantité disponible *
- Unité (kg, unités, etc.) *
- Localisation *
- Livraison disponible? (Oui/Non)
  - Rayon livraison gratuite (km)
  - Prix livraison (Pi)
- Date limite de disponibilité
- Tags/Mots-clés
- [PUBLIER ANNONCE] [APERÇU] [BROUILLON]

### Page Ma Boutique (Vendeur)


┌─────────────────────────────────────────────────────────────┐
│ MA BOUTIQUE 🏪                    [Éditer profil]         │
├─────────────────────────────────────────────────────────────┤
│ [Bannière] [Logo] Farmer Marie                             │
│ ⭐ 4.9 (234 avis) | 📍 Bujumbura | 👥 5,234 Followers   │
│ "Agricultrice spécialisée en légumes biologiques"          │
│ [FOLLOW] [PARTAGER BOUTIQUE]                               │
│                                                             │
│ STATISTIQUES:                                               │
│ 📊 45 produits | 💰 2,345 Pi/mois | ⭐ 98% satisfaction  │
│ 👥 Followers: 5,234 | 💬 Messages: 12 non lus             │
│                                                             │
│ MES ANNONCES ACTIVES:                                      │
│ ┌──────────────────────────┐                              │
│ │ [Image] Tomates (50kg)   │                              │
│ │ 2500 Pi | ✅ 20 stock   │                              │
│ │ [👁️ 234] [💬 8]         │                              │
│ │ [ÉDITER] [ARCHIVER]      │                              │
│ └──────────────────────────┘                              │
│                                                             │
│ [CRÉER NOUVELLE ANNONCE]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════

## MODULE 3: WALLET PI & PAIEMENTS

### Page Wallet Pi


┌─────────────────────────────────────────────────────────────┐
│ WALLET PI 💰                                                │
├─────────────────────────────────────────────────────────────┤
│ 🔐 Connecté à: pi://mon-username                           │
│                                                             │
│ SOLDE:                                                      │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Solde Total:  15,230 Pi                              │   │
│ │ (≈ 45,690 FBu selon taux actuel)                    │   │
│ │                                                       │   │
│ │ Solde bloqué en escrow: 2,500 Pi                    │   │
│ │ Solde disponible: 12,730 Pi                         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ACTIONS:                                                    │
│ [ENVOYER PI] [RECEVOIR] [CONSULTER ADRESSE] [PARAMÈTRES]  │
│                                                             │
│ HISTORIQUE TRANSACTIONS (10 dernières):                   │
│ ────────────────────────────────────────────────────────   │
│ Date | Type | Montant | De/À | Statut | Détails          │
│ ────────────────────────────────────────────────────────   │
│ 15/08 | Paiement | +500 Pi | Job complété | ✅ Confirmé   │
│ 14/08 | Achat | -2500 Pi | Tomates | ✅ Confirmé         │
│ 13/08 | Paiement | +800 Pi | Service plomberie | ✅ OK    │
│ 12/08 | Paiement | -300 Pi | Frais plateforme | ✅ OK     │
│ 11/08 | Transfert | +1000 Pi | Ami Marie | ✅ Confirmé    │
│                                                             │
│ [VOIR TOUT L'HISTORIQUE]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘


### Modal "Envoyer Pi"


┌──────────────────────────────────┐
│ ENVOYER PI                    ✕  │
├──────────────────────────────────┤
│ Destinataire:                    │
│ [Entrer nom/adresse/username]   │
│ OU [Sélectionner dans contacts] │
│                                  │
│ Montant (Pi): []     │
│              (Max: 12,730 Pi)   │
│                                  │
│ Message/Raison:                  │
│ [____________]        │
│ (Optionnel)                      │
│                                  │
│ Frais estimés: 5 Pi             │
│                                  │
│ [VÉRIFIER] [ANNULER]            │
│                                  │
└──────────────────────────────────┘


### Page d'Achat (Checkout)


┌─────────────────────────────────────────────────────────────┐
│ CONFIRMER ACHAT                                             │
├─────────────────────────────────────────────────────────────┤
│ RÉCAPITULATIF:                                              │
│ • Tomates fraiches (50kg) ........... 2,500 Pi            │
│ • Livraison (....................... 200 Pi             │
│ ────────────────────────────────────────────────            │
│ TOTAL ......................... 2,700 Pi                   │
│                                                             │
│ PAIEMENT:                                                   │
│ Solde compte: 12,730 Pi ✅ (Suffisant)                    │
│                                                             │
│ ADRESSE DE LIVRAISON:                                       │
│ [Quartier Rohero, Bujumbura, Burundi]                     │
│ [MODIFIER]                                                  │
│                                                             │
│ ════════════════════════════════════════════════════════   │
│ 🔒 Paiement sécurisé via Pi Network                       │
│                                                             │
│ [CONFIRMER PAIEMENT] [ANNULER]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘


Après confirmation:


✅ PAIEMENT RÉUSSI!

Montant: 2,700 Pi
Référence: #BPC2024081500123
Vendeur: Farmer Marie
Produit: Tomates fraiches

Transaction sur blockchain Pi: confirmée ✅
Votre nouveau solde: 10,030 Pi

[CONTINUER SHOPPING] [VOIR COMMANDE] [CHAT VENDEUR]


═══════════════════════════════════════════════════════════════════════════════════

## MODULE 4: CHAT & COMMUNICATIONS

### Page Chat List


┌─────────────────────────────────────────────────────────────┐
│ MESSAGES 💬                       [NOUVEAU MESSAGE]         │
├─────────────────────────────────────────────────────────────┤
│ Recherche: [____________________________]                   │
│                                                             │
│ CONVERSATIONS:                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 👨‍💼 Jean M. (Menuiserie)              🔴 Il y a 2 min  │  │
│ │ "D'accord, j'accepte ta postulation pour demain 8h"  │  │
│ │ [Emploi: Fabrication portes]                         │  │
│ │ [Voir conversation]                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 👩‍🌾 Farmer Marie (Market)             ⚪ Il y a 1h     │  │
│ │ "Merci pour l'achat! Livraison demain à 10h"        │  │
│ │ [Achat: Tomates 50kg]                               │  │
│ │ [Voir conversation]                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔧 Robert P. (Plomberie)             ⚪ Il y a 1 jour   │  │
│ │ "Ton profil m'intéresse, tu cherches du travail?"    │  │
│ │ [Service: Réparation tuyauterie]                    │  │
│ │ [Voir conversation]                                  │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘


### Chat Window


┌─────────────────────────────────────────────────────────────┐
│ ← Jean M. (Menuiserie) | ⭐4.7 | 📍2km | [APPELER] [INFO]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Il y a 2 min                                               │
│ Jean: "D'accord, j'accepte ta postulation pour demain 8h" │
│        "Rendez-vous à 7h30 à Rohero"                      │
│        [Ofre d'emploi partagée: Fabrication portes]      │
│                                                             │
│ Il y a 5 min                                               │
│ Moi: "Merci! Je confirme pour demain"                     │
│      "J'ai 3 ans d'expérience en menuiserie"             │
│                                                             │
│ Il y a 10 min                                              │
│ Jean: "Tes qualifications correspondent parfaitement"     │
│       "Je vais te payer 1500 Pi pour 3 jours de travail"  │
│                                                             │
│ ════════════════════════════════════════════════════════   │
│ [Saisir message...________________________]                │
│ [📎 Pièce] [👍] [😊] [Envoyer]                           │
│                                                             │
│ OPTIONS:                                                    │
│ [APPELER] [PARTAGER] [SIGNALER] [BLOQUER]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════

## MODULE 5: FEED SOCIAL & HOME

### Page Home (Feed)


┌─────────────────────────────────────────────────────────────┐
│ ACCUEIL 🏠    [JOBS] [MARKET] [SERVICES] [SUIVIS] [MOI]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👥 Suggestions d'utilisateurs à suivre:              │   │
│ │ [Photo] Jean M. - Menuisier | ⭐4.7 | [FOLLOW]       │   │
│ │ [Photo] Marie R. - Agricultrice | ⭐4.9 | [FOLLOW]   │   │
│ │ [Photo] Robert P. - Plombier | ⭐4.8 | [FOLLOW]      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ NOUVELLES OFFRES D'EMPLOI:                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 👨‍💼 Jean M. a publié une nouvelle offre             │   │
│ │ "Rénovation 2 appartements" | 4500 Pi | Urgent     │   │
│ │ [VOIR] [PARTAGER]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ PRODUITS TENDANCE:                                          │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🍅 Tomates fraiches | 2500 Pi | Farmer Marie        │   │
│ │ [❤️ 234] [👁️ 1.2k] [ACHETER]                        │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ UTILISATEURS QUE TU SUIS - ACTIVITÉ RÉCENTE:              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ✅ Robert P. a complété un job de plomberie        │   │
│ │    "Excellent résultat!" - Note: ⭐⭐⭐⭐⭐ 5/5      │   │
│ │ ✅ Marie R. a publié "Mangues du Burundi"          │   │
│ │    800 Pi | En stock: 50kg                          │   │
│ │ 💬 Jean M. a écrit "Cherche 3 électriciens URGENT"│   │
│ │    6000 Pi | Commençer maintenant                   │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════════

## BARRE DE NAVIGATION (Bottom Tab Bar)

Icônes + Labels (mobile bottom navigation):


[🏠 Accueil] [💼 Jobs] [🛍️ Market] [💬 Chat] [👤 Profil]


Desktop (top navigation):


Logo BURUNDI PI CONNECT | [Jobs] [Market] [Messages] [Wallet]
                                                    [⚙️ Profil]


═══════════════════════════════════════════════════════════════════════════════════

## FONCTIONNALITÉS SPÉCIFIQUES À IMPLÉMENTER

### Boutons clés à ajouter partout:

1. **FOLLOW / UNFOLLOW**
   - Bouton toggle sur tous les profils
   - Affiche "👥 FOLLOWERS (nombre)"
   - Ajoute l'utilisateur à "Mes suivis"

2. **BUY (Acheter)**
   - Sur chaque produit Market
   - Lance le flux d'achat avec payment Pi
   - "Prix: X Pi [ACHETER]"

3. **CHAT / CONTACT**
   - Sur tous les profils
   - Ouvre le chat direct
   - Notifications de nouveau message

4. **PROFIL (Utilisateur)**
   - Cliquable sur chaque nom/photo
   - Affiche profil complet utilisateur
   - Options: Follow, Chat, Partager, Signaler

5. **ÉVALUER/AVIS**
   - Après chaque transaction
   - Modal avec étoiles + texte
   - Poids dans le score global

6. **GÉOLOCALISATION**
   - "📍 X km away" sur chaque listing
   - Filtre par distance
   - Map optionnelle

7. **FAVORIS (❤️)**
   - Sauvegarder produits/profils
   - Page "Mes favoris"
   - Notifications si prix baisse

8. **PARTAGER**
   - Partager produits/offres/profils
   - Lien unique
   - Statistiques de partage

9. **SIGNALER**
   - Report utilisateur/listing suspect
   - Raison du signalement
   - Examen par modérateurs

10. **NOTIFICATIONS**
    - Push notifications
    - Bell icon avec badge
    - Centre de notifications

═══════════════════════════════════════════════════════════════════════════════════

## INTÉGRATION PI NETWORK (placeholder pour Pi App Studio)

Ajouter partout où il y a un paiement:


Paiement via Pi Network
  



```



═══════════════════════════════════════════════════════════════════════════════════

RESPONSIVE DESIGN

Mobile (< 768px):

Single column layout

Bottom tab navigation

Full-width cards

Touch-friendly buttons (min 44px)

Tablet (768px - 1024px):

Two column grid

Side navigation

Cards side-by-side

Desktop (> 1024px):

Three column grid where applicable

Top navigation bar

Sidebar

Multiple cards per row

═══════════════════════════════════════════════════════════════════════════════════

SÉCURITÉ & VALIDATION

Validation email/téléphone

Confirmation d'email

2FA optionnel

HTTPS everywhere

Pas de stockage de mots de passe en clair

Rate limiting sur les requêtes

Protection CSRF

═══════════════════════════════════════════════════════════════════════════════════

PAGES À CRÉER MINIMALES

✅ Login/Register

✅ Home Feed

✅ User Profile (view + edit)

✅ Jobs List & Job Detail

✅ Create Job Offer

✅ Market List & Product Detail

✅ Create Listing

✅ Wallet Pi Display

✅ Checkout/Payment

✅ Chat List & Chat Window

✅ My Shop (pour vendors)

✅ My Applications (pour workers)

✅ Settings/Preferences

✅ Notifications

✅ Favorites/Saved

═══════════════════════════════════════════════════════════════════════════════════

LIBRAIRIES À UTILISER

Recommandations React:

React Router v6 (navigation)

Axios ou Fetch (API calls)

React Query (state management)

Tailwind CSS ou MUI (styling)

React Toastify (notifications)

React Icons (icons)

Firebase SDK (auth & database)

═══════════════════════════════════════════════════════════════════════════════════

DEMANDE: 
Génère l'application React complète avec tous ces modules intégrés, code bien structuré,
composants réutilisables, prêt pour Pi App Studio, et export vers GitHub.

Sois certain que:

✅ Tout est en FRANÇAIS

✅ Design mobile-first

✅ Couleurs cohérentes (vert Burundi + Pi gold)

✅ Tous les boutons spécifiques présents (Buy, Follow, Profile, Chat, Pay)

✅ Pas d'erreurs de syntaxe

✅ Code modulaire et maintenable

✅ Prêt pour connection avec Pi App Studio

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pi-burundi-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4c2efe0c-fc97-45aa-becc-558c99928a5d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
