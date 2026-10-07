-- WICO — G. Un paiement Pi PAR VENDEUR (et non par produit).
--
--  * nouvelle table `public.order_items` : les lignes d'une commande ;
--  * `public.orders` devient une commande par vendeur, `montant` = somme des
--    lignes, recalculée par la base ;
--  * le déclencheur `order_items_calculer_ligne` applique AUX LIGNES les
--    mêmes règles que `orders_calculer_commande` aux commandes : prix, titre,
--    unité et montant viennent TOUJOURS de `produits`, jamais du navigateur ;
--  * la RPC `creer_commandes(jsonb)` est le seul point d'entrée du navigateur :
--    elle regroupe le panier par vendeur et crée une commande par vendeur ;
--  * les anciennes commandes à un seul produit (sans ligne) restent lisibles.
--
-- Aucune migration existante n'est modifiée.

/* ------------------------------------------------------------------ */
/* 1. `produit_id` redevient nullable : une commande multi-vendeurs n'a */
/*    pas de produit unique. Les anciennes lignes conservent la leur.   */
/* ------------------------------------------------------------------ */

ALTER TABLE public.orders ALTER COLUMN produit_id DROP NOT NULL;

COMMENT ON COLUMN public.orders.produit_id IS
  'Produit unique des anciennes commandes a un seul article. NULL pour les commandes crees par creer_commandes() : voir public.order_items.';

/* ------------------------------------------------------------------ */
/* 2. Les lignes de commande                                           */
/* ------------------------------------------------------------------ */

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  produit_id uuid REFERENCES public.produits(id) ON DELETE SET NULL,
  titre text NOT NULL,
  unite text NOT NULL DEFAULT 'unité',
  quantite integer NOT NULL,
  prix_unitaire numeric NOT NULL,
  montant numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;

DROP POLICY IF EXISTS "Parties voient lignes" ON public.order_items;
CREATE POLICY "Parties voient lignes"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
       WHERE o.id = order_id
         AND auth.uid() IN (o.acheteur_id, o.vendeur_id)
    )
  );

-- Le navigateur n'insère JAMAIS de ligne : la base le fait (trigger + RPC).
REVOKE INSERT, UPDATE, DELETE ON public.order_items FROM authenticated, anon;

CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items (order_id, created_at);
CREATE INDEX IF NOT EXISTS order_items_produit_idx ON public.order_items (produit_id);

COMMENT ON TABLE public.order_items IS
  'Lignes d une commande. prix_unitaire, montant, titre et unite sont ecrits par le declencheur order_items_calculer_ligne depuis public.produits.';

/* ------------------------------------------------------------------ */
/* 3. Meme securite que pour les prix, applicable a chaque ligne        */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.order_items_calculer_ligne()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.produits%ROWTYPE;
  o public.orders%ROWTYPE;
  deja integer;
BEGIN
  IF NEW.produit_id IS NULL THEN
    RAISE EXCEPTION 'Ligne refusée : annonce obligatoire.';
  END IF;
  IF NEW.quantite IS NULL OR NEW.quantite < 1 THEN
    RAISE EXCEPTION 'Ligne refusée : quantité invalide.';
  END IF;

  SELECT * INTO v FROM public.produits WHERE id = NEW.produit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ligne refusée : annonce introuvable.';
  END IF;
  IF v.publie IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Ligne refusée : annonce non publiée.';
  END IF;
  IF NEW.quantite < v.quantite_min THEN
    RAISE EXCEPTION 'Ligne refusée : quantité minimale % %.', v.quantite_min, v.unite;
  END IF;

  SELECT * INTO o FROM public.orders WHERE id = NEW.order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ligne refusée : commande introuvable.';
  END IF;
  IF o.acheteur_id = v.vendeur_id THEN
    RAISE EXCEPTION 'Ligne refusée : vous ne pouvez pas acheter votre propre annonce.';
  END IF;
  IF o.vendeur_id IS DISTINCT FROM v.vendeur_id THEN
    RAISE EXCEPTION 'Ligne refusée : une commande ne concerne qu un seul vendeur.';
  END IF;

  -- Stock tenu compte des lignes déjà présentes sur CETTE commande
  -- (un même produit peut être ajouté deux fois).
  SELECT COALESCE(SUM(quantite), 0) INTO deja
    FROM public.order_items
   WHERE order_id = NEW.order_id
     AND produit_id = NEW.produit_id;
  IF deja + NEW.quantite > v.stock THEN
    RAISE EXCEPTION 'Ligne refusée : stock insuffisant (% % disponibles).', v.stock, v.unite;
  END IF;

  -- Écrasements : la base, jamais le navigateur.
  NEW.titre         := v.titre;
  NEW.unite         := v.unite;
  NEW.prix_unitaire := v.prix;
  NEW.montant       := round(v.prix * NEW.quantite, 7);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS order_items_calculer_ligne ON public.order_items;
CREATE TRIGGER order_items_calculer_ligne
  BEFORE INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.order_items_calculer_ligne();

REVOKE EXECUTE ON FUNCTION public.order_items_calculer_ligne() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_items_calculer_ligne() TO authenticated, service_role;

