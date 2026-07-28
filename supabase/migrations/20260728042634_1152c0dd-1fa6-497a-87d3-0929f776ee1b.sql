CREATE TABLE public.profils (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT '',
  photo_url text,
  bio text,
  ville text,
  competences text[] NOT NULL DEFAULT '{}',
  whatsapp text,
  telephone text,
  prix_horaire numeric,
  statut text NOT NULL DEFAULT 'prestataire',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profils TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profils TO authenticated;
GRANT ALL ON public.profils TO service_role;
ALTER TABLE public.profils ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profils visibles par tous" ON public.profils FOR SELECT USING (true);
CREATE POLICY "Chacun cree son profil" ON public.profils FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Chacun modifie son profil" ON public.profils FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Chacun supprime son profil" ON public.profils FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.produits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendeur_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre text NOT NULL,
  description text,
  categorie text NOT NULL DEFAULT 'Autre',
  prix numeric NOT NULL DEFAULT 0,
  unite text NOT NULL DEFAULT 'unité',
  stock integer NOT NULL DEFAULT 1,
  lieu text,
  livraison text,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.produits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produits TO authenticated;
GRANT ALL ON public.produits TO service_role;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produits visibles par tous" ON public.produits FOR SELECT USING (true);
CREATE POLICY "Vendeur cree ses produits" ON public.produits FOR INSERT TO authenticated WITH CHECK (auth.uid() = vendeur_id);
CREATE POLICY "Vendeur modifie ses produits" ON public.produits FOR UPDATE TO authenticated USING (auth.uid() = vendeur_id) WITH CHECK (auth.uid() = vendeur_id);
CREATE POLICY "Vendeur supprime ses produits" ON public.produits FOR DELETE TO authenticated USING (auth.uid() = vendeur_id);

CREATE OR REPLACE FUNCTION public.maj_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profils_updated_at BEFORE UPDATE ON public.profils FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();
CREATE TRIGGER produits_updated_at BEFORE UPDATE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();

CREATE OR REPLACE FUNCTION public.creer_profil_a_inscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profils (id, nom, telephone, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nom', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'telephone',
    NEW.raw_user_meta_data ->> 'whatsapp'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.creer_profil_a_inscription();