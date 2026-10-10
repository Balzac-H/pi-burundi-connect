-- Arija Connect — Stock atomique et réservé.
--
--  · decrementer_stock(_produit, _qte) : décrément ATOMIQUE conditionnel
--    (UPDATE ... WHERE stock >= _qte). Renvoie true si le stock a été
--    décrémenté, false sinon. Remplace la lecture-puis-écriture du paiement.
--  · order_items_calculer_ligne compte désormais comme indisponible la
--    quantité réservée par les AUTRES commandes encore en attente de paiement
--    depuis moins de 30 minutes : stock disponible = stock - réservations.
--
-- Aucune migration existante n'est modifiée.

/* ------------------------------------------------------------------ */
/* 1. Décrément atomique du stock                                      */
/* ------------------------------------------------------------------ */

CREATE OR REPLACE FUNCTION public.decrementer_stock(_produit uuid, _qte integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _maj integer;
BEGIN
  IF _produit IS NULL THEN
    RAISE EXCEPTION 'Produit obligatoire.';
  END IF;
  IF _qte IS NULL OR _qte < 1 THEN
    RAISE EXCEPTION 'Quantité invalide.';
  END IF;

  -- Une seule instruction : pas de course possible entre la vérification
  -- du stock et la décrémentation.
  UPDATE public.produits
     SET stock = stock - _qte
   WHERE id = _produit
     AND stock >= _qte;
  GET DIAGNOSTICS _maj = ROW_COUNT;

  RETURN _maj = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.decrementer_stock(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrementer_stock(uuid, integer) TO service_role;

COMMENT ON FUNCTION public.decrementer_stock(uuid, integer) IS
  'Decremente produits.stock de facon atomique si et seulement si stock >= _qte. Renvoie true (decrémenté) ou false (insuffisant).';

/* ------------------------------------------------------------------ */
/* 2. Réservation : les commandes en attente bloquent le stock         */
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
  reserve integer;
  disponible integer;
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

  -- Réservations des AUTRES commandes en attente de paiement de moins de
  -- 30 minutes : ce stock est déjà promis, on le retire du disponible.
  SELECT COALESCE(SUM(oi.quantite), 0) INTO reserve
    FROM public.order_items oi
    JOIN public.orders cmd ON cmd.id = oi.order_id
   WHERE oi.produit_id = NEW.produit_id
     AND cmd.id <> NEW.order_id
     AND cmd.statut = 'en_attente_paiement'
     AND cmd.created_at > now() - interval '30 minutes';

  disponible := GREATEST(v.stock - reserve, 0);
  IF deja + NEW.quantite > disponible THEN
    RAISE EXCEPTION 'Ligne refusée : stock insuffisant (% % disponibles).', disponible, v.unite;
  END IF;

  -- Écrasements : la base, jamais le navigateur.
  NEW.titre         := v.titre;
  NEW.unite         := v.unite;
  NEW.prix_unitaire := v.prix;
  NEW.montant       := round(v.prix * NEW.quantite, 7);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.order_items_calculer_ligne() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.order_items_calculer_ligne() TO authenticated, service_role;

COMMENT ON TRIGGER order_items_calculer_ligne ON public.order_items IS
  'Recalcule titre, unite, prix_unitaire et montant = prix x quantite (7 decimales) depuis public.produits. Refuse annonce absente/non publiee, quantite minimale, stock insuffisant (reservations des commandes en_attente_paiement de moins de 30 minutes deduites), auto-achat et vendeur different.';
