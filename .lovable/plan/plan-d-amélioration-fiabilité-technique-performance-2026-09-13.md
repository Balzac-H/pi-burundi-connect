# Plan d'amélioration — Fiabilité technique & performance

## Objectif
Rendre BURUNDI PI CONNECT stable, rapide et robuste avant d'ajouter de nouvelles fonctionnalités. Le plan corrige d'abord les bugs de stabilité visibles, puis renforce l'architecture, la performance et la sécurité des données.

---

## Phase 1 — Stabilité immédiate (haute priorité, faible effort)

### 1.1 Corriger la boucle infinie des notifications
**Problème :** la console affiche `The result of getServerSnapshot should be cached to avoid an infinite loop` dans `src/lib/notifications.ts:48` (`useNotifsLive`). À terme cela peut figer l'interface ou vider la batterie.
**Action :** transformer `notifsLive.get` en fonction stable et mémoriser le `getServerSnapshot` pour éviter de créer une nouvelle fonction à chaque rendu.

### 1.2 Corriger le montant de la livraison
**Problème :** `FRAIS_LIVRAISON = 200` dans `src/routes/paiement.tsx:21` est incohérent avec l'échelle de prix en π (0,001 – 1 π). Cela affiche des frais de livraison de 200 π.
**Action :** passer `FRAIS_LIVRAISON` à une valeur réaliste (ex. 0,02 π) et ajouter un test unitaire sur le calcul du total du panier.

### 1.3 Remplacer les `toast()` sans effet
**Problème :** plusieurs boutons (`Recevoir`, paramètres, nouvelle conversation) déclenchent un `toast.success()` sans action réelle, ce qui trompe l'utilisateur.
**Action :** soit implémenter la fonctionnalité, soit afficher un état "Bientôt disponible" explicite.

---

## Phase 2 — Architecture & qualité du code

### 2.1 Unifier la recherche
**Problème :** la recherche est implémentée 4 fois différemment (accueil, market, jobs, vendeurs) avec une logique de filtrage en client et une limite arbitraire de 6 ou 60 résultats.
**Action :** créer un hook partagé `useRecherche` avec debounce, puis l'utiliser dans l'en-tête global, le market, les jobs et l'annuaire vendeurs.

### 2.2 Migrer les données mock vers Lovable Cloud
**Problème :** `src/lib/data.ts` contient encore des utilisateurs, jobs, produits, conversations et transactions fictifs. Les postulations, messages et historiques ne survivent pas au rechargement.
**Action :** créer les tables `jobs`, `postulations`, `conversations`, `messages`, `transactions` et `avis` avec les mêmes patterns RLS/grants que `profils` et `produits`. Remplacer progressivement les mocks par des appels Supabase.

### 2.3 Normaliser les numéros WhatsApp partout
**Problème :** la logique de normalisation existe (`normaliserNumero`), mais certains liens sont encore construits manuellement.
**Action :** utiliser `lienWhatsApp()` et `ouvrirWhatsApp()` de `src/lib/comptes.ts` dans tous les composants affichant un numéro.

---

## Phase 3 — Performance

### 3.1 Pagination côté serveur
**Problème :** `listerProduits` et `chercherProfils` chargent jusqu'à 60 lignes sans pagination ni index full-text.
**Action :** ajouter une pagination (`limit` / `offset`) et des index Postgres (`pg_trgm`, `tsvector`) pour la recherche textuelle.

### 3.2 Optimiser les images
**Problème :** les photos de profil utilisent des URL signées valables 10 ans (`comptes.ts:73`) et les images uploadées ne sont pas redimensionnées.
**Action :** valider type/poids côté client, utiliser des buckets publics avec RLS si possible, et générer des miniatures ou utiliser des formats modernes.

### 3.3 Réduire les re-rendus
**Problème :** le store global (`src/lib/store.ts`) est mis à jour fréquemment ; chaque `useStore` force un rendu même si la valeur sélectionnée n'a pas changé.
**Action :** ajouter une comparaison shallow dans `useStore` pour ne déclencher un rendu que si la valeur sélectionnée change.

