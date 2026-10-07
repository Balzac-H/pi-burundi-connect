import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type StatutCommande =
  "en_attente_paiement" | "payee" | "recue" | "annulee" | "remboursee" | "litige";

export type CommandeDb = {
  id: string;
  acheteur_id: string;
  vendeur_id: string;
  produit_id: string | null;
  titre: string;
  quantite: number;
  unite: string;
  montant: number;
  statut: StatutCommande;
  recu_confirme: boolean;
  livre_declare_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaiementDb = {
  id: string;
  order_id: string;
  user_id: string;
  pi_payment_id: string;
  montant: number;
  txid: string | null;
  statut: "pending" | "approved" | "paid_held" | "released" | "refunded" | "cancelled";
  commission: number | null;
  facture: Json | null;
  created_at: string;
};

export type LigneCommandeDb = {
  id: string;
  order_id: string;
  produit_id: string | null;
  titre: string;
  quantite: number;
  unite: string;
  prix_unitaire: number;
  montant: number;
};

export type CommandeAvecPaiement = CommandeDb & {
  payments: PaiementDb[];
  order_items?: LigneCommandeDb[] | null;
};

/**
 * Lignes réelles de la commande (`order_items`), avec repli sur le format
 * d'avant la migration : une commande = un seul produit.
 */
export function lignesCommande(c: CommandeAvecPaiement): LigneCommandeDb[] {
  if (c.order_items?.length) return c.order_items;
  return [
    {
      id: `${c.id}-legacy`,
      order_id: c.id,
      produit_id: c.produit_id,
      titre: c.titre,
      quantite: c.quantite,
      unite: c.unite,
      prix_unitaire: c.quantite ? Number(c.montant) / c.quantite : Number(c.montant),
      montant: Number(c.montant),
    },
  ];
}

export type FiltreCommandes = "toutes" | "attente" | "succes" | "annulees" | "litiges";

export function correspondAuFiltre(c: CommandeDb, f: FiltreCommandes): boolean {
  if (f === "toutes") return true;
  if (f === "attente") return c.statut === "en_attente_paiement";
  if (f === "succes") return c.statut === "payee" || c.statut === "recue";
  if (f === "annulees") return c.statut === "annulee" || c.statut === "remboursee";
  return c.statut === "litige";
}

const LIBELLES_STATUT: Record<string, string> = {
  en_attente_paiement: "En attente de paiement",
  payee: "Payée (fonds retenus)",
  recue: "Réception confirmée",
  annulee: "Annulée",
  remboursee: "Remboursée",
  litige: "Litige ouvert",
  pending: "En attente",
  approved: "Approuvé",
  paid_held: "Fonds retenus (escrow)",
  released: "Libéré vers le vendeur",
  refunded: "Remboursé",
  cancelled: "Annulé",
};

export const libelleStatut = (s: string) => LIBELLES_STATUT[s] ?? s;

/** Commandes dans lesquelles l'utilisateur est acheteur ou vendeur. */
export async function mesCommandes(userId: string): Promise<CommandeAvecPaiement[]> {
  // Hygiène : les commandes impayées depuis plus de 30 minutes passent en
  // « annulee » avant d'être listées (idempotent, à chaque ouverture).
  await supabase.rpc("annuler_commandes_perimees");
  const { data } = await supabase
    .from("orders")
    .select("*, payments(*), order_items(*)")
    .or(`acheteur_id.eq.${userId},vendeur_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as CommandeAvecPaiement[] | null) ?? [];
}

/** Le vendeur déclare la livraison (fonction serveur, statut payee). */
export async function declarerLivraison(orderId: string) {
  const { error } = await supabase.rpc("declarer_livraison", { _order: orderId });
  if (error) throw new Error(error.message);
}

/** L'acheteur confirme la réception : la commande passe à « recue ». */
export async function confirmerReception(orderId: string) {
  const { error } = await supabase.rpc("confirmer_reception", { _order: orderId });
  if (error) throw new Error(error.message);
}

/** L'acheteur signale un problème : le litige est visible dans l'espace admin. */
export async function ouvrirLitige(orderId: string, auteurId: string, description: string) {
  const { error } = await supabase
    .from("litiges")
    .insert({ order_id: orderId, auteur_id: auteurId, description: description.slice(0, 500) });
  if (error) throw new Error(error.message);
}

export type LitigeDb = {
  id: string;
  order_id: string;
  auteur_id: string;
  description: string;
  statut: string;
  created_at: string;
};

export async function mesLitiges(auteurId: string): Promise<LitigeDb[]> {
  const { data } = await supabase
    .from("litiges")
    .select("*")
    .eq("auteur_id", auteurId)
    .order("created_at", { ascending: false });
  return (data as LitigeDb[] | null) ?? [];
}
