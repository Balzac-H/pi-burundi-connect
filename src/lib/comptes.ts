import { supabase } from "@/integrations/supabase/client";

export type Profil = {
  id: string;
  nom: string;
  photo_url: string | null;
  bio: string | null;
  ville: string | null;
  competences: string[];
  whatsapp: string | null;
  telephone: string | null;
  prix_horaire: number | null;
  statut: string;
};

export type ProduitDb = {
  id: string;
  vendeur_id: string;
  titre: string;
  description: string | null;
  categorie: string;
  prix: number;
  unite: string;
  stock: number;
  lieu: string | null;
  livraison: string | null;
  photo_url: string | null;
  created_at: string;
};

const DIX_ANS = 60 * 60 * 24 * 365 * 10;

export async function chargerProfil(id: string): Promise<Profil | null> {
  const { data } = await supabase.from("profils").select("*").eq("id", id).maybeSingle();
  return (data as Profil | null) ?? null;
}

export async function chercherProfils(recherche: string): Promise<Profil[]> {
  let requete = supabase.from("profils").select("*").order("created_at", { ascending: false }).limit(60);
  const q = recherche.trim();
  if (q) requete = requete.or(`nom.ilike.%${q}%,ville.ilike.%${q}%,bio.ilike.%${q}%`);
  const { data } = await requete;
  return (data as Profil[] | null) ?? [];
}

export async function enregistrerProfil(id: string, valeurs: Partial<Profil>) {
  const { error } = await supabase.from("profils").upsert({ id, ...valeurs });
  if (error) throw error;
}

export async function televerserPhoto(bucket: "avatars" | "produits", userId: string, fichier: File) {
  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const chemin = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(chemin, fichier, { upsert: true });
  if (error) throw error;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(chemin, DIX_ANS);
  return data?.signedUrl ?? null;
}

export async function listerProduits(vendeurId?: string): Promise<ProduitDb[]> {
  let requete = supabase.from("produits").select("*").order("created_at", { ascending: false }).limit(60);
  if (vendeurId) requete = requete.eq("vendeur_id", vendeurId);
  const { data } = await requete;
  return (data as ProduitDb[] | null) ?? [];
}

export async function creerProduit(valeurs: Omit<ProduitDb, "id" | "created_at">) {
  const { error } = await supabase.from("produits").insert(valeurs);
  if (error) throw error;
}

export async function supprimerProduit(id: string) {
  const { error } = await supabase.from("produits").delete().eq("id", id);
  if (error) throw error;
}

/** Normalise un numéro burundais vers le format international attendu par WhatsApp (257XXXXXXXX). */
export function normaliserNumero(numero: string): string {
  let n = (numero ?? "").replace(/\D/g, "");
  if (!n) return "";
  n = n.replace(/^0+/, "");            // 079… -> 79…
  if (n.startsWith("00")) n = n.slice(2);
  if (!n.startsWith("257") && n.length <= 9) n = `257${n}`; // numéro local burundais
  return n;
}

export const numeroValide = (numero: string) => normaliserNumero(numero).length >= 11;

export const lienWhatsApp = (numero: string, texte = "Bonjour, je vous contacte via BURUNDI PI CONNECT") =>
  `https://wa.me/${normaliserNumero(numero)}?text=${encodeURIComponent(texte)}`;

/** Ouvre WhatsApp de façon fiable (nouvel onglet, avec repli si bloqué : iframe/preview). */
export function ouvrirWhatsApp(numero: string, texte?: string): boolean {
  if (!numeroValide(numero)) return false;
  const url = lienWhatsApp(numero, texte);
  if (typeof window === "undefined") return false;
  const onglet = window.open(url, "_blank", "noopener,noreferrer");
  if (!onglet) {
    try {
      (window.top ?? window).location.href = url;
    } catch {
      window.location.href = url;
    }
  }
  return true;
}
