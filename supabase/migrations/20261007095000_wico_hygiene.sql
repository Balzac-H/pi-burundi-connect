-- WICO — F. Hygiène : commandes « en_attente_paiement » abandonnées.
--
-- Une commande de plus de 30 minutes sans paiement approuvé passe
-- automatiquement à 'annulee'. La fonction est :
--   · appelée par le client à l'ouverture de l'historique (RPC) ;
--   · planifiée par pg_cron si l'extension est disponible.

/* ------------------------------------------------------------------ */
/* 1. Index pour la recherche des commandes périmées                   */
/* ------------------------------------------------------------------ */

CREATE INDEX IF NOT EXISTS orders_statut_created_idx
  ON public.orders (statut, created_at);

/* ------------------------------------------------------------------ */
/* 2. Fonction d'annulation                                            */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.annuler_commandes_perimees()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  n integer := 0;
BEGIN
  -- 1. Paiements encore « pending » sur une commande périmée.
  UPDATE public.payments p
     SET statut = 'cancelled', updated_at = now()
   WHERE p.statut = 'pending'
     AND EXISTS (
       SELECT 1
         FROM public.orders o
        WHERE o.id = p.order_id
          AND o.statut = 'en_attente_paiement'
          AND o.created_at < now() - interval '30 minutes'
          AND NOT EXISTS (
            SELECT 1 FROM public.payments x
             WHERE x.order_id = o.id
               AND x.statut IN ('approved', 'paid_held', 'released')
          )
     );

  -- 2. Les commandes elles-mêmes (uniquement sans paiement approuvé).
  UPDATE public.orders o
     SET statut = 'annulee', updated_at = now()
   WHERE o.statut = 'en_attente_paiement'
     AND o.created_at < now() - interval '30 minutes'
     AND NOT EXISTS (
       SELECT 1 FROM public.payments x
        WHERE x.order_id = o.id
          AND x.statut IN ('approved', 'paid_held', 'released')
     );
  GET DIAGNOSTICS n = ROW_COUNT;

  RETURN COALESCE(n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.annuler_commandes_perimees() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.annuler_commandes_perimees() TO authenticated, service_role;

COMMENT ON FUNCTION public.annuler_commandes_perimees() IS
  'Annule les commandes en_attente_paiement de plus de 30 minutes sans paiement approuve.';

/* ------------------------------------------------------------------ */
/* 3. Planification (pg_cron si présent)                               */
/* ------------------------------------------------------------------ */

DO $do$
BEGIN
  PERFORM cron.schedule(
    'wico-commandes-perimees',
    '* * * * *',
    $job$SELECT public.annuler_commandes_perimees()$job$
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron indisponible, annulation assurée à l''ouverture de l''historique : %', SQLERRM;
END;
$do$;
