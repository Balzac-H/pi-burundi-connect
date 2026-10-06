import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PI_API = "https://api.minepi.com/v2";
/** Commission WICO : 2 %, calculés et enregistrés à la libération des fonds. */
export const TAUX_COMMISSION = 0.02;

/** Journal serveur pour approve/complete/cancel. Ne contient JAMAIS la clé API. */
function journal(etape: string, info: Record<string, unknown>) {
  const sans = { ...info };
  delete sans.cle;
  delete sans.apiKey;
  console.error(`[pi:${etape}]`, JSON.stringify(sans));
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
  metadata: { orderId?: string; orderIds?: string[] } | null;
  transaction: { txid: string; verified: boolean } | null;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
};

async function appelPi<T>(chemin: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${PI_API}${chemin}`, {
    ...init,
    headers: {
      Authorization: `Key ${cleApi()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) {
    const texte = await r.text().catch(() => "");
    throw new Error(`API Pi ${r.status} : ${texte.slice(0, 200)}`);
  }
  if (r.status === 204) return undefined as T;
  const texte = await r.text();
  return (texte ? JSON.parse(texte) : undefined) as T;
}

/** Commandes référencées par un paiement (metadata : orderId ou orderIds). */
function commandesDuPaiement(p: PiPayment): string[] {
  const ids = p.metadata?.orderIds ?? (p.metadata?.orderId ? [p.metadata.orderId] : []);
  return ids.filter((x): x is string => typeof x === "string" && x.length > 0);
}

