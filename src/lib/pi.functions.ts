import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PI_API = "https://api.minepi.com/v2";
const TAUX_COMMISSION = 0.02;

/** Journal serveur : ne contient jamais la clé API. */
function journal(etape: string, info: Record<string, unknown>) {
  console.error(`[pi:${etape}]`, JSON.stringify(info));
}

function cleApi(): string {
  const k = process.env["PI_API_KEY"];
  if (!k) throw new Error("PI_API_KEY non configurée sur le serveur.");
  return k;
}

type PiPayment = {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: { orderId?: string } | null;
  transaction: { txid: string; verified: boolean } | null;
  status: { developer_approved: boolean; transaction_verified: boolean; developer_completed: boolean; cancelled: boolean; user_cancelled: boolean };
};

async function appelPi<T>(chemin: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${PI_API}${chemin}`, {
    ...init,
    headers: { Authorization: `Key ${cleApi()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!r.ok) {
    const texte = await r.text().catch(() => "");
    throw new Error(`API Pi ${r.status} : ${texte.slice(0, 200)}`);
  }
  return (await r.json()) as T;
}

/* ---------- Authentification Pi ---------- */
export const piAuth = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ accessToken: z.string().min(10).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    // On ne fait confiance qu'à la réponse de Pi, jamais au navigateur.
    const r = await fetch(`${PI_API}/me`, { headers: { Authorization: `Bearer ${data.accessToken}` } });
    if (!r.ok) {
      journal("auth", { statut: r.status });
      throw new Error("Jeton Pi invalide.");
    }
    const moi = (await r.json()) as { uid: string; username: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = `pi-${moi.uid}@pi.wico.app`;

    const { data: existant } = await supabaseAdmin.from("profils").select("id").eq("pi_uid", moi.uid).maybeSingle();
    if (!existant) {
      const { data: cree, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nom: moi.username, type_compte: "chercheur" },
      });
      if (error && !/already/i.test(error.message)) throw new Error("Création du compte impossible.");
      const id = cree?.user?.id;
      if (id) await supabaseAdmin.from("profils").update({ pi_uid: moi.uid, pi_username: moi.username }).eq("id", id);
    }
    const { data: lien, error: e2 } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
    if (e2 || !lien.properties?.hashed_token) throw new Error("Ouverture de session impossible.");
    if (existant) await supabaseAdmin.from("profils").update({ pi_username: moi.username }).eq("id", existant.id);
    return { tokenHash: lien.properties.hashed_token, username: moi.username };
  });

/* ---------- Approbation ---------- */
export const piApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paymentId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const p = await appelPi<PiPayment>(`/payments/${encodeURIComponent(data.paymentId)}`);
      const orderId = p.metadata?.orderId;
      if (!orderId) throw new Error("Commande absente du paiement.");
      const { data: cmd } = await supabaseAdmin.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (!cmd) throw new Error("Commande introuvable.");
      if (cmd.acheteur_id !== context.userId) throw new Error("Utilisateur différent de la commande.");
      if (cmd.statut !== "en_attente_paiement") throw new Error("Commande non en attente.");
      const { data: prof } = await supabaseAdmin.from("profils").select("pi_uid").eq("id", context.userId).maybeSingle();
      if (prof?.pi_uid && prof.pi_uid !== p.user_uid) throw new Error("Compte Pi différent.");
      if (Math.abs(Number(p.amount) - Number(cmd.montant)) > 1e-7) throw new Error("Montant incorrect.");

      await supabaseAdmin.from("payments").upsert(
        { order_id: orderId, user_id: context.userId, pi_payment_id: p.identifier, montant: cmd.montant, statut: "pending" },
        { onConflict: "pi_payment_id", ignoreDuplicates: true },
      );
      if (!p.status.developer_approved) await appelPi(`/payments/${encodeURIComponent(p.identifier)}/approve`, { method: "POST" });
      await supabaseAdmin.from("payments").update({ statut: "approved" }).eq("pi_payment_id", p.identifier).eq("statut", "pending");
      return { ok: true };
    } catch (e) {
      journal("approve", { paymentId: data.paymentId, erreur: (e as Error).message });
      throw new Error("Paiement refusé : " + (e as Error).message);
    }
  });