---

## Phase 4 — Sécurité & protection des données

### 4.1 Vérifier et durcir les politiques RLS
**Problème :** certaines routes affichent des données sensibles (numéros) sans vérifier que l'utilisateur est authentifié côté serveur.
**Action :** auditer les politiques sur `profils`, `produits` et les futures tables ; s'assurer que la vue `profils_publics` reste la seule accessible aux visiteurs non connectés.

### 4.2 Renforcer le composant `BesoinCompte`
**Problème :** la barrière d'authentification est présentée côté client ; elle peut être contournée.
**Action :** doubler la protection côté serveur sur les server functions sensibles (`creerProduit`, `postuler`, `payer`, `envoyerMessage`) avec `requireSupabaseAuth`.

### 4.3 Valider toutes les entrées utilisateur
**Problème :** peu de validations Zod existent sur les server functions.
**Action :** ajouter des `inputValidator` Zod sur chaque `createServerFn` et sur les formulaires de création (produit, job, profil).

---

## Phase 5 — PWA & expérience hors-ligne

### 5.1 Cacher les données métier, pas seulement les pages vides
**Problème :** le service worker actuel ne met pas en cache les réponses Supabase ; en mode hors-ligne, les listes de produits/jobs apparaissent vides.
**Action :** ajouter une couche de cache applicatif (IndexedDB via une librairie légère) pour les produits, jobs et profils publics, avec rechargement automatique à la reconnexion.

### 5.2 Proposer l'installation sur l'écran d'accueil
**Problème :** le manifeste existe mais aucun bouton n'invite l'utilisateur à installer l'application.
**Action :** ajouter un bandeau "Ajouter à l'écran d'accueil" conditionnel sur mobile.

### 5.3 Aligner le manifeste sur les 4 langues
**Problème :** le manifeste est en français uniquement alors que l'application supporte fr/rn/sw/en.
**Action :** rendre le `lang` du manifeste dynamique ou neutre, et traduire `short_name` / `description`.

---

## Phase 6 — Fondation paiement Pi (prérequis fonctionnel)

### 6.1 Intégrer le vrai SDK Pi Network
**Problème :** aucune référence au SDK Pi (`sdk.minepi.com/pi-sdk.js`) n'existe dans le code. Les paiements sont simulés côté client.
**Action :** charger le SDK, implémenter `Pi.authenticate` et `Pi.createPayment`, créer les server functions `approuverPaiement` / `completerPaiement`, et persister les transactions dans Supabase avec gestion de `onIncompletePaymentFound`.

### 6.2 Récupérer le taux de conversion π/FBu
**Problème :** le taux est codé en dur (`store.ts:90-91`).
**Action :** stocker le taux dans une table de configuration ou le récupérer via une API fiable, avec mise à jour périodique.

---

## Phases recommandées pour commencer

1. Phase 1 (stabilité) — corrige les bugs visibles immédiatement.
2. Phase 2.1 + 2.3 (recherche + WhatsApp) — améliore l'UX sans toucher au backend.
3. Phase 4 (sécurité) — avant d'ouvrir l'application à plus d'utilisateurs.
4. Phase 2.2 (tables réelles) — nécessaire pour que messages/jobs/transactions survivent.
5. Phase 6 (Pi SDK) — débloque la promesse centrale de l'application.

---

## Livrables attendus
- Code sans erreur console sur la page d'accueil.
- Hook `useRecherche` partagé et utilisé dans l'en-tête global.
- Tables Supabase pour `jobs`, `postulations`, `conversations`, `messages`, `transactions`, `avis` avec RLS + grants.
- Server functions protégées par `requireSupabaseAuth` + validation Zod.
- Cache hors-ligne pour les listes de produits et jobs.
- Intégration du SDK Pi Network avec persistance des paiements.
