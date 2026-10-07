import { supabase } from "@/integrations/supabase/client";
import { creerPaiementPi, piDisponible, piPaiementAutorise } from "@/lib/pi";
import { connexionPi } from "@/lib/pi-session";
import { piApprove, piCancel, piComplete } from "@/lib/pi.functions";

export type CodeAchat = "PI_ABSENT" | "NON_CONNECTE" | "ANNULE" | "ERREUR";

export type ResultatAchat =
  | { ok: true; payes: string[]; echecs: { orderId: string; code: CodeAchat; erreur: string }[] }
  | { ok: false; code: CodeAchat; erreur: string };

export type LigneAPayer = {
  orderId: string;
  titre: string;
  montant: number;
  vendeurId: string;
  produitId?: string;
  quantite: number;
};

/** Séquence : session Pi → commande(s) en base → un paiement Pi par commande. */
export async function payerAvecPi(lignes: LigneAPayer[]): Promise<ResultatAchat> {
  if (enCours) return { ok: false, code: "ERREUR", erreur: "Paiement déjà en cours." };
  enCours = true;
  try {
    if (!piDisponible()) return { ok: false, code: "PI_ABSENT", erreur: "Pi Browser requis." };
    const { data: s } = await supabase.auth.getSession();
    if (!s.session || !piPaiementAutorise()) await connexionPi();
    const { data: s2 } = await supabase.auth.getSession();
    if (!s2.session) return { ok: false, code: "NON_CONNECTE", erreur: "Connexion Pi requise." };

    const payes: string[] = [];
    const echecs: { orderId: string; code: CodeAchat; erreur: string }[] = [];
    for (const l of lignes) {
      const r = await payerUneCommande(l);
      if (r.ok) payes.push(l.orderId);
      else echecs.push({ orderId: l.orderId, code: r.code, erreur: r.erreur });
    }
    if (payes.length) return { ok: true, payes, echecs };
    return {
      ok: false,
      code: echecs[0]?.code ?? "ERREUR",
      erreur: echecs[0]?.erreur ?? "Paiement impossible.",
    };
  } finally {
    enCours = false;
  }
}

let enCours = false;

/** Un paiement Pi par commande (payments.order_id est NOT NULL). */
function payerUneCommande(
  l: LigneAPayer,
): Promise<{ ok: true } | { ok: false; code: CodeAchat; erreur: string }> {
  return new Promise((resolve) => {
    let resolu = false;
    const finir = (r: { ok: true } | { ok: false; code: CodeAchat; erreur: string }) => {
      if (resolu) return;
      resolu = true;
      resolve(r);
    };
    try {
      creerPaiementPi(
        {
          amount: l.montant,
          memo: `Arija : ${l.titre} × ${l.quantite}`.slice(0, 100),
          metadata: { orderId: l.orderId },
        },
        {
          onReadyForServerApproval: (paymentId) => {
            piApprove({ data: { paymentId } }).catch((e) =>
              finir({ ok: false, code: "ERREUR", erreur: (e as Error).message }),
            );
          },
          onReadyForServerCompletion: (paymentId, txid) => {
            piComplete({ data: { paymentId, txid } })
              .then(() => finir({ ok: true }))
              .catch((e) => finir({ ok: false, code: "ERREUR", erreur: (e as Error).message }));
          },
          onCancel: () => {
            piCancel({ data: { orderId: l.orderId } }).finally(() =>
              finir({ ok: false, code: "ANNULE", erreur: "Paiement annulé." }),
            );
          },
          onError: (err, payment) => {
            console.error("Erreur paiement Pi", err, payment);
            piCancel({ data: { paymentId: payment?.identifier, orderId: l.orderId } }).finally(() =>
              finir({ ok: false, code: "ERREUR", erreur: err?.message || "Erreur de paiement." }),
            );
          },
        },
      );
    } catch (e) {
      finir({ ok: false, code: "ERREUR", erreur: (e as Error).message });
    }
  });
}

/** Une commande créée en base : montant, titre, unité et vendeur sont
 *  DÉFINIS PAR LA BASE (triggers `orders_calculer_commande` et
 *  `order_items_calculer_ligne`), jamais par le navigateur. On les relit
 *  via RETURNING. Une commande = UN vendeur. */
export type CommandeCreee = {
  orderId: string;
  montant: number;
  titre: string;
  unite: string;
  vendeurId: string;
  produitId: string | null;
  quantite: number;
};

type RetourLigne = {
  id: string;
  montant: number;
  titre: string;
  unite: string;
  vendeur_id: string;
  produit_id: string | null;
  quantite: number;
};

function versCommande(d: RetourLigne): CommandeCreee {
  return {
    orderId: d.id,
    montant: Number(d.montant),
    titre: d.titre,
    unite: d.unite,
    vendeurId: d.vendeur_id,
    produitId: d.produit_id,
    quantite: d.quantite,
  };
}

/**
 * Crée UNE COMMANDE PAR VENDEUR à partir des lignes du panier.
 * Le regroupement, les stocks, la quantité minimale, l'auto-achat et les
 * montants sont vérifiés côté base (RPC `creer_commandes`).
 */
export async function creerCommandes(valeurs: {
  acheteurId: string;
  lignes: { produitId: string; quantite: number }[];
}): Promise<{ commandes: CommandeCreee[] } | { erreur: string }> {
  if (!valeurs.lignes.length) return { erreur: "Panier vide." };
  const { data, error } = await supabase.rpc("creer_commandes", {
    _lignes: valeurs.lignes.map((l) => ({
      produit_id: l.produitId,
      quantite: l.quantite,
    })),
  });
  if (error || !data?.length) {
    return { erreur: error?.message ?? "Création de la commande impossible." };
  }
  return { commandes: (data as unknown as RetourLigne[]).map(versCommande) };
}

/** Compatibilité : une commande, un seul produit. */
export async function creerCommande(valeurs: {
  acheteurId: string;
  produitId: string;
  quantite: number;
}): Promise<{ commande: CommandeCreee } | { erreur: string }> {
  const r = await creerCommandes({
    acheteurId: valeurs.acheteurId,
    lignes: [{ produitId: valeurs.produitId, quantite: valeurs.quantite }],
  });
  if ("erreur" in r) return { erreur: r.erreur };
  if (!r.commandes.length) return { erreur: "Création de la commande impossible." };
  return { commande: r.commandes[0] };
}
