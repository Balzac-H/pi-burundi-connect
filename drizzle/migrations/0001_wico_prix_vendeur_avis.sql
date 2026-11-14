ALTER TABLE public.orders ALTER COLUMN vendeur_id SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
ALTER TABLE public.orders ALTER COLUMN titre  SET DEFAULT '';
ALTER TABLE public.orders ALTER COLUMN unite  SET DEFAULT 'unité';
ALTER TABLE public.orders ALTER COLUMN montant SET DEFAULT 0;

CREATE OR REPLACE FUNCTION public.orders_calculer_commande()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.produits%ROWTYPE;
BEGIN
  IF NEW.produit_id IS NULL THEN RAISE EXCEPTION 'Commande refusée : annonce obligatoire.'; END IF;
  SELECT * INTO v FROM public.produits WHERE id = NEW.produit_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande refusée : annonce introuvable.'; END IF;
  IF v.publie IS DISTINCT FROM true THEN RAISE EXCEPTION 'Commande refusée : annonce non publiée.'; END IF;
  IF NEW.quantite IS NULL OR NEW.quantite < 1 THEN RAISE EXCEPTION 'Commande refusée : quantité invalide.'; END IF;
  IF NEW.quantite < v.quantite_min THEN RAISE EXCEPTION 'Commande refusée : quantité minimale % %.', v.quantite_min, v.unite; END IF;
  IF NEW.quantite > v.stock THEN RAISE EXCEPTION 'Commande refusée : stock insuffisant (% % disponibles).', v.stock, v.unite; END IF;
  NEW.vendeur_id := v.vendeur_id; NEW.titre := v.titre; NEW.unite := v.unite;
  NEW.montant := round(v.prix * NEW.quantite, 7);
  IF NEW.acheteur_id = NEW.vendeur_id THEN RAISE EXCEPTION 'Commande refusée : vous ne pouvez pas acheter votre propre annonce.'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS orders_calculer_commande ON public.orders;
CREATE TRIGGER orders_calculer_commande BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.orders_calculer_commande();
REVOKE EXECUTE ON FUNCTION public.orders_calculer_commande() FROM PUBLIC, anon;

ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS vendeur_actif boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.verifier_espace_vendeur(_vendeur uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.profils%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.profils WHERE id = _vendeur;
  IF NOT FOUND THEN RAISE EXCEPTION 'Publication refusée : profil introuvable.'; END IF;
  IF v.vendeur_actif IS NOT true THEN RAISE EXCEPTION 'Publication refusée : activez votre espace vendeur depuis votre profil.'; END IF;
  IF v.pi_uid IS NULL OR btrim(v.pi_uid) = '' THEN RAISE EXCEPTION 'Publication refusée : enregistrez votre identifiant Pi pour être payé.'; END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.verifier_espace_vendeur(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verifier_espace_vendeur(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.produits_verifier_publication()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.publie IS NOT TRUE OR OLD.publie IS TRUE) THEN RETURN NEW; END IF;
  PERFORM public.verifier_espace_vendeur(NEW.vendeur_id);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS produits_verifier_publication ON public.produits;
CREATE TRIGGER produits_verifier_publication BEFORE INSERT OR UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.produits_verifier_publication();

CREATE OR REPLACE FUNCTION public.jobs_verifier_publication()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN PERFORM public.verifier_espace_vendeur(NEW.employeur_id); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS jobs_verifier_publication ON public.jobs;
CREATE TRIGGER jobs_verifier_publication BEFORE INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.jobs_verifier_publication();

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS reviews_order_unique ON public.reviews (order_id);
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_auteur_diff_vendeur;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_auteur_diff_vendeur CHECK (auteur_id <> vendeur_id);

CREATE OR REPLACE FUNCTION public.reviews_verifier_commande()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.orders%ROWTYPE;
BEGIN
  IF NEW.order_id IS NULL THEN RAISE EXCEPTION 'Avis refusé : seules les commandes reçues peuvent être notées.'; END IF;
  IF NEW.note IS NULL OR NEW.note NOT BETWEEN 1 AND 5 THEN RAISE EXCEPTION 'Avis refusé : la note doit être comprise entre 1 et 5.'; END IF;
  SELECT * INTO o FROM public.orders WHERE id = NEW.order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Avis refusé : commande introuvable.'; END IF;
  IF o.acheteur_id <> NEW.auteur_id THEN RAISE EXCEPTION 'Avis refusé : vous n''êtes pas l''acheteur de cette commande.'; END IF;
  IF o.statut <> 'recue' THEN RAISE EXCEPTION 'Avis refusé : la commande doit d''abord être reçue.'; END IF;
  NEW.vendeur_id := o.vendeur_id;
  IF NEW.auteur_id = NEW.vendeur_id THEN RAISE EXCEPTION 'Avis refusé : impossible de noter sa propre vente.'; END IF;
  IF EXISTS (SELECT 1 FROM public.reviews WHERE order_id = NEW.order_id) THEN RAISE EXCEPTION 'Avis refusé : cette commande a déjà été notée.'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS reviews_verifier_commande ON public.reviews;
CREATE TRIGGER reviews_verifier_commande BEFORE INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.reviews_verifier_commande();
REVOKE EXECUTE ON FUNCTION public.reviews_verifier_commande() FROM PUBLIC, anon;

DROP POLICY IF EXISTS "Auteur cree avis" ON public.reviews;
DROP POLICY IF EXISTS "Avis apres commande recue" ON public.reviews;
CREATE POLICY "Avis apres commande recue" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auteur_id AND note BETWEEN 1 AND 5 AND order_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.acheteur_id = auth.uid() AND o.vendeur_id = reviews.vendeur_id AND o.statut = 'recue'));

CREATE OR REPLACE VIEW public.reviews_publics WITH (security_invoker = off) AS
SELECT id, auteur_id, vendeur_id, note, commentaire, created_at FROM public.reviews;
REVOKE ALL ON public.reviews FROM anon;
GRANT SELECT ON public.reviews_publics TO anon, authenticated;
GRANT ALL ON public.reviews_publics TO service_role;