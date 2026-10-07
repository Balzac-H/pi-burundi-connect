-- WICO — C. Les avis ne sont plus « un auteur crée un avis » : ils sont
-- obligatoirement liés à une commande reçue.
--
--  * reviews.order_id (unique) : une seule note par commande ;
--  * contrainte auteur_id <> vendeur_id ;
--  * la politique « Auteur cree avis » est remplacée ;
--  * un déclencheur refuse tout avis sans commande 'recue' de l'auteur
--    auprès du vendeur noté.

/* ------------------------------------------------------------------ */
/* 1. Lien vers la commande                                            */
/* ------------------------------------------------------------------ */

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE;

DROP INDEX IF EXISTS reviews_order_unique;
CREATE UNIQUE INDEX reviews_order_unique ON public.reviews (order_id);

ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_auteur_diff_vendeur;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_auteur_diff_vendeur
  CHECK (auteur_id <> vendeur_id);

COMMENT ON COLUMN public.reviews.order_id IS
  'Commande notee (unique) : un avis n''est possible que si l''auteur a une commande avec ce vendeur au statut recue.';

/* ------------------------------------------------------------------ */
/* 2. Déclencheur : la base valide l'achat                             */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.reviews_verifier_commande()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o public.orders%ROWTYPE;
BEGIN
  IF NEW.order_id IS NULL THEN
    RAISE EXCEPTION 'Avis refusé : seules les commandes reçues peuvent être notées.';
  END IF;
  IF NEW.note IS NULL OR NEW.note NOT BETWEEN 1 AND 5 THEN
    RAISE EXCEPTION 'Avis refusé : la note doit être comprise entre 1 et 5.';
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = NEW.order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Avis refusé : commande introuvable.';
  END IF;
  IF o.acheteur_id <> NEW.auteur_id THEN
    RAISE EXCEPTION 'Avis refusé : vous n''êtes pas l''acheteur de cette commande.';
  END IF;
  IF o.statut <> 'recue' THEN
    RAISE EXCEPTION 'Avis refusé : la commande doit d''abord être reçue.';
  END IF;

  -- Le vendeur est repris de la commande : jamais fourni par le navigateur.
  NEW.vendeur_id := o.vendeur_id;
  IF NEW.auteur_id = NEW.vendeur_id THEN
    RAISE EXCEPTION 'Avis refusé : impossible de noter sa propre vente.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews WHERE order_id = NEW.order_id) THEN
    RAISE EXCEPTION 'Avis refusé : cette commande a déjà été notée.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_verifier_commande ON public.reviews;
CREATE TRIGGER reviews_verifier_commande
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.reviews_verifier_commande();

REVOKE EXECUTE ON FUNCTION public.reviews_verifier_commande() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reviews_verifier_commande() TO authenticated, service_role;

/* ------------------------------------------------------------------ */
/* 3. Politique remplacée                                              */
/* ------------------------------------------------------------------ */

DROP POLICY IF EXISTS "Auteur cree avis" ON public.reviews;

CREATE POLICY "Avis apres commande recue"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = auteur_id
    AND note BETWEEN 1 AND 5
    AND order_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.acheteur_id = auth.uid()
        AND o.vendeur_id = reviews.vendeur_id
        AND o.statut = 'recue'
    )
  );

/* ------------------------------------------------------------------ */
/* 4. order_id n'apparaît pas dans la lecture anonyme                  */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE VIEW public.reviews_publics
WITH (security_invoker = off) AS
SELECT id, auteur_id, vendeur_id, note, commentaire, created_at
FROM public.reviews;

REVOKE ALL ON public.reviews FROM anon;
GRANT SELECT ON public.reviews_publics TO anon;
GRANT ALL ON public.reviews_publics TO service_role;

COMMENT ON VIEW public.reviews_publics IS
  'Avis visibles publiquement, sans order_id (identifiant de commande).';
