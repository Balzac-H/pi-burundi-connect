-- WICO — Paiements Pi, escrow et règles d'accès
-- À appliquer après les migrations existantes (tables profils, produits, jobs,
-- orders, payments, reviews, follows, messages, notifications, user_roles,
-- signalements, litiges, reglages déjà créées).

/* ------------------------------------------------------------------ */
/* 1. Statuts normalisés                                              */
/* ------------------------------------------------------------------ */

-- Commandes : en_attente_paiement → payee → recue ; annulee / remboursee / litige
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_statut_chk;
ALTER TABLE public.orders ADD CONSTRAINT orders_statut_chk
  CHECK (statut IN ('en_attente_paiement', 'payee', 'recue', 'annulee', 'remboursee', 'litige'));

-- Paiements (escrow) : pending → approved → paid_held → released
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_statut_chk;
ALTER TABLE public.payments ADD CONSTRAINT payments_statut_chk
  CHECK (statut IN ('pending', 'approved', 'paid_held', 'released', 'refunded', 'cancelled'));

-- Litiges
ALTER TABLE public.litiges DROP CONSTRAINT IF EXISTS litiges_statut_chk;
ALTER TABLE public.litiges ADD CONSTRAINT litiges_statut_chk
  CHECK (statut IN ('ouvert', 'resolu', 'rejete'));

/* ------------------------------------------------------------------ */
/* 2. Lectures publiques : uniquement les annonces publiées            */
/* ------------------------------------------------------------------ */

DROP POLICY IF EXISTS "Produits visibles par tous" ON public.produits;
CREATE POLICY "Annonces publiees visibles par tous"
  ON public.produits FOR SELECT
  USING (publie = true OR auth.uid() = vendeur_id);

-- Les jobs restent lisibles par tous (publication = insertion)
DROP POLICY IF EXISTS "Jobs visibles par tous" ON public.jobs;
CREATE POLICY "Jobs visibles par tous" ON public.jobs FOR SELECT USING (true);

/* ------------------------------------------------------------------ */
/* 3. Index pour les listes (acheteur / vendeur / paiement)            */
/* ------------------------------------------------------------------ */

CREATE INDEX IF NOT EXISTS orders_acheteur_idx ON public.orders (acheteur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_vendeur_idx  ON public.orders (vendeur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payments_order_idx  ON public.payments (order_id);
CREATE INDEX IF NOT EXISTS payments_user_idx   ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS produits_vendeur_idx ON public.produits (vendeur_id, created_at DESC);
CREATE INDEX IF NOT EXISTS litiges_statut_idx  ON public.litiges (statut, created_at DESC);

/* ------------------------------------------------------------------ */
/* 4. Réglages admin : taux d'équivalence FBu (désactivé par défaut)   */
/*    Le prix en π reste la seule source de vérité tant que             */
/*    « actif » est à false.                                           */
/* ------------------------------------------------------------------ */

INSERT INTO public.reglages (cle, valeur)
VALUES ('taux_fbu', '{"actif": false, "taux": null, "maj": null}'::jsonb)
ON CONFLICT (cle) DO NOTHING;

/* ------------------------------------------------------------------ */
/* 5. Commission : 2 % calculés uniquement à la libération (côté        */
/*    serveur, dans la fonction pi-release). Aucun déclencheur.        */
/* ------------------------------------------------------------------ */

COMMENT ON TABLE public.payments IS
  'Escrow Pi : pending, approved, paid_held, released, refunded, cancelled. Commission 2 % enregistrée à la libération.';
COMMENT ON TABLE public.orders IS
  'Commandes acheteur/vendeur. Statut piloté côté serveur (pi-approve/pi-complete/pi-cancel) ou par la RPC confirmer_reception.';
