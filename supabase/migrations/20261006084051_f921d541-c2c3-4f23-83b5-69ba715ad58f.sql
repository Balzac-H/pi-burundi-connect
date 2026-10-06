ALTER TABLE public.profils ADD COLUMN IF NOT EXISTS pi_uid text UNIQUE, ADD COLUMN IF NOT EXISTS pi_username text;
ALTER TABLE public.produits ADD COLUMN IF NOT EXISTS quantite_min integer NOT NULL DEFAULT 1, ADD COLUMN IF NOT EXISTS publie boolean NOT NULL DEFAULT true;

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acheteur_id uuid NOT NULL,
  vendeur_id uuid NOT NULL,
  produit_id uuid REFERENCES public.produits(id) ON DELETE SET NULL,
  titre text NOT NULL,
  quantite integer NOT NULL,
  unite text NOT NULL DEFAULT 'unité',
  montant numeric NOT NULL,
  statut text NOT NULL DEFAULT 'en_attente_paiement',
  recu_confirme boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties voient commandes" ON public.orders FOR SELECT TO authenticated USING (auth.uid() IN (acheteur_id, vendeur_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Acheteur cree commande" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = acheteur_id AND statut = 'en_attente_paiement' AND acheteur_id <> vendeur_id);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pi_payment_id text UNIQUE NOT NULL,
  montant numeric NOT NULL,
  txid text,
  statut text NOT NULL DEFAULT 'pending',
  commission numeric,
  facture jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties voient paiements" ON public.payments FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND auth.uid() IN (o.acheteur_id, o.vendeur_id)));
CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id uuid NOT NULL, vendeur_id uuid NOT NULL,
  note integer NOT NULL, commentaire text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Avis publics" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Auteur cree avis" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = auteur_id AND auteur_id <> vendeur_id AND note BETWEEN 1 AND 5);
CREATE POLICY "Auteur supprime avis" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = auteur_id);

CREATE TABLE public.follows (
  suiveur_id uuid NOT NULL, suivi_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (suiveur_id, suivi_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows publics" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Suivre" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = suiveur_id AND suiveur_id <> suivi_id);
CREATE POLICY "Ne plus suivre" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = suiveur_id);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expediteur_id uuid NOT NULL, destinataire_id uuid NOT NULL,
  contenu text NOT NULL, lu boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties lisent messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() IN (expediteur_id, destinataire_id));
CREATE POLICY "Envoyer message" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = expediteur_id);
CREATE POLICY "Marquer lu" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = destinataire_id) WITH CHECK (auth.uid() = destinataire_id);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, titre text NOT NULL, contenu text, lien text,
  lu boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Mes notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Lire notif" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supprimer notif" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.litiges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  auteur_id uuid NOT NULL, description text NOT NULL,
  statut text NOT NULL DEFAULT 'ouvert',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.litiges TO authenticated;
GRANT ALL ON public.litiges TO service_role;
ALTER TABLE public.litiges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir litiges" ON public.litiges FOR SELECT TO authenticated USING (auth.uid() = auteur_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Ouvrir litige" ON public.litiges FOR INSERT TO authenticated WITH CHECK (auth.uid() = auteur_id AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.acheteur_id = auth.uid()));
CREATE POLICY "Admin traite litiges" ON public.litiges FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.reglages (
  cle text PRIMARY KEY, valeur jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reglages TO anon, authenticated;
GRANT INSERT, UPDATE ON public.reglages TO authenticated;
GRANT ALL ON public.reglages TO service_role;
ALTER TABLE public.reglages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reglages publics" ON public.reglages FOR SELECT USING (true);
CREATE POLICY "Admin cree reglages" ON public.reglages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin modifie reglages" ON public.reglages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER reglages_updated_at BEFORE UPDATE ON public.reglages FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();
INSERT INTO public.reglages (cle, valeur) VALUES ('taux_fbu', '{"actif": false, "taux": null}');

-- Acheteur confirme réception (seule colonne modifiable)
CREATE OR REPLACE FUNCTION public.confirmer_reception(_order uuid) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.orders SET recu_confirme = true, statut = 'recue'
  WHERE id = _order AND acheteur_id = auth.uid() AND statut = 'payee';
$$;
REVOKE EXECUTE ON FUNCTION public.confirmer_reception(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.confirmer_reception(uuid) TO authenticated;