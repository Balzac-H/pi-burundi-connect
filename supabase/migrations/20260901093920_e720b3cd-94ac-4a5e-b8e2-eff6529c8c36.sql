-- Vue publique en mode invoker (respecte le RLS de l'appelant)
CREATE OR REPLACE VIEW public.profils_publics
WITH (security_invoker = on) AS
SELECT id, nom, photo_url, bio, ville, competences, prix_horaire, statut, created_at
FROM public.profils;

-- Les visiteurs non connectés peuvent lire les profils, mais UNIQUEMENT
-- les colonnes non sensibles (aucun accès aux colonnes telephone/whatsapp)
CREATE POLICY "Profils publics sans coordonnees"
ON public.profils FOR SELECT
TO anon
USING (true);

GRANT SELECT (id, nom, photo_url, bio, ville, competences, prix_horaire, statut, created_at)
ON public.profils TO anon;

GRANT SELECT ON public.profils_publics TO anon, authenticated;