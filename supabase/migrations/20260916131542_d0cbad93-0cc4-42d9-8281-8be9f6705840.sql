-- Revenir a une vue security_invoker et securiser par des droits au niveau colonne
ALTER VIEW public.profils_publics SET (security_invoker = on);

GRANT SELECT (id, nom, photo_url, bio, ville, competences, prix_horaire, statut, created_at)
  ON public.profils TO anon;

CREATE POLICY "Profils publics sans coordonnees"
  ON public.profils FOR SELECT TO anon USING (true);