COMMENT ON TRIGGER order_items_calculer_ligne ON public.order_items IS
  'Recalcule titre, unite, prix_unitaire et montant = prix x quantite (7 decimales) depuis public.produits. Refuse annonce absente/non publiee, quantite minimale, stock insuffisant, auto-achat et vendeur different.';

/* ------------------------------------------------------------------ */
/* 4. montant de la commande = SOMME DES LIGNES                        */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.order_items_recalculer_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order uuid;
  _n integer;
  _q integer;
  _m numeric;
  _ref public.order_items%ROWTYPE;
  _titre text;
  _unite text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _order := OLD.order_id;
  ELSE
    _order := NEW.order_id;
  END IF;

  SELECT COUNT(*), COALESCE(SUM(quantite), 0), COALESCE(SUM(montant), 0)
    INTO _n, _q, _m
    FROM public.order_items
   WHERE order_id = _order;

  -- Commande ancienne (aucune ligne) : on ne touche à rien.
  IF _n = 0 THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  SELECT * INTO _ref
    FROM public.order_items
   WHERE order_id = _order
   ORDER BY created_at, id
   LIMIT 1;

  IF _n = 1 THEN
    _titre := _ref.titre;
    _unite := _ref.unite;
  ELSE
    _titre := _ref.titre || ' (+' || (_n - 1) || ' article' ||
              CASE WHEN _n - 1 > 1 THEN 's' ELSE '' END || ')';
    _unite := 'articles';
  END IF;

  UPDATE public.orders
     SET montant  = round(_m, 7),
         quantite = _q,
         titre    = _titre,
         unite    = _unite
   WHERE id = _order;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS order_items_recalculer_order ON public.order_items;
CREATE TRIGGER order_items_recalculer_order
  AFTER INSERT OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.order_items_recalculer_order();

REVOKE EXECUTE ON FUNCTION public.order_items_recalculer_order() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_items_recalculer_order() TO authenticated, service_role;

COMMENT ON FUNCTION public.order_items_recalculer_order() IS
  'Fixe orders.montant = SUM(order_items.montant), orders.quantite = SUM(quantite) et l intitule agrege.';

/* ------------------------------------------------------------------ */
/* 5. Le declencheur des commandes accepte deux chemins                 */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.orders_calculer_commande()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v public.produits%ROWTYPE;
BEGIN
  /* --- Chemin A : ancienne commande a un seul produit (compatibilité) --- */
  IF NEW.produit_id IS NOT NULL THEN
    SELECT * INTO v FROM public.produits WHERE id = NEW.produit_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Commande refusée : annonce introuvable.';
    END IF;
    IF v.publie IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Commande refusée : annonce non publiée.';
    END IF;
    IF NEW.quantite IS NULL OR NEW.quantite < 1 THEN
      RAISE EXCEPTION 'Commande refusée : quantité invalide.';
    END IF;
    IF NEW.quantite < v.quantite_min THEN
      RAISE EXCEPTION 'Commande refusée : quantité minimale % %.', v.quantite_min, v.unite;
    END IF;
    IF NEW.quantite > v.stock THEN
      RAISE EXCEPTION 'Commande refusée : stock insuffisant (% % disponibles).', v.stock, v.unite;
    END IF;

    NEW.vendeur_id := v.vendeur_id;
    NEW.titre      := v.titre;
    NEW.unite      := v.unite;
    NEW.montant    := round(v.prix * NEW.quantite, 7);

    IF NEW.acheteur_id = NEW.vendeur_id THEN
      RAISE EXCEPTION 'Commande refusée : vous ne pouvez pas acheter votre propre annonce.';
    END IF;

    RETURN NEW;
  END IF;

  /* --- Chemin B : commande multi-lignes, créée par creer_commandes() --- */
  IF current_setting('wico.commande_multi', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Commande refusée : passez par la fonction creer_commandes().';
  END IF;

  IF NEW.acheteur_id IS NULL THEN
    RAISE EXCEPTION 'Commande refusée : acheteur obligatoire.';
  END IF;
  IF NEW.vendeur_id IS NULL OR NEW.vendeur_id = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RAISE EXCEPTION 'Commande refusée : vendeur obligatoire.';
  END IF;
  IF NEW.acheteur_id = NEW.vendeur_id THEN
    RAISE EXCEPTION 'Commande refusée : vous ne pouvez pas acheter votre propre annonce.';
  END IF;
  IF NEW.statut IS DISTINCT FROM 'en_attente_paiement' THEN
    RAISE EXCEPTION 'Commande refusée : statut initial invalide.';
  END IF;

  -- Valeurs provisoires : les lignes (déclencheurs) écrivent le montant réel.
  NEW.titre   := '';
  NEW.unite   := 'articles';
  NEW.quantite := 0;
  NEW.montant  := 0;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_calculer_commande ON public.orders;
CREATE TRIGGER orders_calculer_commande
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_calculer_commande();

REVOKE EXECUTE ON FUNCTION public.orders_calculer_commande() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.orders_calculer_commande() TO authenticated, service_role;

COMMENT ON TRIGGER orders_calculer_commande ON public.orders IS
  'Chemin A : montant = prix x quantite depuis public.produits (commande a un produit). Chemin B : accepte uniquement les commandes multi-lignes crees par creer_commandes(), montant ensuite fixe par order_items_recalculer_order.';

/* ------------------------------------------------------------------ */
/* 6. Miroir : toute commande creee directement avec un produit recoit  */
/*    automatiquement sa ligne, pour que la lecture soit uniforme.       */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.orders_creer_ligne_unique()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.produit_id IS NULL THEN
    RETURN NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM public.order_items WHERE order_id = NEW.id) THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.order_items (order_id, produit_id, quantite)
  VALUES (NEW.id, NEW.produit_id, NEW.quantite);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS orders_creer_ligne_unique ON public.orders;
