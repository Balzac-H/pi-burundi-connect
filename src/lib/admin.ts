import { supabase } from "@/integrations/supabase/client";
import type { CommandeAvecPaiement } from "@/lib/commandes";
import type { LitigeDb } from "@/lib/commandes";

/**
 * Espace admin. Toutes ces lectures sont protégées côté serveur par la
 * politique RLS « admin » (fonction security definer `has_role`) et chaque
 * écriture sensible passe par une fonction serveur (pi-release, etc.).
 */

export async function listerLitiges(): Promise<LitigeDb[]> {
  const { data } = await supabase
    .from("litiges")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as LitigeDb[] | null) ?? [];
}

/** La mise à jour d'un litige passe obligatoirement par la fonction serveur
 *  `traiterLitige` (conflit d'intérêt + journal d'audit). */

/** Paiements dont les fonds sont retenus (candidats à la libération). */
export async function paiementsEnAttente(): Promise<CommandeAvecPaiement[]> {
  const { data } = await supabase
    .from("orders")
    .select("*, payments(*)")
    .eq("statut", "payee")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as CommandeAvecPaiement[] | null) ?? [];
}

/** Seuil de double validation (π) : réglage public, écriture admin. */
export async function lireSeuilDoubleValidation(): Promise<number> {
  const { data } = await supabase
    .from("reglages")
    .select("valeur")
    .eq("cle", "seuil_double_validation")
    .maybeSingle();
  return Number((data?.valeur as number | null) ?? 0);
}
