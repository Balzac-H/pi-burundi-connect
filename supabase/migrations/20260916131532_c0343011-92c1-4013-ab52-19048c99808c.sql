-- Les visiteurs anonymes ne lisent plus la table profils (qui contient whatsapp/telephone)
DROP POLICY IF EXISTS "Profils publics sans coordonnees" ON public.profils;
REVOKE ALL ON public.profils FROM anon;

-- La vue publique (sans coordonnees) devient la seule porte d'entree anonyme
ALTER VIEW public.profils_publics SET (security_invoker = off);
REVOKE ALL ON public.profils_publics FROM anon;
GRANT SELECT ON public.profils_publics TO anon;
GRANT SELECT ON public.profils_publics TO authenticated;