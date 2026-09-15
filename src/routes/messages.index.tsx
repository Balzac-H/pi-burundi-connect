import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Carte, Saisie, Avatar, Bouton } from "@/components/ui-kit";
import { conversations, parUtilisateur } from "@/lib/data";
import { bientotDisponible } from "@/lib/utils";
import { BesoinCompte } from "@/components/BesoinCompte";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — WICO" },
      { name: "description", content: "Discutez avec les employeurs, vendeurs et clients directement dans l'application." },
      { property: "og:title", content: "Messages — WICO" },
      { property: "og:description", content: "Toutes vos conversations jobs et market au même endroit." },
    ],
  }),
  component: ListeMessagesProtege,
});

function ListeMessages() {
  const [recherche, setRecherche] = useState("");
  const liste = conversations.filter((c) =>
    (parUtilisateur(c.utilisateurId).nom + c.apercu).toLowerCase().includes(recherche.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-primary">MESSAGES 💬</h1>
        <Bouton taille="sm" variante="secondaire" onClick={() => bientotDisponible("La création de nouvelle conversation")}>NOUVEAU</Bouton>
      </div>

      <Saisie placeholder="Rechercher une conversation…" value={recherche} onChange={(e) => setRecherche(e.target.value)} maxLength={80} />

      <div className="space-y-2">
        {liste.map((c) => {
          const u = parUtilisateur(c.utilisateurId);
          return (
            <Link key={c.id} to="/messages/$id" params={{ id: c.id }}>
              <Carte className="flex items-center gap-3">
                <Avatar emoji={u.emoji} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{u.nom}</p>
                    {c.nonLu && <span className="size-2 rounded-full bg-destructive" />}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{c.temps}</span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">« {c.apercu} »</p>
                  <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs">{c.contexte}</p>
                </div>
              </Carte>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ListeMessagesProtege() {
  return (
    <BesoinCompte titre="Mes messages">
      <ListeMessages />
    </BesoinCompte>
  );
}
