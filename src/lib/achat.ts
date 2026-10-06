import { supabase } from "@/integrations/supabase/client";
import { creerPaiementPi, piDisponible, piPaiementAutorise } from "@/lib/pi";
import { connexionPi } from "@/lib/pi-session";
import { piApprove, piCancel, piComplete } from "@/lib/pi.functions";
import type { ProduitDb } from "@/lib/comptes";

export type ResultatAchat = { ok: true; orderId: string } | { ok: false; erreur: string; annule?: boolean };

/** Achat d'une annonce : commande en base → paiement Pi → approbation/finalisation serveur. */
export async function acheterAvecPi(produit: ProduitDb & { quantite_min?: number }, quantite: number): Promise<ResultatAchat> {
  if (!piDisponible()) return { ok: false, erreur: "Ouvrez WICO dans le Pi Browser pour payer en Pi." };
  const { data: s } = await supabase.auth.getSession();
  if (!s.session || !piPaiementAutorise()) await connexionPi();
  const { data: s2 } = await supabase.auth.getSession();
  const uid = s2.session?.user.id;
  if (!uid) return { ok: false, erreur: "Connexion Pi requise." };
  if (uid === produit.vendeur_id) return { ok: false, erreur: "Vous ne pouvez pas acheter votre propre annonce." };

  const min = produit.quantite_min ?? 1;
  if (quantite < min || quantite > produit.stock) return { ok: false, erreur: `Quantité entre ${min} et ${produit.stock} ${produit.unite}.` };

  const montant = Math.round(produit.prix * quantite * 1e7) / 1e7;
  const { data: cmd, error } = await supabase.from("orders").insert({
    acheteur_id: uid, vendeur_id: produit.vendeur_id, produit_id: produit.id,
    titre: produit.titre, quantite, unite: produit.unite, montant,
  }).select("id").single();
  if (error || !cmd) return { ok: false, erreur: "Création de la commande impossible." };

  return new Promise<ResultatAchat>((resolve) => {
    try {
      creerPaiementPi(
        { amount: montant, memo: `WICO : ${produit.titre} × ${quantite}`.slice(0, 100), metadata: { orderId: cmd.id } },
        {
          onReadyForServerApproval: (paymentId) => {
            piApprove({ data: { paymentId } }).catch((e) => resolve({ ok: false, erreur: (e as Error).message }));
          },
          onReadyForServerCompletion: (paymentId, txid) => {
            piComplete({ data: { paymentId, txid } })
              .then(() => resolve({ ok: true, orderId: cmd.id }))
              .catch((e) => resolve({ ok: false, erreur: (e as Error).message }));
          },
          onCancel: (paymentId) => {
            piCancel({ data: { paymentId, orderId: cmd.id } }).finally(() => resolve({ ok: false, erreur: "Paiement annulé.", annule: true }));
          },
          onError: (err, payment) => {
            console.error("Erreur paiement Pi", err, payment);
            piCancel({ data: { paymentId: payment?.identifier, orderId: cmd.id } }).finally(() =>
              resolve({ ok: false, erreur: err?.message || "Erreur de paiement." }));
          },
        },
      );
    } catch (e) {
      resolve({ ok: false, erreur: (e as Error).message });
    }
  });
}
