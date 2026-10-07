import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Carte, Saisie, Avatar } from "@/components/ui-kit";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { listerConversations, type Conversation } from "@/lib/messagerie";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { BesoinCompte } from "@/components/BesoinCompte";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — Arija" },
      {
        name: "description",
        content:
          "Discutez avec les employeurs, vendeurs et clients directement dans l'application.",
      },
      { property: "og:title", content: "Messages — Arija" },
      {
        property: "og:description",
        content: "Toutes vos conversations jobs et market au même endroit.",
      },
    ],
  }),
  component: ListeMessagesProtege,
});

function ListeMessages() {
  const t = useT();
  const { utilisateur } = useSession();
  const [recherche, setRecherche] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profils, setProfils] = useState<Record<string, Profil | null>>({});

  useEffect(() => {
    if (!utilisateur?.id) return;
    let vivant = true;
    listerConversations(utilisateur.id)
      .then(async (c) => {
        if (!vivant) return;
        setConversations(c);
        const p = await Promise.all(c.map((x) => chargerProfilCache(x.utilisateurId)));
        if (vivant) {
          setProfils(Object.fromEntries(c.map((x, i) => [x.utilisateurId, p[i]])));
        }
      })
      .catch(() => undefined);
    const minuteur = window.setInterval(() => {
      listerConversations(utilisateur.id)
        .then(setConversations)
        .catch(() => undefined);
    }, 8000);
    return () => {
      vivant = false;
      window.clearInterval(minuteur);
    };
  }, [utilisateur?.id]);

  const liste = conversations.filter((c) =>
    ((profils[c.utilisateurId]?.nom ?? "") + c.dernierMessage)
      .toLowerCase()
      .includes(recherche.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("chat")}</h1>
      </div>

      <Saisie
        placeholder={t("rechercherPlaceholder")}
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        maxLength={80}
      />

      <div className="space-y-2">
        {liste.map((c) => {
          const u = profils[c.utilisateurId];
          return (
            <Link key={c.utilisateurId} to="/messages/$id" params={{ id: c.utilisateurId }}>
              <Carte className="flex items-center gap-3">
                <Avatar emoji={u?.photo_url ?? undefined} nom={u?.nom ?? undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{u?.nom ?? "…"}</p>
                    {c.nonLu > 0 && <span className="size-2 rounded-full bg-destructive" />}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {new Date(c.date).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">« {c.dernierMessage} »</p>
                </div>
              </Carte>
            </Link>
          );
        })}
        {liste.length === 0 && (
          <Carte className="text-sm text-muted-foreground">{t("aucuneConversation")}</Carte>
        )}
      </div>
    </div>
  );
}

function ListeMessagesProtege() {
  const t = useT();
  return (
    <BesoinCompte titre={t("chat")}>
      <ListeMessages />
    </BesoinCompte>
  );
}
