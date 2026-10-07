-- WICO — A. Le prix, le vendeur et l'intitulé d'une commande viennent TOUJOURS
-- de la table `produits`, jamais du navigateur.
--
-- Aucune migration existante n'est modifiée : on ajoute des colonnes par défaut
-- (toujours écrasées), un déclencheur BEFORE INSERT et des index.

/* ------------------------------------------------------------------ */
/* 1. Colonnes dérivées : le client ne les envoie plus.                */
/*    Les valeurs par défaut ne sont JAMAIS conservées : le déclencheur */
/*    les réécrit intégralement.                                       */
/* ------------------------------------------------------------------ */

ALTER TABLE public.orders ALTER COLUMN vendeur_id
  SET DEFAULT '00000000-0000-0000-0000-000000000000'::uuid;
ALTER TABLE public.orders ALTER COLUMN titre  SET DEFAULT '';
ALTER TABLE public.orders ALTER COLUMN unite  SET DEFAULT 'unité';
ALTER TABLE public.orders ALTER COLUMN montant SET DEFAULT 0;

-- produit_id devient obligatoire pour toute NOUVELLE commande.
-- (on ne verrouille la colonne que si l'historique ne contient aucune ligne
--  sans produit ; sinon le déclencheur refuse de toute façon l'insertion.)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE produit_id IS NULL) THEN
    ALTER TABLE public.orders ALTER COLUMN produit_id SET NOT NULL;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'orders.produit_id laissé nullable : %', SQLERRM;
END $$;

/* ------------------------------------------------------------------ */
/* 2. Le déclencheur : source unique de vérité                         */
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
  IF NEW.produit_id IS NULL THEN
    RAISE EXCEPTION 'Commande refusée : annonce obligatoire.';
  END IF;

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

  -- Écrasements : la base, jamais le navigateur.
  NEW.vendeur_id := v.vendeur_id;
  NEW.titre      := v.titre;
  NEW.unite      := v.unite;
  NEW.montant    := round(v.prix * NEW.quantite, 7);

  -- Auto-achat interdit (règle reprise du panier côté interface).
  IF NEW.acheteur_id = NEW.vendeur_id THEN
    RAISE EXCEPTION 'Commande refusée : vous ne pouvez pas acheter votre propre annonce.';
  END IF;

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
  'Recalcule vendeur_id, titre, unite et montant = prix x quantite (7 decimales) depuis public.produits. Refuse produit absent/non publie, quantite hors bornes et auto-achat.';
