# WICO — Passage en production avec paiements Pi

Ce travail est gros. Il se fera en 4 étapes, testées une par une. Le design et les 4 langues restent en place.

## Étape 1 — Vraies données (sections 1, 2)
- Nouvelles tables avec règles d'accès : commandes, paiements, avis, abonnements (follows), messages, notifications, litiges, réglages admin. On garde et complète celles qui existent déjà (profils, produits, jobs, rôles) : identifiant Pi, nom Pi, quantité minimale, unité, statut publié.
- Retrait de toutes les données de démonstration (annonces, avis, abonnés, solde, fil d'activité, notifications, « pi://didier-n »). À la place, des messages clairs quand il n'y a rien à afficher.
- Le vendeur peut créer, modifier et supprimer ses annonces. La quantité commandée respecte le stock, le minimum et l'unité.
- Suppression de l'affichage « ≈ FBu ». Ajout d'un réglage admin pour le taux, désactivé par défaut.

## Étape 2 — Connexion Pi (section 3)
- Chargement du SDK Pi et démarrage en mode test (« sandbox ») configurable.
- Un seul bouton « Se connecter avec Pi ». Email et Google restent disponibles.
- Le serveur vérifie le jeton auprès de Pi, puis crée ou retrouve le compte lié et ouvre la session.
- Hors du Pi Browser : message « Ouvrez WICO dans le Pi Browser pour payer en Pi ».
- « Acheter » et « Ajouter au panier » demandent une session Pi.

## Étape 3 — Paiement, escrow et Mes paiements (sections 4, 5, 6)
- Fonctions serveur : approbation, finalisation (ne compte jamais deux fois), annulation, et libération (vide pour l'instant, avec une note TODO A2U). Le montant vient toujours de la base, jamais du navigateur. Les erreurs sont journalisées sans montrer la clé.
- Statuts : en attente, approuvé, fonds retenus, libéré, remboursé, annulé. La commission de 2 % est calculée à la libération.
- L'acheteur peut confirmer la réception ou signaler un problème (litige visible dans l'admin).
- La page Portefeuille devient « Mes commandes et paiements » : plus de solde, ni d'envoi, ni de réception.

## Étape 4 — Conformité et finitions (section 7)
- Pages Conditions et Confidentialité (FR complet, résumés RN/SW/EN, mention « à faire valider »), avec des liens dans le pied de page, la connexion et les paramètres.
- « Supprimer mon compte et mes données » dans les paramètres.
- Espace admin visible et accessible aux admins seulement, avec contrôle côté serveur.
- Fichiers `public/validation-key.txt` (vide), `.env.example` et README (sandbox puis Mainnet).
- Retrait du badge Lovable si votre offre le permet.

## Détails techniques
- Fonctions serveur `createServerFn` : `piAuth`, `piApprove`, `piComplete`, `piCancel`, `piRelease`. Appels à `api.minepi.com/v2` avec `Authorization: Key PI_API_KEY` pour les paiements et `Bearer` pour `/me`.
- Session Pi : compte créé par le serveur pour chaque utilisateur Pi, puis connexion par lien magique généré côté serveur.
- Idempotence : contrainte unique sur `payment_id` et vérification du statut avant chaque transition.
- `has_role` est déjà en place : on l'utilise dans les règles d'accès et les fonctions admin.

## Ce qui vous restera à faire
Créer l'app dans le Pi Developer Portal (URL), ajouter la clé `PI_API_KEY` (je vous ouvrirai un formulaire sécurisé), coller la clé de validation du domaine, puis passer `VITE_PI_SANDBOX` à false pour le Mainnet.
