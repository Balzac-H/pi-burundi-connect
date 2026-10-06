import { supabase } from "@/integrations/supabase/client";
import { creerPaiementPi, piDisponible, piPaiementAutorise } from "@/lib/pi";
import { connexionPi } from "@/lib/pi-session";
import { piApprove, piCancel, piComplete } from "@/lib/pi.functions";
import type { ProduitDb } from "@/lib/comptes";

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
          memo: `WICO : ${l.titre} × ${l.quantite}`.slice(0, 100),
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

/** Création de la commande en base, avant paiement. */
export async function creerCommande(valeurs: {
  acheteurId: string;
  vendeurId: string;
  produitId?: string;
  titre: string;
  quantite: number;
  unite: string;
  montant: number;
}): Promise<{ orderId: string } | { erreur: string }> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      acheteur_id: valeurs.acheteurId,
      vendeur_id: valeurs.vendeurId,
      produit_id: valeurs.produitId ?? null,
      titre: valeurs.titre,
      quantite: valeurs.quantite,
      unite: valeurs.unite,
      montant: valeurs.montant,
    })
    .select("id")
    .single();
  if (error || !data) return { erreur: "Création de la commande impossible." };
  return { orderId: data.id };
}

/** Achat immédiat d'une annonce : commande → paiement Pi. */
export async function acheterAvecPi(produit: ProduitDb, quantite: number): Promise<ResultatAchat> {
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) return { ok: false, code: "NON_CONNECTE", erreur: "Connexion requise." };
  if (uid === produit.vendeur_id)
    return { ok: false, code: "ERREUR", erreur: "Vente impossible : c'est votre annonce." };

  const min = Math.max(1, produit.quantite_min ?? 1);
  if (quantite < min || quantite > produit.stock)
    return {
      ok: false,
      code: "ERREUR",
      erreur: `Quantité entre ${min} et ${produit.stock} ${produit.unite}.`,
    };

  const montant = Math.round(produit.prix * quantite * 1e7) / 1e7;
  const commande = await creerCommande({
    acheteurId: uid,
    vendeurId: produit.vendeur_id,
    produitId: produit.id,
    titre: produit.titre,
    quantite,
    unite: produit.unite,
    montant,
  });
  if ("erreur" in commande) return { ok: false, code: "ERREUR", erreur: commande.erreur };

  return payerAvecPi([
    {
      orderId: commande.orderId,
      titre: produit.titre,
      montant,
      vendeurId: produit.vendeur_id,
      produitId: produit.id,
      quantite,
    },
  ]);
}