/* ---------- Finalisation (idempotente) ---------- */
export const piComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paymentId: z.string().min(1).max(200), txid: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { data: pay } = await supabaseAdmin.from("payments").select("*").eq("pi_payment_id", data.paymentId).maybeSingle();
      if (!pay) throw new Error("Paiement inconnu.");
      if (pay.user_id !== context.userId) throw new Error("Utilisateur différent.");
      if (["paid_held", "released", "refunded"].includes(pay.statut)) return { ok: true, deja: true };

      const p = await appelPi<PiPayment>(`/payments/${encodeURIComponent(data.paymentId)}`);
      if (p.transaction?.txid && p.transaction.txid !== data.txid) throw new Error("txid incohérent.");
      if (!p.status.developer_completed) {
        await appelPi(`/payments/${encodeURIComponent(data.paymentId)}/complete`, { method: "POST", body: JSON.stringify({ txid: data.txid }) });
      }
      const { data: cmd } = await supabaseAdmin.from("orders").select("*").eq("id", pay.order_id).single();
      if (!cmd) throw new Error("Commande introuvable.");
      const facture = {
        numero: `WICO-${pay.id.slice(0, 8).toUpperCase()}`,
        date: new Date().toISOString(),
        produit: cmd.titre,
        quantite: cmd.quantite,
        unite: cmd.unite,
        montant_brut: Number(cmd.montant),
        txid: data.txid,
      };
      const { data: maj } = await supabaseAdmin.from("payments")
        .update({ statut: "paid_held", txid: data.txid, facture })
        .eq("id", pay.id).in("statut", ["pending", "approved"]).select("id");
      if (maj && maj.length) {
        await supabaseAdmin.from("orders").update({ statut: "payee" }).eq("id", pay.order_id);
        if (cmd.produit_id) {
          const { data: prod } = await supabaseAdmin.from("produits").select("stock").eq("id", cmd.produit_id).single();
          if (prod) await supabaseAdmin.from("produits").update({ stock: Math.max(0, prod.stock - cmd.quantite) }).eq("id", cmd.produit_id);
        }
        await supabaseAdmin.from("notifications").insert({ user_id: cmd.vendeur_id, titre: "Nouvelle commande payée", contenu: `${cmd.titre} × ${cmd.quantite} ${cmd.unite}`, lien: "/portefeuille" });
      }
      return { ok: true };
    } catch (e) {
      journal("complete", { paymentId: data.paymentId, erreur: (e as Error).message });
      throw new Error("Finalisation impossible : " + (e as Error).message);
    }
  });

/* ---------- Annulation ---------- */
export const piCancel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paymentId: z.string().max(200).optional(), orderId: z.string().uuid().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let orderId = data.orderId;
    if (data.paymentId) {
      const { data: pay } = await supabaseAdmin.from("payments").select("*").eq("pi_payment_id", data.paymentId).maybeSingle();
      if (pay && pay.user_id === context.userId && ["pending", "approved"].includes(pay.statut)) {
        await supabaseAdmin.from("payments").update({ statut: "cancelled" }).eq("id", pay.id);
        orderId = pay.order_id;
      }
    }
    if (orderId) {
      await supabaseAdmin.from("orders").update({ statut: "annulee" })
        .eq("id", orderId).eq("acheteur_id", context.userId).eq("statut", "en_attente_paiement");
    }
    return { ok: true };
  });

/* ---------- Libération (admin) ---------- */
export const piRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!admin) throw new Error("Réservé aux administrateurs.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pay } = await supabaseAdmin.from("payments").select("*").eq("id", data.paymentId).single();
    if (!pay) throw new Error("Paiement introuvable.");
    if (pay.statut !== "paid_held") throw new Error("Fonds non retenus.");
    const commission = Math.round(Number(pay.montant) * TAUX_COMMISSION * 1e7) / 1e7;
    // TODO : paiement A2U avec le SDK backend Pi, nécessite la clé du portefeuille de l'app.
    // Pour l'instant on change uniquement le statut et on enregistre la commission.
    const facture = { ...(pay.facture as object), commission, taux: TAUX_COMMISSION, montant_net_vendeur: Number(pay.montant) - commission };
    await supabaseAdmin.from("payments").update({ statut: "released", commission, facture }).eq("id", pay.id);
    return { ok: true, commission };
  });

/* ---------- Suppression de compte ---------- */
export const supprimerMonCompte = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = context.userId;
    await supabaseAdmin.from("produits").delete().eq("vendeur_id", id);
    await supabaseAdmin.from("jobs").delete().eq("employeur_id", id);
    await supabaseAdmin.from("messages").delete().or(`expediteur_id.eq.${id},destinataire_id.eq.${id}`);
    await supabaseAdmin.from("notifications").delete().eq("user_id", id);
    await supabaseAdmin.from("follows").delete().or(`suiveur_id.eq.${id},suivi_id.eq.${id}`);
    await supabaseAdmin.from("reviews").delete().eq("auteur_id", id);
    await supabaseAdmin.from("profils").delete().eq("id", id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw new Error("Suppression impossible.");
    return { ok: true };
  });
