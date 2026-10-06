import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Client non typé pour les tables récentes (jobs, signalements, rôles). */
const db = () => supabase as unknown as SupabaseClient;

export type JobDb = {
  id: string;
  employeur_id: string;
  titre: string;
  description: string;
  categorie: string;
  localisation: string;
  salaire: number | null;
  duree: string | null;
  urgent: boolean;
  created_at: string;
};

export async function listerJobs(employeurId?: string): Promise<JobDb[]> {
  let q = db().from("jobs").select("*").order("created_at", { ascending: false }).limit(60);
  if (employeurId) q = q.eq("employeur_id", employeurId);
  const { data } = await q;
  return (data as JobDb[] | null) ?? [];
}

export async function chargerJob(id: string): Promise<JobDb | null> {
  const { data } = await db().from("jobs").select("*").eq("id", id).maybeSingle();
  return (data as JobDb | null) ?? null;
}

export async function creerJob(valeurs: Omit<JobDb, "id" | "created_at">) {
  const { error } = await db().from("jobs").insert(valeurs);
  if (error) throw error;
}

/** Vérifié = email ou téléphone confirmé (calculé côté serveur). */
export async function idsVerifies(ids: string[]): Promise<Set<string>> {
  const uniques = [...new Set(ids)].filter(Boolean);
  if (!uniques.length) return new Set();
  const { data } = await db().rpc("utilisateurs_verifies", { _ids: uniques });
  return new Set(
    ((data as unknown as (string | { utilisateurs_verifies: string })[]) ?? []).map((d) =>
      typeof d === "string" ? d : d.utilisateurs_verifies,
    ),
  );
}

export const raisonsSignalement = [
  { code: "arnaque", nom: "Arnaque" },
  { code: "faux_produit", nom: "Faux produit" },
  { code: "comportement_abusif", nom: "Comportement abusif" },
  { code: "autre", nom: "Autre" },
] as const;

export type Raison = (typeof raisonsSignalement)[number]["code"];
export type CibleType = "profil" | "produit" | "job";

export async function signaler(v: {
  auteur_id: string;
  utilisateur_signale_id: string;
  cible_type: CibleType;
  cible_id: string;
  raison: Raison;
  details?: string;
}) {
  const { error } = await db()
    .from("signalements")
    .insert({ ...v, details: v.details?.slice(0, 500) || null });
  if (error) {
    if (error.code === "23505") throw new Error("Vous avez déjà signalé ce contenu.");
    throw error;
  }
}

export type SignalementDb = {
  id: string;
  auteur_id: string;
  utilisateur_signale_id: string;
  cible_type: CibleType;
  cible_id: string;
  raison: Raison;
  details: string | null;
  statut: "ouvert" | "traite";
  created_at: string;
};

export async function listerSignalements(): Promise<SignalementDb[]> {
  const { data, error } = await db()
    .from("signalements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as SignalementDb[]) ?? [];
}

export async function marquerTraite(id: string, statut: "ouvert" | "traite") {
  const { error } = await db().from("signalements").update({ statut }).eq("id", id);
  if (error) throw error;
}

export async function estAdmin(userId: string): Promise<boolean> {
  const { data } = await db().rpc("has_role", { _user_id: userId, _role: "admin" });
  return data === true;
}

export const typesCompte = [
  { code: "vendeur", nom: "Vendeur" },
  { code: "employeur", nom: "Employeur" },
  { code: "chercheur", nom: "Chercheur d'emploi" },
] as const;

export const nomTypeCompte = (c?: string | null) =>
  typesCompte.find((t) => t.code === c)?.nom ?? "Membre";
