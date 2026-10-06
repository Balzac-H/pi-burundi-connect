import { supabase } from "@/integrations/supabase/client";

export type MessageDb = {
  id: string;
  expediteur_id: string;
  destinataire_id: string;
  contenu: string;
  lu: boolean;
  created_at: string;
};

export type Conversation = {
  utilisateurId: string;
  dernierMessage: string;
  date: string;
  nonLu: number;
};

/** Toutes les conversations de l'utilisateur, groupées par interlocuteur. */
export async function listerConversations(monId: string): Promise<Conversation[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`expediteur_id.eq.${monId},destinataire_id.eq.${monId}`)
    .order("created_at", { ascending: false })
    .limit(500);
  const messages = (data as MessageDb[] | null) ?? [];
  const map = new Map<string, Conversation>();
  for (const m of messages) {
    const autre = m.expediteur_id === monId ? m.destinataire_id : m.expediteur_id;
    const existant = map.get(autre);
    const nonLu = (existant?.nonLu ?? 0) + (m.destinataire_id === monId && !m.lu ? 1 : 0);
    if (!existant) {
      map.set(autre, {
        utilisateurId: autre,
        dernierMessage: m.contenu,
        date: m.created_at,
        nonLu,
      });
    } else {
      // le plus récent est en premier dans la liste triée
      existant.nonLu = nonLu;
    }
  }
  return [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Historique complet d'une conversation. */
export async function messagesAvec(monId: string, autreId: string): Promise<MessageDb[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(
      `and(expediteur_id.eq.${monId},destinataire_id.eq.${autreId}),and(expediteur_id.eq.${autreId},destinataire_id.eq.${monId})`,
    )
    .order("created_at", { ascending: true })
    .limit(500);
  return (data as MessageDb[] | null) ?? [];
}

export async function envoyerMessage(de: string, vers: string, contenu: string) {
  const texte = contenu.trim().slice(0, 1000);
  if (!texte) throw new Error("Message vide.");
  const { error } = await supabase
    .from("messages")
    .insert({ expediteur_id: de, destinataire_id: vers, contenu: texte });
  if (error) throw error;
}

/** Marque comme lus les messages reçus de `autreId`. */
export async function marquerLus(monId: string, autreId: string) {
  await supabase
    .from("messages")
    .update({ lu: true })
    .eq("destinataire_id", monId)
    .eq("expediteur_id", autreId)
    .eq("lu", false);
}
