import { createFileRoute } from "@tanstack/react-router";
import { Bouton, Carte, LienBouton } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { useNotifsLive, compterNonLues, toutLireNotifications } from "@/lib/notifications";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Arija Connect" },
      {
        name: "description",
        content:
          "Candidatures, messages, paiements Pi et nouvelles annonces : suivez toute votre activité en direct.",
      },
      { property: "og:title", content: "Notifications — Arija Connect" },
      { property: "og:description", content: "Centre de notifications de la plateforme." },
    ],
  }),
  component: PageNotifications,
});

function PageNotifications() {
  const t = useT();
  const live = useNotifsLive();
  const { utilisateur } = useSession();
  const total = compterNonLues(live);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("notifications")}</h1>
        <Bouton
          taille="sm"
          variante="contour"
          onClick={() => toutLireNotifications(utilisateur?.id)}
        >
          Tout marquer comme lu {total > 0 && `(${total})`}
        </Bouton>
      </div>

      {!utilisateur && (
        <Carte className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            Connectez-vous pour recevoir les alertes (nouvelles annonces, messages, paiements Pi).
          </p>
          <LienBouton to="/connexion" taille="sm">
            {t("seConnecterPi")}
          </LienBouton>
        </Carte>
      )}

      <div className="space-y-2">
        {live.map((n) => (
          <Carte key={n.id} className="flex gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{n.titre}</p>
              <p className="text-sm text-muted-foreground">{n.texte}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(n.date).toLocaleString("fr-FR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
            {!n.lu && <span className="mt-2 size-2 shrink-0 rounded-full bg-destructive" />}
          </Carte>
        ))}
        {live.length === 0 && (
          <Carte className="text-sm text-muted-foreground">{t("aucuneNotification")}</Carte>
        )}
      </div>
    </div>
  );
}
