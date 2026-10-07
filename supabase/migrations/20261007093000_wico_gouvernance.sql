-- WICO — D. Séparation admin / moderator, conflit d'intérêt, double
-- validation et journal d'audit.
--
--  · moderator : lit et traite les litiges (commande liée et messages du
--    litige) et les signalements ; il ne libère ni ne rembourse et ne
--    modifie pas les réglages.
--  · admin     : libère, rembourse, gère les rôles et les réglages.
--  · Conflit d'intérêt : appliqué côté serveur (pi-release, pi-refund,
--    traiter-litige) avec un message unique.
--  · audit_log : lecture admin, écriture serveur uniquement.

/* ------------------------------------------------------------------ */
/* 1. Journal d'audit                                                  */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.audit_log (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acteur uuid,
  action text NOT NULL,
  cible  text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  date   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_date_idx ON public.audit_log (date DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.audit_log TO authenticated;
REVOKE ALL ON public.audit_log FROM anon;
GRANT ALL ON public.audit_log TO service_role;

DROP POLICY IF EXISTS "Admin lit le journal" ON public.audit_log;
-- Aucune politique INSERT/UPDATE/DELETE : le navigateur ne peut pas écrire.
CREATE POLICY "Admin lit le journal"
  ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.ecrire_audit(
  _acteur uuid, _action text, _cible text, _detail jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (acteur, action, cible, detail)
  VALUES (_acteur, _action, _cible, COALESCE(_detail, '{}'::jsonb));
END;
$$;

REVOKE ALL ON FUNCTION public.ecrire_audit(uuid, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ecrire_audit(uuid, text, text, jsonb) TO service_role;

COMMENT ON TABLE public.audit_log IS
  'Journal d''audit : liberation, remboursement, litige traite, changement de role. Lecture admin, ecriture serveur uniquement.';

/* ------------------------------------------------------------------ */
/* 2. Double validation (seuil réglable dans reglages)                 */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.liberations_en_attente (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id    uuid NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
  premier_admin uuid NOT NULL,
  second_admin  uuid,
  montant       numeric NOT NULL,
  statut        text NOT NULL DEFAULT 'en_attente'
                CHECK (statut IN ('en_attente', 'validee', 'annulee')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.liberations_en_attente ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.liberations_en_attente FROM anon, authenticated;
GRANT ALL ON public.liberations_en_attente TO service_role;
DROP TRIGGER IF EXISTS liberations_en_attente_updated_at ON public.liberations_en_attente;
CREATE TRIGGER liberations_en_attente_updated_at
  BEFORE UPDATE ON public.liberations_en_attente
  FOR EACH ROW EXECUTE FUNCTION public.maj_updated_at();

-- Aucune politique RLS : seul le serveur (service_role) y touche.

INSERT INTO public.reglages (cle, valeur)
VALUES ('seuil_double_validation', '1'::jsonb)
ON CONFLICT (cle) DO NOTHING;

/* ------------------------------------------------------------------ */
/* 3. Message unique de conflit d'intérêt                              */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.refuser_conflit_interet(_acteur uuid, _acheteur uuid, _vendeur uuid)
RETURNS void
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF _acteur = _acheteur OR _acteur = _vendeur THEN
    RAISE EXCEPTION 'Conflit d''intérêt : un autre responsable doit traiter ce dossier.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.refuser_conflit_interet(uuid, uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refuser_conflit_interet(uuid, uuid, uuid)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.refuser_conflit_interet(uuid, uuid, uuid) IS
  'Message identique utilise par pi-release, pi-refund et traiter-litige.';

/* ------------------------------------------------------------------ */
/* 4. Lecture des litiges : admin + moderator + auteur                 */
/* ------------------------------------------------------------------ */

DROP POLICY IF EXISTS "Voir litiges" ON public.litiges;
CREATE POLICY "Voir litiges"
  ON public.litiges FOR SELECT TO authenticated
  USING (
    auth.uid() = auteur_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

-- Le traitement passe par la fonction serveur `traiter_litige`
-- (conflit d'intérêt + journal d'audit) : plus d'écriture depuis le client.
DROP POLICY IF EXISTS "Admin traite litiges" ON public.litiges;
REVOKE UPDATE ON public.litiges FROM authenticated;

/* ------------------------------------------------------------------ */
/* 5. Accès moderator : commande liée et messages du litige            */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.commande_a_litige(_order uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.litiges WHERE order_id = _order);
$$;

REVOKE EXECUTE ON FUNCTION public.commande_a_litige(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.commande_a_litige(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.parties_commande_litigiee(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE public.commande_a_litige(o.id)
      AND ((o.acheteur_id = _a AND o.vendeur_id = _b)
        OR (o.acheteur_id = _b AND o.vendeur_id = _a))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.parties_commande_litigiee(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.parties_commande_litigiee(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Parties voient commandes" ON public.orders;
CREATE POLICY "Parties voient commandes"
  ON public.orders FOR SELECT TO authenticated
  USING (
    auth.uid() IN (acheteur_id, vendeur_id)
    OR public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'moderator') AND public.commande_a_litige(id))
  );

DROP POLICY IF EXISTS "Parties voient paiements" ON public.payments;
CREATE POLICY "Parties voient paiements"
  ON public.payments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (public.has_role(auth.uid(), 'moderator') AND public.commande_a_litige(order_id))
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND auth.uid() IN (o.acheteur_id, o.vendeur_id)
    )
  );

DROP POLICY IF EXISTS "Parties lisent messages" ON public.messages;
CREATE POLICY "Parties lisent messages"
  ON public.messages FOR SELECT TO authenticated
  USING (
    auth.uid() IN (expediteur_id, destinataire_id)
    OR (public.has_role(auth.uid(), 'moderator')
        AND public.parties_commande_litigiee(expediteur_id, destinataire_id))
  );

/* ------------------------------------------------------------------ */
/* 6. Signalements : admin + moderator                                */
/* ------------------------------------------------------------------ */

DROP POLICY IF EXISTS "Admin voit signalements" ON public.signalements;
CREATE POLICY "Responsables voient signalements"
  ON public.signalements FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

DROP POLICY IF EXISTS "Admin traite signalements" ON public.signalements;
CREATE POLICY "Responsables traitent les signalements"
  ON public.signalements FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

/* ------------------------------------------------------------------ */
/* 7. Rôles : l'admin voit les rôles des autres membres               */
/* ------------------------------------------------------------------ */

DROP POLICY IF EXISTS "Chacun voit ses roles" ON public.user_roles;
CREATE POLICY "Chacun voit ses roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

/* ------------------------------------------------------------------ */
/* 8. Ouverture d'un litige : la commande passe en « litige »          */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.litiges_marquer_commande()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
     SET statut = 'litige'
   WHERE id = NEW.order_id
     AND statut IN ('payee', 'recue');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS litiges_marquer_commande ON public.litiges;
CREATE TRIGGER litiges_marquer_commande
  AFTER INSERT ON public.litiges
  FOR EACH ROW
  EXECUTE FUNCTION public.litiges_marquer_commande();

/* ------------------------------------------------------------------ */
/* 9. Traitement d'un litige (admin ou moderator, hors conflit)        */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.traiter_litige(_litige uuid, _statut text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  l public.litiges%ROWTYPE;
  o public.orders%ROWTYPE;
  trouve boolean := false;
BEGIN
  IF _statut NOT IN ('ouvert', 'resolu', 'rejete') THEN
    RAISE EXCEPTION 'Statut de litige invalide.';
  END IF;
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator')) THEN
    RAISE EXCEPTION 'Accès réservé aux administrateurs et modérateurs.';
  END IF;

  SELECT * INTO l FROM public.litiges WHERE id = _litige;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Litige introuvable.';
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = l.order_id;
  trouve := FOUND;
  IF trouve THEN
    PERFORM public.refuser_conflit_interet(auth.uid(), o.acheteur_id, o.vendeur_id);
  END IF;

  UPDATE public.litiges SET statut = _statut WHERE id = _litige;

  IF trouve THEN
    IF _statut IN ('resolu', 'rejete') AND o.statut = 'litige' THEN
      UPDATE public.orders
         SET statut = CASE WHEN recu_confirme THEN 'recue' ELSE 'payee' END
       WHERE id = o.id AND statut = 'litige';
    ELSIF _statut = 'ouvert' AND o.statut IN ('payee', 'recue') THEN
      UPDATE public.orders SET statut = 'litige' WHERE id = o.id;
    END IF;
  END IF;

  PERFORM public.ecrire_audit(
    auth.uid(), 'litige_traite', _litige,
    jsonb_build_object('statut', _statut, 'order_id', l.order_id)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.traiter_litige(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.traiter_litige(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.traiter_litige(uuid, text) IS
  'Admin ou moderator traite un litige. Conflit d''interet refuse, ecrit au journal d''audit.';
