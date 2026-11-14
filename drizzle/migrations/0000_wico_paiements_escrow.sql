-- WICO — Paiements Pi, escrow et règles d'accès
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_statut_chk;
ALTER TABLE public.orders ADD CONSTRAINT orders_statut_chk
  CHECK (statut IN ('en_attente_paiement', 'payee', 'recue', 'annulee', 'remboursee', 'litige'));
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_statut_chk;
ALTER TABLE public.payments ADD CONSTRAINT payments_statut_chk
  CHECK (statut IN ('pending', 'approved', 'paid_held', 'released', 'refunded', 'cancelled'));
ALTER TABLE public.litiges DROP CONSTRAINT IF EXISTS litiges_statut_chk;
ALTER TABLE public.litiges ADD CONSTRAINT litiges_statut_chk
  CHECK (statut IN ('ouvert', 'resolu', 'rejete'));
DROP POLICY IF EXISTS "Produits visibles par tous" ON public.produits;
DROP POLICY IF EXISTS "Annonces publiees visibles par tous" ON public.produits;
CREATE POLICY "Annonces publiees visibles par tous"
  ON public.produits FOR SELECT
  USING (publie = true OR auth.uid() = vendeur_id);
DROP POLICY IF EXISTS "Jobs visibles par tous" ON public.jobs;
CREATE POLICY "Jobs visibles par tous" ON public.jobs FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS orders_acheteur_idx ON public.orders (acheteur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_vendeur_idx  ON public.orders (vendeur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_order_idx  ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS payments_user_idx   ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS produits_vendeur_idx ON public.produits (vendeur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS litiges_statut_idx  ON public.litiges (statut, created_at DESC);
INSERT INTO public.reglages (cle, valeur)
VALUES ('taux_fbu', '{"actif": false, "taux": null, "maj": null}'::jsonb)
ON CONFLICT (cle) DO NOTHING;