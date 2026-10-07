-- WICO — B. Un seul compte, deux usages : tout membre connecté avec Pi peut
-- vendre. Pas de second compte et pas de rôle « vendeur » dans user_roles
-- (qui ne contient que admin, moderator, user).
--
-- La condition de publication est vérifiée CÔTÉ BASE (déclencheurs), pas
-- seulement dans l'interface : vendeur_actif = true ET pi_uid enregistré
-- (le pi_uid sert à payer le vendeur).

/* ------------------------------------------------------------------ */
/* 1. Colonne d'activation                                             */
/* ------------------------------------------------------------------ */

ALTER TABLE public.profils
  ADD COLUMN IF NOT EXISTS vendeur_actif boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profils.vendeur_actif IS
  'Espace vendeur active par le membre. Publier une annonce exige vendeur_actif = true ET un pi_uid.';

/* ------------------------------------------------------------------ */
/* 2. Contrôle commun (produits + jobs)                                */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.verifier_espace_vendeur(_vendeur uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.profils%ROWTYPE;
BEGIN
  SELECT * INTO v FROM public.profils WHERE id = _vendeur;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Publication refusée : profil introuvable.';
  END IF;
  IF v.vendeur_actif IS NOT true THEN
    RAISE EXCEPTION 'Publication refusée : activez votre espace vendeur depuis votre profil.';
  END IF;
  IF v.pi_uid IS NULL OR btrim(v.pi_uid) = '' THEN
    RAISE EXCEPTION 'Publication refusée : enregistrez votre identifiant Pi pour être payé.';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verifier_espace_vendeur(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verifier_espace_vendeur(uuid) TO authenticated, service_role;

/* ------------------------------------------------------------------ */
/* 3. Annonces (market.vendre) : contrôle à la publication             */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.produits_verifier_publication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- UPDATE : on ne contrôle que la (ré)publication d'une annonce masquée.
  IF TG_OP = 'UPDATE' AND (NEW.publie IS NOT TRUE OR OLD.publie IS TRUE) THEN
    RETURN NEW;
  END IF;
  PERFORM public.verifier_espace_vendeur(NEW.vendeur_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS produits_verifier_publication ON public.produits;
CREATE TRIGGER produits_verifier_publication
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.produits_verifier_publication();

/* ------------------------------------------------------------------ */
/* 4. Offres d'emploi (jobs.creer) : toujours à la création             */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.jobs_verifier_publication()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.verifier_espace_vendeur(NEW.employeur_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_verifier_publication ON public.jobs;
CREATE TRIGGER jobs_verifier_publication
  BEFORE INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.jobs_verifier_publication();
