# Arija Connect

**Arija Connect — Marché et emplois solidaires au Burundi.**

Arija Connect est une plateforme peer-to-peer où les membres publient des annonces de
produits et services, diffusent des offres d'emploi et règlent en Pi Network.
Deux usages sur un seul compte : acheter/vendre sur le marché, et proposer ou
répondre à des offres de travail.

Arija Connect est une initiative de l'ONG **ARIJA** : Alliance pour le Renforcement
des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples.
L'application reste indépendante, non affiliée à Pi Network ni à la Pi Core Team.

## Stack

- React 19, TanStack Start / Router, TypeScript, Tailwind CSS v4
- Vite, Nitro (build serveur), PWA (service worker généré)
- Supabase (PostgreSQL, RLS) pour les données
- Pi Network SDK pour l'identité et les paiements
- Sonner pour les toasts, `src/lib/i18n.ts` pour 4 langues (fr, rn, sw, en)

## Démarrage

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production
npm run lint       # eslint
npm run format     # prettier --write
npx tsc --noEmit   # vérification des types
```

Variables d'environnement : voir `.env.example`.

## Structure

```
src/
  routes/          pages (fichiers = routes, TanStack Start)
  components/      AppShell, ui-kit, ProfilComplet, AssistantArija, ...
  components/ui/   composants shadcn (inchangés)
  lib/             i18n, store, comptes, annonces, achats, pi.*, admin.*
  styles.css       jetons du design system (couleurs, typos, rayons)
supabase/
  migrations/      schéma SQL et règles RLS
public/            logo-arija.svg, manifest.webmanifest
```

## Identité

- Nom visible : **Arija Connect**. Sous-titre : « Marché et emplois solidaires au
  Burundi ».
- L'ancien nom de plateforme ne doit plus apparaître dans l'interface, les
  titres, les métadonnées, le manifest, le sitemap, les messages, les factures
  ni la documentation. Le préfixe de facture est `ARIJA-`.
- Exceptions volontaires (ne pas « corriger »), car techniques ou historiques :
  les clés de stockage local `wico-theme`, `wico-factures`, `bpc-preferences`
  et `bpc-notifications`, le domaine des comptes techniques
  `pi-<uid>@pi.wico.app` (défaut `pi.wico.app` dans `src/lib/env.ts`), les
  constantes métier `WICO:*` de `src/lib/admin.functions.ts`, et les noms de
  fichiers de migrations. Aucune de ces chaînes n'est visible pour l'utilisateur.

## Gouvernance

Les rôles sont portés par la table `public.user_roles` (`admin`, `moderator`,
`user`). Il n'existe pas d'auto-promotion : le premier responsable doit être
désigné manuellement dans Supabase.

```sql
-- Premier administrateur (à exécuter une fois, avec l'UUID du membre).
insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');

-- Modérateur.
insert into public.user_roles (user_id, role) values ('<uuid>', 'moderator');
```

Règles appliquées côté serveur (`src/lib/admin.functions.ts`) :

- **Double validation** : au-delà du seuil (`reglages.seuil_double_validation`,
  modifiable dans l'espace responsable), une libération de fonds exige une
  seconde validation par un **autre** administrateur
  (`WICO:SEUIL_DOUBLE_VALIDATION`, `WICO:DEJA_PREMIER_VALIDATEUR`).
- **Conflit d'intérêt** : un responsable ne peut ni libérer, ni rembourser, ni
  trancher une commande où il est acheteur ou vendeur
  (`WICO:CONFLIT_INTERET`).
- **Audit** : chaque action sensible est inscrite dans `public.audit_log` via
  la fonction `public.ecrire_audit`, avec l'acteur, l'action, la cible et le
  détail.

## Comportements clés

- **Stock atomique et réservé** : `public.decrementer_stock` décrémente le stock
  en une seule instruction conditionnelle (`stock >= quantité`) ; une commande
  en attente de paiement de moins de 30 minutes réserve le stock pour les autres
  acheteurs (`order_items_calculer_ligne`). Si une annonce s'épuise entre le
  panier et la finalisation, la commande part en litige et le paiement entre
  dans la file « Remboursements à effectuer ».
- **Horloge de 72 h fiable** : la libération automatique des fonds se base sur
  `orders.livre_declare_at`, sinon `payments.paid_held_at` renseigné à la
  finalisation du paiement — jamais sur `updated_at`.
- **Remboursements honnêtes** : l'application ne renvoie jamais l'argent
  automatiquement. Un admin confirme dans Pi, puis renseigne `confirme = true`
  et un `txid` facultatif (`piRefund`) ; en attendant, le paiement reste dans la
  file `payments.a_rembourser`.
- **Assistant** : activable/coupable via `reglages.assistant_actif`. Il rappelle
  de ne jamais partager d'informations personnelles ou sensibles.
- **Espace données** (`/admin/donnees`) : lecture seule, réservée aux admins,
  pagination 50 lignes, contrôle de cohérence, export CSV (≤ 5000 lignes)
  audité, masquage des identifiants et téléphones (révélation auditée).

## Design system

Règles appliquées dans `src/styles.css` et `src/components/ui-kit.tsx` :

- Fond de page `#FBFAF7`, cartes blanches, bordure `#E8E5DC` 1 px, rayon max 12 px
- Texte `#22251F`, secondaire `#5E625A`, accent unique vert profond `#1F4E3D`
- L'ocre est réservé au statut « En attente » (`bg-attente-bg text-attente`)
- Fonte unique Inter : corps 15 px, secondaire 13 px, titres 22/18/16 en 600
- Grille de 8 px, cibles tactiles ≥ 44 px, boutons coins 8 px, focus visible
- Pas d'emoji, pas d'icône décorative : les boutons portent un libellé texte
  (seule exception : le pictogramme panier de l'entête)
- Pas de dégradé, pas d'ombre portée de carte, pas de `font-extrabold`,
  pas de capitales sur les boutons, pas de `tracking-*`
- Le mode sombre reste disponible

## Pages institutionnelles

- `/a-propos` : mission, membres, gouvernance, contact (formulaire), support
- `/transparence` : commission de 2 %, chiffres réels, règles de gestion
- `/conditions` : conditions d'utilisation, clause « Paiements, fonds retenus
  et litiges »
- `/confidentialite` : politique de confidentialité

## Pi Network

L'authentification passe par le SDK Pi (`src/lib/pi-session.ts`) et le serveur
(`src/lib/pi.functions.ts`). Les paiements suivent la séquence décrite dans
`src/lib/achat.ts` : session Pi, commande en base, puis un paiement Pi par
vendeur. Les fonds sont retenus jusqu'à confirmation de réception.

## Vérifications

Avant de pousser :

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Recherche de régressions visuelles :

```bash
grep -rn 'WICO\|Wisdom' src          # doit rester vide hors exceptions métier
grep -rln 'lucide-react' src | grep -v components/ui
grep -rn 'gradient-\|shadow-\[var\|font-extrabold' src
```

## Lovable

Ce projet est connecté à Lovable : ne pas réécrire l'historique déjà poussé
(force push, rebase, amend, squash), les commits remontent dans l'éditeur.
