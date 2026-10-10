-- Arija Connect — Remboursements honnêtes.
--
--  · payments.a_rembourser : le paiement attend un remboursement effectué
--    MANUELLEMENT dans Pi (l'application ne renvoie pas l'argent toute seule).
--  · payments.rembourse_le / rembourse_par : traçabilité de la confirmation.
--
-- La file « Remboursements à effectuer » = paiements avec a_rembourser = true
-- et statut <> 'refunded'. Un remboursement insuffisant de stock (finalisation
-- d'un paiement sur une annonce épuisée) alimente cette file automatiquement.
--
-- Aucune migration existante n'est modifiée.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS a_rembourser boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rembourse_le timestamptz,
  ADD COLUMN IF NOT EXISTS rembourse_par uuid;

CREATE INDEX IF NOT EXISTS payments_a_rembourser_idx
  ON public.payments (a_rembourser, created_at DESC)
  WHERE a_rembourser = true AND statut <> 'refunded';

COMMENT ON COLUMN public.payments.a_rembourser IS
  'True quand l''argent recu doit etre rendu a l''acheteur par un remboursement Pi manuel (jamais automatique).';
COMMENT ON COLUMN public.payments.rembourse_le IS
  'Date a laquelle un admin a confirme avoir effectue le remboursement dans Pi.';
COMMENT ON COLUMN public.payments.rembourse_par IS
  'Admin ayant confirme le remboursement effectue dans Pi.';
