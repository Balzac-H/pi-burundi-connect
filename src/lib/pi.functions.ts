import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  DEJA_PREMIER_VALIDATEUR,
  SEUIL_DOUBLE_VALIDATION,
  normaliserErreurServeur,
} from "@/lib/admin.functions";
import { DOMAINE_EMAIL_COMPTE } from "@/lib/env";

const PI_API = "https://api.minepi.com/v2";
/** Commission Arija Connect : 2 %, calculés et enregistrés à la libération des fonds. */
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
          throw new Error("Ce compte Pi est déjà lié à un autre compte Arija Connect.");
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
    const email = `pi-${moi.uid}@${DOMAINE_EMAIL_COMPTE}`;
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
      // Le montant vient TOUJOURS de la base (trigger `orders_calculer_commande`), jamais du navigateur.
      const total = commandes.reduce((s, c) => s + Number(c.montant), 0);
      if (commandes.some((c) => c.acheteur_id !== context.userId))
        throw new Error("Utilisateur différent de la commande.");
      if (commandes.some((c) => c.statut !== "en_attente_paiement"))
        throw new Error("Commande non en attente.");
      // Une commande sans ligne (montant 0) ne peut jamais être payée.
      if (commandes.some((c) => Number(c.montant) <= 0)) throw new Error("Montant incorrect.");
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
      // Le montant vient TOUJOURS de la base (triggers `orders_calculer_commande`
      // et `order_items_recalculer_order`), jamais du navigateur.
      const total = commandes.reduce((s, c) => s + Number(c.montant), 0);
      if (commandes.some((c) => Number(c.montant) <= 0)) throw new Error("Montant incorrect.");
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

      const { data: lignesFacture } = await supabaseAdmin
        .from("order_items")
        .select("*")
        .in("order_id", ids);
      const lignesParCommande = new Map<string, LigneItemDb[]>();
      for (const i of (lignesFacture ?? []) as LigneItemDb[]) {
        const liste = lignesParCommande.get(i.order_id);
        if (liste) liste.push(i);
        else lignesParCommande.set(i.order_id, [i]);
      }

      // Transition atomique : seul le premier appel réussit. Le stock n'est
      // décrémenté qu'APRÈS avoir gagné cette transition, afin qu'un nouvel
      // appel (retry réseau) ne puisse pas décrémenter deux fois.
      const maj = await supabaseAdmin
        .from("payments")
        .update({
          statut: "paid_held",
          txid: data.txid,
          paid_held_at: new Date().toISOString(),
          facture: construireFacture(commandes, data.txid, lignesFacture ?? []),
        })
        .eq("id", pay.id)
        .in("statut", ["pending", "approved"])
        .select("id");

      if (!maj.error && maj.data?.length) {
        // Décrément de stock ATOMIQUE. Si une annonce s'est épuisée entre la
        // réservation du panier et la finalisation, la commande concernée part
        // en litige et le paiement entre dans la file « Remboursements à
        // effectuer » : un paiement reçu n'est jamais perdu.
        const commandesEnLitige = new Set<string>();
        for (const cmd of commandes) {
          for (const l of lignesDuCommande(lignesParCommande, cmd)) {
            if (!l.produit_id) continue;
            const { data: stockOk, error: erreurStock } = await supabaseAdmin.rpc(
              "decrementer_stock",
              { _produit: l.produit_id, _qte: l.quantite },
            );
            if (erreurStock) throw new Error("Mise à jour du stock impossible.");
            if (stockOk !== true) commandesEnLitige.add(cmd.id);
          }
        }

        const aRembourser = commandesEnLitige.size > 0;
        if (aRembourser) {
          await supabaseAdmin.from("payments").update({ a_rembourser: true }).eq("id", pay.id);
        }
        // Responsables à prévenir en cas de remboursement nécessaire.
        let admins: { user_id: string }[] = [];
        if (aRembourser) {
          const { data: roles } = await supabaseAdmin
            .from("user_roles")
            .select("user_id")
            .eq("role", "admin");
          admins = (roles as { user_id: string }[] | null) ?? [];
        }
        for (const cmd of commandes) {
          if (commandesEnLitige.has(cmd.id)) {
            const description =
              "Stock épuisé à la finalisation du paiement. Remboursement de l'acheteur à effectuer (fonds reçus, non renvoyés automatiquement).";
            await supabaseAdmin
              .from("orders")
              .update({ statut: "litige" })
              .eq("id", cmd.id)
              .eq("statut", "en_attente_paiement");
            await supabaseAdmin.from("litiges").insert({
              order_id: cmd.id,
              auteur_id: context.userId,
              description,
              statut: "ouvert",
            });
            await supabaseAdmin.from("notifications").insert([
              {
                user_id: cmd.acheteur_id,
                titre: "Remboursement nécessaire",
                contenu: `${resumeCommande(lignesParCommande, cmd)} — annonce épuisée au paiement. Les fonds seront remboursés.`,
                lien: "/portefeuille",
              },
              ...admins.map((a) => ({
                user_id: a.user_id,
                titre: "Remboursement à effectuer",
                contenu: `Commande ${cmd.id.slice(0, 8)}… : stock épuisé, remboursement manuel requis.`,
                lien: "/admin",
              })),
            ]);
            continue;
          }
          await supabaseAdmin
            .from("orders")
            .update({ statut: "payee" })
            .eq("id", cmd.id)
            .eq("statut", "en_attente_paiement");
          const resume = resumeCommande(lignesParCommande, cmd);
          await supabaseAdmin.from("notifications").insert({
            user_id: cmd.vendeur_id,
            titre: "Nouvelle commande payée",
            contenu: resume,
            lien: "/portefeuille",
          });
        }
        journal("complete", {
          paymentId: data.paymentId,
          commandes: ids.length,
          remboursements: commandesEnLitige.size,
          txid: data.txid.slice(0, 12) + "…",
        });
      }
      return { ok: true };
    } catch (e) {
      journal("complete", { paymentId: data.paymentId, erreur: (e as Error).message });
      throw new Error("Finalisation impossible : " + (e as Error).message);
    }
  });

