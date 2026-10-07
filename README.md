# Arija

**Arija — Marché et emplois solidaires au Burundi.**

Arija est une plateforme peer-to-peer où les membres publient des annonces de
produits et services, diffusent des offres d'emploi et règlent en Pi Network.
Deux usages sur un seul compte : acheter/vendre sur le marché, et proposer ou
répondre à des offres de travail.

Nom complet de l'organisation :

> Arija : Alliance pour le Renforcement des valeurs d'Intégrité de Justice
> Socio-économique et d'amitié entre les peuples.

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

- Nom visible : **Arija**. Sous-titre : « Marché et emplois solidaires au
  Burundi ».
- L'ancien nom de plateforme ne doit plus apparaître dans l'interface, les
  titres, les métadonnées, le manifest, le sitemap, les messages, les factures
  ni la documentation. Le préfixe de facture est `ARIJA-`.
- Exceptions volontaires (ne pas « corriger ») : la clé de stockage local du
  thème, le domaine des comptes techniques `pi-<uid>@pi.wico.app`, les
  constantes métier `WICO:*` de `src/lib/admin.functions.ts`, et les noms de
  fichiers de migrations, qui sont historiques.

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
