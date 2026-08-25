-- 1. Protection des données : les numéros de téléphone ne sont plus lisibles publiquement
DROP POLICY IF EXISTS "Profils visibles par tous" ON public.profils;

CREATE POLICY "Profils visibles par les membres"
ON public.profils FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.profils FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profils TO authenticated;
GRANT ALL ON public.profils TO service_role;

-- 2. Vue publique sans données de contact sensibles
CREATE OR REPLACE VIEW public.profils_publics
WITH (security_invoker = false) AS
SELECT id, nom, photo_url, bio, ville, competences, prix_horaire, statut, created_at
FROM public.profils;

GRANT SELECT ON public.profils_publics TO anon, authenticated;
GRANT ALL ON public.profils_publics TO service_role;

-- 3. Notifications en temps réel sur les nouvelles annonces
ALTER TABLE public.produits REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.produits;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;