/* ------------------------------------------------------------------ */
/* Authentification Pi : le serveur vérifie le jeton auprès de Pi,     */
/* jamais le navigateur.                                               */
/* ------------------------------------------------------------------ */
export const piAuth = createServerFn({ method: "POST" })
  .validator((d) => z.object({ accessToken: z.string().min(10).max(4000) }).parse(d))
  .handler(async ({ data }) => {
    const r = await fetch(`${PI_API}/me`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    if (!r.ok) {
      journal("auth", { statut: r.status });
      throw new Error("Jeton Pi invalide.");
    }
    const moi = (await r.json()) as { uid: string; username: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Session éventuellement déjà ouverte (compte email/Google) : on lie
    // l'identité Pi à ce compte au lieu d'en créer un second.
    const sessionUserId = await userIdDeLaSession();

    const { data: existant } = await supabaseAdmin
      .from("profils")
      .select("id")
      .eq("pi_uid", moi.uid)
      .maybeSingle();

    if (existant && existant.id !== sessionUserId) {
      // Déjà connecté avec ce compte Pi : on ouvre la session via lien magique.
      return { tokenHash: await lienMagique(existant.id), username: moi.username };
    }

    if (sessionUserId) {
      const { error } = await supabaseAdmin
        .from("profils")
        .update({ pi_uid: moi.uid, pi_username: moi.username })
        .eq("id", sessionUserId);
      if (error) {
        if (error.code === "23505")
          throw new Error("Ce compte Pi est déjà lié à un autre compte WICO.");
        throw new Error("Liaison du compte Pi impossible.");
      }
      return { tokenHash: null, username: moi.username };
    }

    if (existant) {
      await supabaseAdmin
        .from("profils")
        .update({ pi_username: moi.username })
        .eq("id", existant.id);
      return { tokenHash: await lienMagique(existant.id), username: moi.username };
    }

    // Nouveau membre Pi : `generateLink` crée l'utilisateur s'il n'existe pas,
    // l'email factice est dérivée du pi_uid (jamais de mot de passe).
    const email = `pi-${moi.uid}@pi.wico.app`;
    const { data: gen, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error || !gen?.user || !gen.properties?.hashed_token) {
      journal("auth", { etape: "generateLink", message: error?.message });
      throw new Error("Ouverture de session impossible.");
    }
    const id = gen.user.id;
    const { data: maj } = await supabaseAdmin
      .from("profils")
      .update({ pi_uid: moi.uid, pi_username: moi.username })
      .eq("id", id)
      .select("id");
    if (!maj?.length) {
      await supabaseAdmin
        .from("profils")
        .insert({ id, nom: moi.username, pi_uid: moi.uid, pi_username: moi.username });
    }
    return { tokenHash: gen.properties.hashed_token, username: moi.username };
  });

async function userIdDeLaSession(): Promise<string | null> {
  try {
    const request = getRequest();
    const brut = request?.headers?.get("authorization");
    if (!brut?.startsWith("Bearer ")) return null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.auth.getUser(brut.replace("Bearer ", ""));
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

async function lienMagique(userId: string): Promise<string> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
  const email = user.user?.email;
  if (!email) throw new Error("Ouverture de session impossible.");
  const { data: lien, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !lien.properties?.hashed_token) throw new Error("Ouverture de session impossible.");
  return lien.properties.hashed_token;
}

/* ------------------------------------------------------------------ */
/* Approbation : vérifie le paiement AUPRÈS DE PI puis en base          */
/* ------------------------------------------------------------------ */
export const piApprove = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ paymentId: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const p = await appelPi<PiPayment>(`/payments/${encodeURIComponent(data.paymentId)}`);
      const ids = commandesDuPaiement(p);
      if (!ids.length) throw new Error("Commande absente du paiement.");

      const { data: commandes } = await supabaseAdmin.from("orders").select("*").in("id", ids);
      if (!commandes || commandes.length !== ids.length) throw new Error("Commande introuvable.");
      const total = commandes.reduce((s, c) => s + Number(c.montant), 0);
      if (commandes.some((c) => c.acheteur_id !== context.userId))
        throw new Error("Utilisateur différent de la commande.");
      if (commandes.some((c) => c.statut !== "en_attente_paiement"))
        throw new Error("Commande non en attente.");
      if (Math.abs(Number(p.amount) - total) > 1e-7) throw new Error("Montant incorrect.");

      const { data: prof } = await supabaseAdmin
        .from("profils")
        .select("pi_uid")
        .eq("id", context.userId)
        .maybeSingle();
      if (prof?.pi_uid && prof.pi_uid !== p.user_uid) throw new Error("Compte Pi différent.");

      for (const cmd of commandes) {
        await supabaseAdmin.from("payments").upsert(
          {
            order_id: cmd.id,
            user_id: context.userId,
            pi_payment_id: p.identifier,
            montant: cmd.montant,
            statut: "pending",
          },
          { onConflict: "pi_payment_id", ignoreDuplicates: true },
        );
      }
      if (!p.status.developer_approved) {
        await appelPi(`/payments/${encodeURIComponent(p.identifier)}/approve`, { method: "POST" });
      }
      await supabaseAdmin
        .from("payments")
        .update({ statut: "approved" })
        .eq("pi_payment_id", p.identifier)
        .in("statut", ["pending"]);
      journal("approve", { paymentId: p.identifier, commandes: ids.length, montant: total });
      return { ok: true };
    } catch (e) {
      journal("approve", { paymentId: data.paymentId, erreur: (e as Error).message });
      throw new Error("Paiement refusé : " + (e as Error).message);
    }
  });

