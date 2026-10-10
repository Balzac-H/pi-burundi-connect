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

export type RemboursementARefectuer = {
  payment_id: string;
  order_id: string;
  montant: number;
  statut: string;
  titre: string;
};

/**
 * File « Remboursements à effectuer » : paiements dont l'argent reçu doit être
 * rendu manuellement dans Pi (a_rembourser = true, pas encore remboursés).
 */
export async function remboursementsARefectuer(): Promise<RemboursementARefectuer[]> {
  const { data } = await supabase
    .from("payments")
    .select("id, order_id, montant, statut")
    .eq("a_rembourser", true)
    .neq("statut", "refunded")
    .order("created_at", { ascending: false })
    .limit(100);
  const paiements =
    (data as { id: string; order_id: string; montant: number; statut: string }[] | null) ?? [];
  if (paiements.length === 0) return [];
  const { data: commandes } = await supabase
    .from("orders")
    .select("id, titre")
    .in(
      "id",
      paiements.map((p) => p.order_id),
    );
  const titres = new Map(
    ((commandes as { id: string; titre: string }[] | null) ?? []).map((c) => [c.id, c.titre]),
  );
  return paiements.map((p) => ({
    payment_id: p.id,
    order_id: p.order_id,
    montant: Number(p.montant),
    statut: p.statut,
    titre: titres.get(p.order_id) ?? "—",
  }));
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

/** Interrupteur de l'assistant virtuel : réglage public, écriture admin. */
export async function lireAssistantActif(): Promise<boolean> {
  const { data } = await supabase
    .from("reglages")
    .select("valeur")
    .eq("cle", "assistant_actif")
    .maybeSingle();
  const valeur = data?.valeur;
  return !(valeur === false || valeur === "false");
}
