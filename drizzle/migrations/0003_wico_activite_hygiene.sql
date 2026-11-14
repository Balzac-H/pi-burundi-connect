CREATE OR REPLACE FUNCTION public.profils_verifier_activation()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.vendeur_actif IS TRUE AND COALESCE(OLD.vendeur_actif, FALSE) IS FALSE
     AND (NEW.pi_uid IS NULL OR btrim(NEW.pi_uid) = '') THEN
    RAISE EXCEPTION 'Enregistrez votre identifiant Pi dans votre profil avant d''activer votre espace vendeur.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS profils_verifier_activation ON public.profils;
CREATE TRIGGER profils_verifier_activation BEFORE UPDATE ON public.profils FOR EACH ROW EXECUTE FUNCTION public.profils_verifier_activation();

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS livre_declare_at timestamptz;

CREATE OR REPLACE FUNCTION public.declarer_livraison(_order uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.orders SET livre_declare_at = now()
   WHERE id = _order AND vendeur_id = auth.uid() AND statut = 'payee' AND livre_declare_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Déclaration de livraison impossible : seul le vendeur d''une commande payée peut la marquer comme livrée.';
  END IF;
  PERFORM public.ecrire_audit(auth.uid(), 'livraison_declaree', _order, '{}'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.declarer_livraison(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.declarer_livraison(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.orders_verifier_livraison()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.livre_declare_at IS DISTINCT FROM OLD.livre_declare_at AND auth.uid() IS NOT NULL
     AND (auth.uid() <> OLD.vendeur_id OR OLD.statut <> 'payee') THEN
    RAISE EXCEPTION 'Déclaration de livraison impossible : seul le vendeur d''une commande payée peut la marquer comme livrée.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS orders_verifier_livraison ON public.orders;
CREATE TRIGGER orders_verifier_livraison BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_verifier_livraison();

CREATE OR REPLACE VIEW public.gains_lignes WITH (security_invoker = on) AS
SELECT o.id AS order_id, o.vendeur_id, o.titre, o.quantite, o.unite, o.montant, o.statut, o.created_at, o.livre_declare_at,
  p.statut AS paiement_statut, p.commission,
  CASE WHEN p.statut = 'paid_held' THEN o.montant ELSE 0 END AS en_escrow,
  CASE WHEN p.statut = 'released' THEN o.montant ELSE 0 END AS libere_brut,
  CASE WHEN p.statut = 'released' THEN o.montant - COALESCE(p.commission, 0) ELSE 0 END AS libere_net,
  CASE WHEN p.statut = 'released' THEN COALESCE(p.commission, 0) ELSE 0 END AS commission_payee
FROM public.orders o
LEFT JOIN LATERAL (SELECT pp.statut, pp.commission FROM public.payments pp WHERE pp.order_id = o.id ORDER BY pp.created_at DESC LIMIT 1) p ON true;
GRANT SELECT ON public.gains_lignes TO authenticated;

CREATE OR REPLACE VIEW public.gains_totaux WITH (security_invoker = on) AS
SELECT vendeur_id, COALESCE(sum(en_escrow), 0) AS en_escrow, COALESCE(sum(libere_brut), 0) AS libere_brut,
  COALESCE(sum(libere_net), 0) AS libere_net, COALESCE(sum(commission_payee), 0) AS commission_payee
FROM public.gains_lignes GROUP BY vendeur_id;
GRANT SELECT ON public.gains_totaux TO authenticated;

CREATE OR REPLACE VIEW public.clients_vendeur WITH (security_invoker = on) AS
SELECT vendeur_id, acheteur_id, count(*) AS nb_commandes, sum(montant) AS total, max(created_at) AS derniere_commande
FROM public.orders WHERE statut NOT IN ('annulee', 'en_attente_paiement') GROUP BY vendeur_id, acheteur_id;
GRANT SELECT ON public.clients_vendeur TO authenticated;

CREATE INDEX IF NOT EXISTS orders_statut_created_idx ON public.orders (statut, created_at);

CREATE OR REPLACE FUNCTION public.annuler_commandes_perimees()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer := 0;
BEGIN
  UPDATE public.payments p SET statut = 'cancelled', updated_at = now()
   WHERE p.statut = 'pending' AND EXISTS (
     SELECT 1 FROM public.orders o WHERE o.id = p.order_id AND o.statut = 'en_attente_paiement'
       AND o.created_at < now() - interval '30 minutes'
       AND NOT EXISTS (SELECT 1 FROM public.payments x WHERE x.order_id = o.id AND x.statut IN ('approved', 'paid_held', 'released')));
  UPDATE public.orders o SET statut = 'annulee', updated_at = now()
   WHERE o.statut = 'en_attente_paiement' AND o.created_at < now() - interval '30 minutes'
     AND NOT EXISTS (SELECT 1 FROM public.payments x WHERE x.order_id = o.id AND x.statut IN ('approved', 'paid_held', 'released'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN COALESCE(n, 0);
END; $$;
REVOKE ALL ON FUNCTION public.annuler_commandes_perimees() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.annuler_commandes_perimees() TO authenticated, service_role;