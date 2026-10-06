import { useCallback, useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type NotifLive = {
  id: string;
  icone: string;
  titre: string;
  texte: string;
  date: string;
  lu: boolean;
  lien?: string;
};

const CLE = "bpc-notifications";
let liste: NotifLive[] = [];
const listeners = new Set<() => void>();

function emettre() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CLE, JSON.stringify(liste.slice(0, 50)));
    } catch {
      /* stockage indisponible */
    }
  }
}

function chargerLocal() {
  if (typeof window === "undefined" || liste.length) return;
  try {
    const brut = window.localStorage.getItem(CLE);
    if (brut) liste = JSON.parse(brut) as NotifLive[];
  } catch {
    liste = [];
  }
}

const VIDE: NotifLive[] = [];

function getNotifs() {
  return liste;
}

function getNotifsServer() {
  return VIDE;
}

type NotificationBd = {
  id: string;
  titre: string;
  contenu: string | null;
  lien: string | null;
  lu: boolean;
  created_at: string;
};

export const notifsLive = {
  get: getNotifs,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  /** Remplace la liste par les notifications venant de la base. */
  charger(nouvelles: NotifLive[]) {
    const horsBd = liste.filter((n) => !n.id.startsWith("bd-"));
    liste = [...nouvelles, ...horsBd].slice(0, 50);
    emettre();
  },
  ajouter(n: Omit<NotifLive, "date" | "lu">) {
    if (liste.some((x) => x.id === n.id)) return;
    liste = [{ ...n, date: new Date().toISOString(), lu: false }, ...liste].slice(0, 50);
    emettre();
  },
  toutLire() {
    liste = liste.map((n) => ({ ...n, lu: true }));
    emettre();
  },
};

export function useNotifsLive(): NotifLive[] {
  const getSnapshot = useCallback(getNotifs, []);
  const getServerSnapshot = useCallback(getNotifsServer, []);
  return useSyncExternalStore(notifsLive.subscribe, getSnapshot, getServerSnapshot);
}

export const compterNonLues = (l: NotifLive[]) => l.filter((n) => !n.lu).length;

/** Charge les notifications enregistrées en base et les marque dans le store. */
export async function chargerNotificationsBd(userId: string) {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  const lignes = (data as NotificationBd[] | null) ?? [];
  notifsLive.charger(
    lignes.map((n) => ({
      id: `bd-${n.id}`,
      icone: "🔔",
      titre: n.titre,
      texte: n.contenu ?? "",
      date: n.created_at,
      lu: n.lu,
      lien: n.lien ?? undefined,
    })),
  );
}

/** Marque toutes les notifications (base + direct) comme lues. */
export async function toutLireNotifications(userId: string | undefined) {
  notifsLive.toutLire();
  if (!userId) return;
  await supabase.from("notifications").update({ lu: true }).eq("user_id", userId).eq("lu", false);
}

/**
 * Abonnement temps réel : les membres connectés sont prévenus dès qu'une
 * nouvelle annonce est publiée par la communauté.
 */
export function useAlertesTempsReel(actif: boolean, monId?: string) {
  useEffect(() => {
    chargerLocal();
    if (!actif) return;

    const canal = supabase
      .channel("annonces-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "produits" },
        (payload) => {
          const p = payload.new as { id: string; titre: string; prix: number; vendeur_id: string };
          if (p.vendeur_id === monId) return;
          notifsLive.ajouter({
            id: `produit-${p.id}`,
            icone: "🆕",
            titre: "Nouvelle annonce",
            texte: `${p.titre} — ${Number(p.prix)} π`,
            lien: `/market/${p.id}`,
          });
          toast("🆕 Nouvelle annonce", { description: p.titre });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [actif, monId]);
}
