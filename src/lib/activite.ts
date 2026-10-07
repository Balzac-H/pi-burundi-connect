import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Client non typé : les vues `gains_lignes`, `gains_totaux` et
 *  `clients_vendeur` sont ajoutées à types.ts séparément. */
const db = () => supabase as unknown as SupabaseClient;

export type GainsLigne = {
  order_id: string;
  vendeur_id: string;
  titre: string;
  quantite: number;
  unite: string;
  montant: number;
  statut: string;
  created_at: string;
  livre_declare_at: string | null;
  paiement_statut: string | null;
  commission: number | null;
  en_escrow: number;
  libere_brut: number;
  libere_net: number;
  commission_payee: number;
};

export type TotauxGains = {
  vendeur_id: string;
  en_escrow: number;
  libere_brut: number;
  libere_net: number;
  commission_payee: number;
};

export type ClientVendeur = {
  vendeur_id: string;
  acheteur_id: string;
  nb_commandes: number;
  total: number;
  derniere_commande: string;
};

/** Vue SQL des gains du vendeur (jamais d'agrégat calculé dans le navigateur). */
export async function mesGains(vendeurId: string): Promise<GainsLigne[]> {
  const { data } = await db()
    .from("gains_lignes")
    .select("*")
    .eq("vendeur_id", vendeurId)
    .order("created_at", { ascending: false })
    .limit(200);
  return (data as GainsLigne[] | null) ?? [];
}

export async function totauxGains(vendeurId: string): Promise<TotauxGains | null> {
  const { data } = await db()
    .from("gains_totaux")
    .select("*")
    .eq("vendeur_id", vendeurId)
    .maybeSingle();
  return (data as TotauxGains | null) ?? null;
}

export async function mesClients(vendeurId: string): Promise<ClientVendeur[]> {
  const { data } = await db()
    .from("clients_vendeur")
    .select("*")
    .eq("vendeur_id", vendeurId)
    .order("derniere_commande", { ascending: false })
    .limit(200);
  return (data as ClientVendeur[] | null) ?? [];
}

/** L'acteur doit avoir un identifiant Pi (vérifié aussi côté base). */
export async function activerEspaceVendeur(userId: string): Promise<void> {
  const { error } = await supabase.from("profils").update({ vendeur_actif: true }).eq("id", userId);
  if (error) throw new Error(error.message);
}
