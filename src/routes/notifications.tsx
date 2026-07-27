import { createFileRoute } from "@tanstack/react-router";
import { Bouton, Carte } from "@/components/ui-kit";
import { notifications } from "@/lib/data";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — BURUNDI PI CONNECT" },
      { name: "description", content: "Candidatures, messages, paiements Pi et baisses de prix : suivez toute votre activité." },
      { property: "og:title", content: "Notifications — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Centre de notifications de la plateforme." },
    ],
  }),
  component: PageNotifications,
});

function PageNotifications() {
  const nonLues = useStore((s) => s.notificationsNonLues);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-primary">Notifications 🔔</h1>
        <Bouton taille="sm" variante="contour" onClick={() => store.lireNotifications()}>
          Tout marquer comme lu {nonLues > 0 && `(${nonLues})`}
        </Bouton>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Carte key={n.id} className="flex gap-3">
            <span className="text-xl">{n.icone}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.titre}</p>
              <p className="text-sm text-muted-foreground">{n.texte}</p>
              <p className="text-xs text-muted-foreground">{n.temps}</p>
            </div>
            {n.nonLu && nonLues > 0 && <span className="mt-2 size-2 shrink-0 rounded-full bg-destructive" />}
          </Carte>
        ))}
      </div>
    </div>
  );
}