CREATE TRIGGER orders_creer_ligne_unique
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_creer_ligne_unique();

REVOKE EXECUTE ON FUNCTION public.orders_creer_ligne_unique() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.orders_creer_ligne_unique() TO authenticated, service_role;

/* ------------------------------------------------------------------ */
/* 7. La seule porte d'entrée du navigateur : une commande par vendeur  */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.creer_commandes(_lignes jsonb)
RETURNS SETOF public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _acheteur uuid := auth.uid();
  _vendeurs uuid[] := '{}';
  _vidx integer;
  _v uuid;
  _n integer := 0;
  _rec jsonb;
  _pid uuid;
  _q integer;
  _p public.produits%ROWTYPE;
  _compte integer;
  _id uuid;
  _order public.orders;
BEGIN
  IF _acheteur IS NULL THEN
    RAISE EXCEPTION 'Connexion requise.';
  END IF;
  IF _lignes IS NULL OR jsonb_typeof(_lignes) <> 'array' THEN
    RAISE EXCEPTION 'Panier invalide.';
  END IF;
  _compte := jsonb_array_length(_lignes);
  IF _compte = 0 THEN
    RAISE EXCEPTION 'Panier vide.';
  END IF;
  IF _compte > 50 THEN
    RAISE EXCEPTION 'Trop d articles dans le panier.';
  END IF;

  -- Autorise le déclencheur `orders_calculer_commande` (chemin B) pour la
  -- durée de la transaction uniquement.
  PERFORM set_config('wico.commande_multi', 'on', true);

  FOR _rec IN SELECT elem FROM jsonb_array_elements(_lignes) AS t(elem) LOOP
    BEGIN
      _pid := (_rec ->> 'produit_id')::uuid;
      _q := (_rec ->> 'quantite')::integer;
    EXCEPTION WHEN others THEN
      RAISE EXCEPTION 'Panier invalide : article mal formé.';
    END;

    IF _pid IS NULL OR _q IS NULL OR _q < 1 THEN
      RAISE EXCEPTION 'Panier invalide : article ou quantité manquant.';
    END IF;

    SELECT * INTO _p FROM public.produits WHERE id = _pid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Annonce introuvable.';
    END IF;
    IF _p.publie IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Annonce retirée du marché : %.', _p.titre;
    END IF;
    IF _p.vendeur_id = _acheteur THEN
      RAISE EXCEPTION 'Vente impossible : c est votre annonce.';
    END IF;

    _vidx := array_position(_vendeurs, _p.vendeur_id);
    IF _vidx IS NULL THEN
      _vendeurs := _vendeurs || _p.vendeur_id;
    END IF;

    _n := _n + 1;
    IF _n > 200 THEN
      RAISE EXCEPTION 'Trop d articles dans le panier.';
    END IF;
  END LOOP;

  -- Une commande PAR VENDEUR (les lignes fusionnent les doublons).
  FOREACH _v IN ARRAY _vendeurs LOOP
    INSERT INTO public.orders (acheteur_id, vendeur_id, titre, unite, quantite, montant, statut)
    VALUES (_acheteur, _v, '', 'articles', 0, 0, 'en_attente_paiement')
    RETURNING id INTO _id;

    INSERT INTO public.order_items (order_id, produit_id, quantite)
    SELECT _id,
           (elem ->> 'produit_id')::uuid,
           SUM((elem ->> 'quantite')::integer)::integer
      FROM jsonb_array_elements(_lignes) AS t(elem)
      JOIN public.produits p ON p.id = (elem ->> 'produit_id')::uuid
     WHERE p.vendeur_id = _v
     GROUP BY 2;

    SELECT * INTO _order FROM public.orders WHERE id = _id;
    IF _order.montant IS NULL OR _order.montant <= 0 THEN
      RAISE EXCEPTION 'Commande refusée : montant invalide.';
    END IF;
    RETURN NEXT _order;
  END LOOP;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.creer_commandes(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.creer_commandes(jsonb) TO authenticated, service_role;

COMMENT ON FUNCTION public.creer_commandes(jsonb) IS
  'Cree une commande par vendeur a partir du panier [{"produit_id": uuid, "quantite": n}]. Valide publication, quantite minimale, stock, auto-achat et vendeur unique par commande. Le montant est calcule par order_items_calculer_ligne puis order_items_recalculer_order.';
