import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* Suivis (table `follows`)                                            */
/* ------------------------------------------------------------------ */

export async function chargerSuivis(suiveurId: string): Promise<string[]> {
  const { data } = await supabase.from("follows").select("suivi_id").eq("suiveur_id", suiveurId);
  return ((data ?? []) as { suivi_id: string }[]).map((r) => r.suivi_id);
}

export async function suivre(suiveurId: string, suiviId: string) {
  const { error } = await supabase
    .from("follows")
    .insert({ suiveur_id: suiveurId, suivi_id: suiviId });
  if (error && error.code !== "23505") throw error;
}

export async function nePlusSuivre(suiveurId: string, suiviId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("suiveur_id", suiveurId)
    .eq("suivi_id", suiviId);
  if (error) throw error;
}

export async function compterSuiveurs(id: string): Promise<number> {
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("suivi_id", id);
  return count ?? 0;
}

export async function compterSuivis(id: string): Promise<number> {
  const { count } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("suiveur_id", id);
  return count ?? 0;
}

/* ------------------------------------------------------------------ */
/* Avis (table `reviews`)                                              */
/* ------------------------------------------------------------------ */

export type AvisDb = {
  id: string;
  auteur_id: string;
  vendeur_id: string;
  note: number;
  commentaire: string | null;
  created_at: string;
};

export async function avisDeVendeur(vendeurId: string): Promise<AvisDb[]> {
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("vendeur_id", vendeurId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data as AvisDb[] | null) ?? [];
}

export async function laisserAvis(
  auteurId: string,
  vendeurId: string,
  note: number,
  commentaire?: string,
) {
  const { error } = await supabase.from("reviews").insert({
    auteur_id: auteurId,
    vendeur_id: vendeurId,
    note,
    commentaire: commentaire?.slice(0, 500) || null,
  });
  if (error) {
    if (error.code === "23505") throw new Error("Vous avez déjà laissé un avis pour ce vendeur.");
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* Statistiques d'un profil (calculées, jamais inventées)              */
/* ------------------------------------------------------------------ */

export type StatsProfil = {
  followers: number;
  following: number;
  ventes: number;
  offres: number;
  nbAvis: number;
  note: number;
  satisfaction: number;
};

export async function statsProfil(id: string): Promise<StatsProfil> {
  const [followers, following, offres, avis] = await Promise.all([
    compterSuiveurs(id),
    compterSuivis(id),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("employeur_id", id),
    avisDeVendeur(id),
  ]);
  const { count: ventes } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("vendeur_id", id)
    .in("statut", ["payee", "recue"]);

  const nbAvis = avis.length;
  const note = nbAvis ? Math.round((avis.reduce((s, a) => s + a.note, 0) / nbAvis) * 10) / 10 : 0;
  const satisfaisants = avis.filter((a) => a.note >= 4).length;

  return {
    followers,
    following,
    ventes: ventes ?? 0,
    offres: offres.count ?? 0,
    nbAvis,
    note,
    satisfaction: nbAvis ? Math.round((satisfaisants / nbAvis) * 100) : 0,
  };
}
