# WICO — Wisdom Connect

Marketplace et emplois au Burundi, payés en Pi (Pi SDK 2.0).

## Variables
| Nom | Où | Rôle |
|---|---|---|
| `PI_API_KEY` | Secret serveur | Clé API de l'app (Pi Developer Portal). Sert à approuver/finaliser les paiements. |
| `VITE_PI_SANDBOX` | Public | `true` (défaut) = Testnet / sandbox ; `false` = Mainnet. |

Ne jamais fournir la clé privée d'un portefeuille.

## Tester en sandbox
1. Pi Developer Portal (dans le Pi Browser) → créer l'app, réseau **Testnet**.
2. URL de l'app = URL publiée de WICO. Copier la clé de validation du domaine dans `public/validation-key.txt`, publier, puis valider le domaine.
3. Ajouter `PI_API_KEY` dans les secrets du projet.
4. Ouvrir l'URL sandbox fournie par le portail, se connecter avec Pi, acheter une annonce.

## Passer en Mainnet
1. Créer/basculer l'app sur **Mainnet** dans le portail, avec sa propre clé API et sa clé de validation.
2. Mettre à jour `PI_API_KEY` et `public/validation-key.txt`.
3. Définir `VITE_PI_SANDBOX=false`, republier.

## Flux de paiement
Commande créée en base → `Pi.createPayment` → `piApprove` (vérifie montant, utilisateur, commande) → `piComplete` (idempotent, enregistre le txid, fonds « retenus ») → l'admin « libère » (`piRelease`, commission 2 %). Le reversement A2U au vendeur reste à faire (TODO dans `src/lib/pi.functions.ts`).
