ALTER TABLE public.profils
  ADD COLUMN IF NOT EXISTS type_compte text NOT NULL DEFAULT 'chercheur',
  ADD COLUMN IF NOT EXISTS theme text;
ALTER TABLE public.profils ADD CONSTRAINT profils_type_compte_chk CHECK (type_compte IN ('vendeur','employeur','chercheur'));
ALTER TABLE public.profils ADD CONSTRAINT profils_theme_chk CHECK (theme IS NULL OR theme IN ('clair','sombre','auto'));
GRANT SELECT (type_compte) ON public.profils TO anon;

CREATE OR REPLACE VIEW public.profils_publics WITH (security_invoker = on) AS
  SELECT id, nom, photo_url, bio, ville, competences, prix_horaire, statut, created_at, type_compte FROM public.profils;
GRANT SELECT ON public.profils_publics TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.creer_profil_a_inscription()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profils (id, nom, telephone, whatsapp, type_compte)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'telephone',
    NEW.raw_user_meta_data ->> 'whatsapp',
    CASE WHEN NEW.raw_user_meta_data ->> 'type_compte' IN ('vendeur','employeur','chercheur')
         THEN NEW.raw_user_meta_data ->> 'type_compte' ELSE 'chercheur' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- Vérifié = email ou téléphone confirmé
CREATE OR REPLACE FUNCTION public.utilisateurs_verifies(_ids uuid[])
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE id = ANY(_ids) AND (email_confirmed_at IS NOT NULL OR phone_confirmed_at IS NOT NULL)
$$;
GRANT EXECUTE ON FUNCTION public.utilisateurs_verifies(uuid[]) TO anon, authenticated;

-- Offres d'emploi
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employeur_id uuid NOT NULL,
  titre text NOT NULL,
  description text NOT NULL DEFAULT '',
  categorie text NOT NULL DEFAULT 'Autre',
  localisation text NOT NULL DEFAULT '',
  salaire numeric,
  duree text,
  urgent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs visibles par tous" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Employeur cree ses jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = employeur_id);
CREATE POLICY "Employeur modifie ses jobs" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = employeur_id) WITH CHECK (auth.uid() = employeur_id);
CREATE POLICY "Employeur supprime ses jobs" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = employeur_id);
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- Rôles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chacun voit ses roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Signalements
CREATE TABLE public.signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id uuid NOT NULL,
  utilisateur_signale_id uuid NOT NULL,
  cible_type text NOT NULL CHECK (cible_type IN ('profil','produit','job')),
  cible_id uuid NOT NULL,
  raison text NOT NULL CHECK (raison IN ('arnaque','faux_produit','comportement_abusif','autre')),
  details text CHECK (details IS NULL OR char_length(details) <= 500),
  statut text NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert','traite')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.signalements TO authenticated;
GRANT SELECT, UPDATE ON public.signalements TO authenticated;
GRANT ALL ON public.signalements TO service_role;
ALTER TABLE public.signalements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membre signale" ON public.signalements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auteur_id AND auteur_id <> utilisateur_signale_id);
CREATE POLICY "Admin voit signalements" ON public.signalements FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin traite signalements" ON public.signalements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE UNIQUE INDEX signalements_unique ON public.signalements (auteur_id, cible_type, cible_id);