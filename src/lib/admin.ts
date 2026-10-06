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

export async function modifierStatutLitige(id: string, statut: string) {
  const { error } = await supabase.from("litiges").update({ statut }).eq("id", id);
  if (error) throw error;
}

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