/* ------------------------------------------------------------------ */
/* Finalisation : idempotente (un second appel ne double rien)         */
/* ------------------------------------------------------------------ */
export const piComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z.object({ paymentId: z.string().min(1).max(200), txid: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      let { data: pay } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("pi_payment_id", data.paymentId)
        .maybeSingle();
      if (pay && pay.user_id !== context.userId) throw new Error("Utilisateur différent.");
      if (pay && ["paid_held", "released", "refunded"].includes(pay.statut))
        return { ok: true, deja: true };

      const p = await appelPi<PiPayment>(`/payments/${encodeURIComponent(data.paymentId)}`);
      const ids = commandesDuPaiement(p);
      if (!ids.length) throw new Error("Commande absente du paiement.");
      if (p.transaction?.txid && p.transaction.txid !== data.txid)
        throw new Error("txid incohérent.");

      const { data: commandes } = await supabaseAdmin.from("orders").select("*").in("id", ids);
      if (!commandes || commandes.length !== ids.length) throw new Error("Commande introuvable.");
      if (commandes.some((c) => c.acheteur_id !== context.userId))
        throw new Error("Utilisateur différent de la commande.");
      const total = commandes.reduce((s, c) => s + Number(c.montant), 0);
      if (Math.abs(Number(p.amount) - total) > 1e-7) throw new Error("Montant incorrect.");

      // Enregistrement du paiement s'il n'a pas été approuvé par notre équipe
      // (par ex. paiement incomplet retrouvé à la connexion).
      if (!pay) {
        const principale = commandes[0];
        const { error: upsert } = await supabaseAdmin.from("payments").upsert(
          {
            order_id: principale.id,
            user_id: context.userId,
            pi_payment_id: p.identifier,
            montant: principale.montant,
            statut: "approved",
          },
          { onConflict: "pi_payment_id", ignoreDuplicates: true },
        );
        if (upsert) throw new Error("Enregistrement du paiement impossible.");
        const { data: recharge } = await supabaseAdmin
          .from("payments")
          .select("*")
          .eq("pi_payment_id", data.paymentId)
          .maybeSingle();
        pay = recharge;
      }
      if (!pay) throw new Error("Paiement introuvable.");

      if (!p.status.developer_completed) {
        await appelPi(`/payments/${encodeURIComponent(p.identifier)}/complete`, {
          method: "POST",
          body: JSON.stringify({ txid: data.txid }),
        });
      }

      const maj = await supabaseAdmin
        .from("payments")
        .update({
          statut: "paid_held",
          txid: data.txid,
          facture: construireFacture(commandes, data.txid),
        })
        .eq("id", pay.id)
        .in("statut", ["pending", "approved"])
        .select("id");

      if (!maj.error && maj.data?.length) {
        for (const cmd of commandes) {
          await supabaseAdmin
            .from("orders")
            .update({ statut: "payee" })
            .eq("id", cmd.id)
            .eq("statut", "en_attente_paiement");
          if (cmd.produit_id) {
            const { data: prod } = await supabaseAdmin
              .from("produits")
              .select("stock")
              .eq("id", cmd.produit_id)
              .maybeSingle();
            if (prod) {
              await supabaseAdmin
                .from("produits")
                .update({ stock: Math.max(0, prod.stock - cmd.quantite) })
                .eq("id", cmd.produit_id);
            }
          }
          await supabaseAdmin.from("notifications").insert({
            user_id: cmd.vendeur_id,
            titre: "Nouvelle commande payée",
            contenu: `${cmd.titre} × ${cmd.quantite} ${cmd.unite}`,
            lien: "/portefeuille",
          });
        }
        journal("complete", {
          paymentId: data.paymentId,
          commandes: ids.length,
          txid: data.txid.slice(0, 12) + "…",
        });
      }
      return { ok: true };
    } catch (e) {
      journal("complete", { paymentId: data.paymentId, erreur: (e as Error).message });
      throw new Error("Finalisation impossible : " + (e as Error).message);
    }
  });

function construireFacture(
  commandes: { id: string; titre: string; quantite: number; unite: string; montant: number }[],
  txid: string,
) {
  return {
    numero: `WICO-${commandes[0].id.slice(0, 8).toUpperCase()}`,
    date: new Date().toISOString(),
    lignes: commandes.map((c) => ({
      libelle: c.titre,
      quantite: c.quantite,
      unite: c.unite,
      montant: Number(c.montant),
    })),
    montant_brut: commandes.reduce((s, c) => s + Number(c.montant), 0),
    txid,
  };
}

