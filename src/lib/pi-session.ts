import { supabase } from "@/integrations/supabase/client";
import { authentifierPi, type PaymentDTO } from "@/lib/pi";
import { piAuth, piCancel, piComplete } from "@/lib/pi.functions";

async function traiterIncomplet(p: PaymentDTO) {
  try {
    if (p.transaction?.txid)
      await piComplete({ data: { paymentId: p.identifier, txid: p.transaction.txid } });
    else await piCancel({ data: { paymentId: p.identifier } });
  } catch (e) {
    console.error("Paiement incomplet", e);
  }
}

/**
 * Connexion Pi complète : SDK → vérification serveur → session Arija Connect.
 * - `tokenHash` renseigné : session ouverte via lien magique (nouveau membre ou
 *   membre existant sans session).
 * - `tokenHash` null : un compte était déjà connecté, l'identité Pi vient
 *   d'être liée à ce compte, la session existante est conservée.
 */
export async function connexionPi(): Promise<string> {
  const enAttente: PaymentDTO[] = [];
  const { accessToken } = await authentifierPi((p) => enAttente.push(p));
  const { tokenHash, username } = await piAuth({ data: { accessToken } });
  if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
    if (error) throw error;
  } else {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error("Ouverture de session impossible.");
  }
  for (const p of enAttente) await traiterIncomplet(p);
  return username;
}
