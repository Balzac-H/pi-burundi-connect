import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Accès à la vue publique `profils_publics` (sans coordonnées téléphoniques). */
const vuePublique = () => (supabase as unknown as SupabaseClient).from("profils_publics");

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
  type_compte?: string;
  pi_uid?: string | null;
  pi_username?: string | null;
  vendeur_actif?: boolean;
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
  quantite_min: number;
  publie: boolean;
  lieu: string | null;
  livraison: string | null;
  photo_url: string | null;
  created_at: string;
};

const DIX_ANS = 60 * 60 * 24 * 365 * 10;

const cacheProfils = new Map<string, { expire: number; profil: Profil | null }>();

/** Profil mis en cache 60 s (les listes en affichent plusieurs à la suite). */
export async function chargerProfilCache(id: string): Promise<Profil | null> {
  const enCache = cacheProfils.get(id);
  if (enCache && enCache.expire > Date.now()) return enCache.profil;
  const profil = await chargerProfil(id);
  cacheProfils.set(id, { expire: Date.now() + 60_000, profil });
  return profil;
}

export function oublierProfil(id: string) {
  cacheProfils.delete(id);
}

export async function chargerProfil(id: string): Promise<Profil | null> {
  const { data } = await supabase.from("profils").select("*").eq("id", id).maybeSingle();
  if (data) return data as Profil;
  // Visiteur non connecté : lecture de la vue publique (sans numéros de téléphone).
  const { data: pub } = await vuePublique().select("*").eq("id", id).maybeSingle();
  return pub ? ({ ...(pub as Profil), whatsapp: null, telephone: null } as Profil) : null;
}

export async function chercherProfils(recherche: string): Promise<Profil[]> {
  const q = recherche.trim();
  const filtrer = <T extends { or: (f: string) => T }>(r: T) =>
    q ? r.or(`nom.ilike.%${q}%,ville.ilike.%${q}%,bio.ilike.%${q}%`) : r;

  const { data } = await filtrer(
    supabase.from("profils").select("*").order("created_at", { ascending: false }).limit(60),
  );
  if (data && data.length) return data as Profil[];

  const { data: pub } = await filtrer(
    vuePublique().select("*").order("created_at", { ascending: false }).limit(60),
  );
  return ((pub ?? []) as Profil[]).map((p) => ({ ...p, whatsapp: null, telephone: null }));
}

export async function enregistrerProfil(id: string, valeurs: Partial<Profil>) {
  const { error } = await supabase.from("profils").upsert({ id, ...valeurs } as never);
  if (error) throw error;
}

export async function televerserPhoto(
  bucket: "avatars" | "produits",
  userId: string,
  fichier: File,
) {
  const ext = fichier.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const chemin = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(chemin, fichier, { upsert: true });
  if (error) throw error;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(chemin, DIX_ANS);
  return data?.signedUrl ?? null;
}

/** Annonces publiées, visibles par tous (RLS : publie = true). */
export async function listerProduits(): Promise<ProduitDb[]> {
  const { data } = await supabase
    .from("produits")
    .select("*")
    .eq("publie", true)
    .order("created_at", { ascending: false })
    .limit(60);
  return (data as ProduitDb[] | null) ?? [];
}

/** Les annonces d'un vendeur (y compris celles masquées), pour sa boutique. */
export async function listerMesProduits(vendeurId: string): Promise<ProduitDb[]> {
  const { data } = await supabase
    .from("produits")
    .select("*")
    .eq("vendeur_id", vendeurId)
    .order("created_at", { ascending: false })
    .limit(60);
  return (data as ProduitDb[] | null) ?? [];
}

export type NouveauProduit = Omit<ProduitDb, "id" | "created_at" | "quantite_min" | "publie"> & {
  quantite_min?: number;
  publie?: boolean;
};

export async function creerProduit(valeurs: NouveauProduit) {
  const { error } = await supabase.from("produits").insert(valeurs);
  if (error) throw error;
}

export async function modifierProduit(id: string, valeurs: Partial<NouveauProduit>) {
  const { error } = await supabase.from("produits").update(valeurs).eq("id", id);
  if (error) throw error;
}

export async function supprimerProduit(id: string) {
  const { error } = await supabase.from("produits").delete().eq("id", id);
  if (error) throw error;
}

/** Indicatifs proposés dans les formulaires (Burundi par défaut). */
export const indicatifs = [
  { code: "257", pays: "Burundi (+257)" },
  { code: "250", pays: "Rwanda (+250)" },
  { code: "255", pays: "Tanzanie (+255)" },
  { code: "256", pays: "Ouganda (+256)" },
  { code: "254", pays: "Kenya (+254)" },
  { code: "243", pays: "RD Congo (+243)" },
  { code: "32", pays: "Belgique (+32)" },
  { code: "33", pays: "France (+33)" },
];

/** Assemble indicatif + numéro local en format international sans « + » ni espace. */
export function composerNumero(indicatif: string, local: string): string {
  const ind = (indicatif ?? "").replace(/\D/g, "");
  const n = (local ?? "").replace(/\D/g, "").replace(/^0+/, "");
  return `${ind}${n}`;
}

/** Sépare un numéro enregistré en indicatif connu + partie locale. */
export function separerNumero(numero: string | null | undefined): {
  indicatif: string;
  local: string;
} {
  const n = (numero ?? "").replace(/\D/g, "");
  const trouve = indicatifs.find((i) => n.startsWith(i.code));
  if (!trouve) return { indicatif: "257", local: n };
  return { indicatif: trouve.code, local: n.slice(trouve.code.length) };
}

/** Normalise un numéro burundais vers le format international attendu par WhatsApp (257XXXXXXXX). */
export function normaliserNumero(numero: string): string {
  let n = (numero ?? "").replace(/\D/g, "");
  if (!n) return "";
  n = n.replace(/^0+/, ""); // 079… -> 79…
  if (n.startsWith("00")) n = n.slice(2);
  if (!n.startsWith("257") && n.length <= 9) n = `257${n}`; // numéro local burundais
  return n;
}

export const numeroValide = (numero: string) => normaliserNumero(numero).length >= 11;

export const lienWhatsApp = (numero: string, texte = "Bonjour, je vous contacte via Arija") =>
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