/* ------------------------------------------------------------------ */
/* Annulation                                                          */
/* ------------------------------------------------------------------ */
export const piCancel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        paymentId: z.string().max(200).optional(),
        orderId: z.string().uuid().optional(),
        orderIds: z.array(z.string().uuid()).max(50).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ids = data.orderIds ?? (data.orderId ? [data.orderId] : []);

    if (data.paymentId) {
      const { data: pay } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("pi_payment_id", data.paymentId)
        .maybeSingle();
      if (pay && pay.user_id === context.userId && ["pending", "approved"].includes(pay.statut)) {
        await supabaseAdmin.from("payments").update({ statut: "cancelled" }).eq("id", pay.id);
        ids = [...new Set([...ids, pay.order_id])];
      }
    }
    for (const id of ids) {
      await supabaseAdmin
        .from("orders")
        .update({ statut: "annulee" })
        .eq("id", id)
        .eq("acheteur_id", context.userId)
        .eq("statut", "en_attente_paiement");
    }
    if (data.paymentId) journal("cancel", { paymentId: data.paymentId, commandes: ids.length });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Libération des fonds (espace admin)                                 */
/* ------------------------------------------------------------------ */
export const piRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!admin) throw new Error("Réservé aux administrateurs.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pay } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!pay) throw new Error("Paiement introuvable.");
    if (pay.statut !== "paid_held") throw new Error("Fonds non retenus.");

    const commission = Math.round(Number(pay.montant) * TAUX_COMMISSION * 1e7) / 1e7;
    // TODO : paiement A2U avec le SDK backend Pi, nécessite la clé du portefeuille de l'app.
    // Pour l'instant cette fonction ne change QUE le statut et enregistre la
    // commission de 2 %. Aucun transfert réel n'est effectué.
    const facture = {
      ...(typeof pay.facture === "object" && pay.facture
        ? (pay.facture as Record<string, unknown>)
        : {}),
      commission,
      taux: TAUX_COMMISSION,
      montant_net_vendeur: Number(pay.montant) - commission,
    };
    const { error } = await supabaseAdmin
      .from("payments")
      .update({ statut: "released", commission, facture })
      .eq("id", pay.id)
      .eq("statut", "paid_held");
    if (error) throw new Error("Libération impossible.");
    const { data: cmd } = await supabaseAdmin
      .from("orders")
      .select("vendeur_id, titre")
      .eq("id", pay.order_id)
      .maybeSingle();
    if (cmd) {
      await supabaseAdmin.from("notifications").insert({
        user_id: cmd.vendeur_id,
        titre: "Fonds libérés",
        contenu: `${cmd.titre} — ${Number(pay.montant) - commission} π (commission ${commission} π)`,
        lien: "/portefeuille",
      });
    }
    journal("release", { paymentId: pay.id, commission });
    return { ok: true, commission };
  });

/* ------------------------------------------------------------------ */
/* Suppression de compte                                               */
/* ------------------------------------------------------------------ */
export const supprimerMonCompte = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = context.userId;
    await supabaseAdmin.from("produits").delete().eq("vendeur_id", id);
    await supabaseAdmin.from("jobs").delete().eq("employeur_id", id);
    await supabaseAdmin
      .from("messages")
      .delete()
      .or(`expediteur_id.eq.${id},destinataire_id.eq.${id}`);
    await supabaseAdmin.from("notifications").delete().eq("user_id", id);
    await supabaseAdmin.from("follows").delete().or(`suiveur_id.eq.${id},suivi_id.eq.${id}`);
    await supabaseAdmin.from("reviews").delete().eq("auteur_id", id);
    await supabaseAdmin.from("signalements").delete().eq("auteur_id", id);
    await supabaseAdmin.from("profils").delete().eq("id", id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw new Error("Suppression impossible.");
    return { ok: true };
  });