type LigneCommandeDb = {
  id: string;
  titre: string;
  quantite: number;
  unite: string;
  montant: number;
  produit_id?: string | null;
};

type LigneItemDb = {
  order_id: string;
  produit_id: string | null;
  titre: string;
  quantite: number;
  unite: string;
  montant: number;
};

/** Lignes réelles de la commande (`order_items`), sinon l'ancien format à un produit. */
function lignesDuCommande(
  parCommande: Map<string, LigneItemDb[]>,
  cmd: LigneCommandeDb,
): LigneItemDb[] {
  const lignes = parCommande.get(cmd.id);
  if (lignes?.length) return lignes;
  return [
    {
      order_id: cmd.id,
      produit_id: cmd.produit_id ?? null,
      titre: cmd.titre,
      quantite: cmd.quantite,
      unite: cmd.unite,
      montant: Number(cmd.montant),
    },
  ];
}

function resumeCommande(parCommande: Map<string, LigneItemDb[]>, cmd: LigneCommandeDb): string {
  return lignesDuCommande(parCommande, cmd)
    .map((l) => `${l.titre} × ${l.quantite} ${l.unite}`)
    .join(" · ");
}

function construireFacture(commandes: LigneCommandeDb[], txid: string, items: LigneItemDb[]) {
  const parCommande = new Map<string, LigneItemDb[]>();
  for (const i of items) {
    const liste = parCommande.get(i.order_id);
    if (liste) liste.push(i);
    else parCommande.set(i.order_id, [i]);
  }
  const lignes = commandes.flatMap((c) =>
    lignesDuCommande(parCommande, c).map((l) => ({
      libelle: l.titre,
      quantite: l.quantite,
      unite: l.unite,
      montant: Number(l.montant),
    })),
  );
  return {
    numero: `ARIJA-${commandes[0].id.slice(0, 8).toUpperCase()}`,
    date: new Date().toISOString(),
    lignes,
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

/** Le message unique est produit par la fonction SQL `refuser_conflit_interet`
 *  et reconnu par `normaliserErreurServeur` (traduit côté client). */
function verifierConflit(error: { message: string } | null) {
  if (error) throw new Error(normaliserErreurServeur(error.message));
}

export const piRelease = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ paymentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!admin) throw new Error("AdminSeul");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pay } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!pay) throw new Error("Paiement introuvable.");
    if (pay.statut !== "paid_held") throw new Error("Fonds non retenus.");

    const { data: cmd } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", pay.order_id)
      .maybeSingle();
    if (!cmd) throw new Error("Commande introuvable.");

    // 1. Conflit d'intérêt : message unique, identique au traitement des litiges.
    const { error: conflit } = await context.supabase.rpc("refuser_conflit_interet", {
      _acteur: context.userId,
      _acheteur: cmd.acheteur_id,
      _vendeur: cmd.vendeur_id,
    });
    verifierConflit(conflit);

    // 2. Sortie d'escrow : réception confirmée, ou paiement âgé de 72 h sans
    // litige. Horloge explicite : livraison déclarée par le vendeur, sinon
    // date de retenue des fonds — jamais updated_at.
    const reference = cmd.livre_declare_at ?? pay.paid_held_at;
    const recue = cmd.statut === "recue";
    const perime =
      cmd.statut === "payee" &&
      reference !== null &&
      Date.now() - new Date(reference).getTime() > 72 * 3600 * 1000;
    if (cmd.statut === "litige") throw new Error("Libération impossible : litige ouvert.");
    if (!recue && !perime)
      throw new Error("Libération impossible : réception confirmée ou délai de 72 h requis.");

    // 3. Double validation au-dessus du seuil (reglages.seuil_double_validation).
    const { data: reg } = await context.supabase
      .from("reglages")
      .select("valeur")
      .eq("cle", "seuil_double_validation")
      .maybeSingle();
    const seuil = Number((reg?.valeur as number | null) ?? 0);
    if (Number(pay.montant) >= seuil) {
      const { data: attente } = await supabaseAdmin
        .from("liberations_en_attente")
        .select("*")
        .eq("payment_id", pay.id)
        .maybeSingle();
      if (!attente) {
        await supabaseAdmin.from("liberations_en_attente").insert({
          payment_id: pay.id,
          premier_admin: context.userId,
          montant: Number(pay.montant),
        });
        throw new Error(SEUIL_DOUBLE_VALIDATION);
      }
      if (attente.statut === "en_attente") {
        if (attente.premier_admin === context.userId) throw new Error(DEJA_PREMIER_VALIDATEUR);
        await supabaseAdmin
          .from("liberations_en_attente")
          .update({ second_admin: context.userId, statut: "validee" })
          .eq("id", attente.id);
      }
    }

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
    await supabaseAdmin.from("notifications").insert({
      user_id: cmd.vendeur_id,
      titre: "Fonds libérés",
      contenu: `${cmd.titre} — ${Number(pay.montant) - commission} π (commission ${commission} π)`,
      lien: "/portefeuille",
    });
    await supabaseAdmin.rpc("ecrire_audit", {
      _acteur: context.userId,
      _action: "fonds_liberes",
      _cible: pay.id,
      _detail: { montant: Number(pay.montant), commission },
    });
    journal("release", { paymentId: pay.id, commission });
    return { ok: true, commission };
  });

