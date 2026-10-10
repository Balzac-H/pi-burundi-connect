-- Arija Connect — Horloge de 72 h fiable.
--
-- La libération des fonds utilise désormais des dates explicites :
--   orders.livre_declare_at (déclaration du vendeur), sinon
--   payments.paid_held_at   (finalisation du paiement), JAMAIS updated_at.
--
-- Aucune migration existante n'est modifiée.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS paid_held_at timestamptz;

COMMENT ON COLUMN public.payments.paid_held_at IS
  'Date de finalisation du paiement (passage a paid_held). Sert d''horloge a la liberation automatique apres 72 h quand le vendeur n''a pas declare la livraison.';

-- Rétro-remplissage : les paiements déjà retenus prennent leur dernière mise
-- à jour (l'ancienne horloge utilisait updated_at) sans réécrire l'historique.
UPDATE public.payments
   SET paid_held_at = updated_at
 WHERE statut = 'paid_held'
   AND paid_held_at IS NULL;
