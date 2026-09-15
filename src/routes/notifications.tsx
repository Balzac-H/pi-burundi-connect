import { createFileRoute } from "@tanstack/react-router";
import { Bouton, Carte, LienBouton } from "@/components/ui-kit";
import { notifications } from "@/lib/data";
import { store, useStore } from "@/lib/store";
import { useSession } from "@/lib/auth";
import { notifsLive, useNotifsLive, compterNonLues } from "@/lib/notifications";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — WICO" },
      { name: "description", content: "Candidatures, messages, paiements Pi et nouvelles annonces : suivez toute votre activité en direct." },
      { property: "og:title", content: "Notifications — WICO" },
      { property: "og:description", content: "Centre de notifications de la plateforme." },
    ],
  }),
  component: PageNotifications,
});

function PageNotifications() {
  const nonLues = useStore((s) => s.notificationsNonLues);
  const live = useNotifsLive();
  const { utilisateur } = useSession();
  const total = nonLues + compterNonLues(live);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-primary">Notifications 🔔</h1>
        <Bouton
          taille="sm"
          variante="contour"
          onClick={() => {
            store.lireNotifications();
            notifsLive.toutLire();
          }}
        >
          Tout marquer comme lu {total > 0 && `(${total})`}
        </Bouton>
      </div>

      {!utilisateur && (
        <Carte className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Créez un compte pour recevoir les alertes en direct (nouvelles annonces, messages, paiements Pi).
          </p>
          <LienBouton to="/connexion" taille="sm">CRÉER UN COMPTE</LienBouton>
        </Carte>
      )}

      <div className="space-y-2">
        {live.map((n) => (
          <Carte key={n.id} className="flex gap-3">
            <span className="text-xl">{n.icone}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.titre}</p>
              <p className="text-sm text-muted-foreground">{n.texte}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(n.date).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
              </p>
            </div>
            {!n.lu && <span className="mt-2 size-2 shrink-0 rounded-full bg-destructive" />}
          </Carte>
        ))}

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