/* ------------------------------------------------------------------ */
/* Remboursement des fonds retenus (espace admin)                      */
/* ------------------------------------------------------------------ */

export const piRefund = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        paymentId: z.string().uuid(),
        /** L'admin certifie avoir effectué le remboursement DANS Pi. */
        confirme: z.boolean().default(false),
        /** Numéro de transaction Pi du remboursement (facultatif). */
        txid: z.string().max(200).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!admin) throw new Error("AdminSeul");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: pay } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (!pay) throw new Error("Paiement introuvable.");
    if (pay.statut === "refunded") return { ok: true, deja: true };
    if (pay.statut !== "paid_held" && !pay.a_rembourser)
      throw new Error("Fonds non retenus : remboursement impossible.");

    const { data: cmd } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", pay.order_id)
      .maybeSingle();
    if (!cmd) throw new Error("Commande introuvable.");
    const { error: conflitRefund } = await context.supabase.rpc("refuser_conflit_interet", {
      _acteur: context.userId,
      _acheteur: cmd.acheteur_id,
      _vendeur: cmd.vendeur_id,
    });
    verifierConflit(conflitRefund);

    // Remboursement NON effectué : on le place dans la file « Remboursements
    // à effectuer ». L'argent n'est PAS renvoyé automatiquement.
    if (!data.confirme) {
      await supabaseAdmin
        .from("payments")
        .update({ a_rembourser: true })
        .eq("id", pay.id)
        .in("statut", ["paid_held", "released"]);
      await supabaseAdmin.from("notifications").insert({
        user_id: cmd.acheteur_id,
        titre: "Remboursement en attente",
        contenu: `${cmd.titre} — ${Number(pay.montant)} π. Le remboursement sera effectué manuellement dans Pi.`,
        lien: "/portefeuille",
      });
      await supabaseAdmin.rpc("ecrire_audit", {
        _acteur: context.userId,
        _action: "remboursement_a_effectuer",
        _cible: pay.id,
        _detail: { montant: Number(pay.montant), order_id: cmd.id },
      });
      journal("refund", { paymentId: pay.id, order: cmd.id, confirme: false });
      return { ok: true, enAttente: true };
    }

    // Confirmé : l'admin a effectué le remboursement dans Pi.
    const { error } = await supabaseAdmin
      .from("payments")
      .update({
        statut: "refunded",
        a_rembourser: false,
        rembourse_le: new Date().toISOString(),
        rembourse_par: context.userId,
        ...(data.txid ? { txid: data.txid } : {}),
      })
      .eq("id", pay.id)
      .in("statut", ["paid_held", "released"]);
    if (error) throw new Error("Remboursement impossible.");
    await supabaseAdmin
      .from("orders")
      .update({ statut: "remboursee" })
      .eq("id", cmd.id)
      .in("statut", ["payee", "recue", "litige"]);
    await supabaseAdmin.from("notifications").insert({
      user_id: cmd.acheteur_id,
      titre: "Remboursement enregistré",
      contenu: `${cmd.titre} — ${Number(pay.montant)} π`,
      lien: "/portefeuille",
    });
    await supabaseAdmin.rpc("ecrire_audit", {
      _acteur: context.userId,
      _action: "fonds_rembourses",
      _cible: pay.id,
      _detail: {
        montant: Number(pay.montant),
        order_id: cmd.id,
        txid: data.txid ?? null,
        confirme: true,
      },
    });
    journal("refund", { paymentId: pay.id, order: cmd.id, confirme: true });
    return { ok: true };
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
