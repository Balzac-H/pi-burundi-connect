import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Carte, Avatar, Note, Distance, Saisie, LienBouton } from "@/components/ui-kit";
import { parConversation, parUtilisateur } from "@/lib/data";
import { bientotDisponible } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/messages/$id")({
  head: ({ params }) => {
    const c = parConversation(params.id);
    const nom = c ? parUtilisateur(c.utilisateurId).nom : "Conversation";
    return {
      meta: [
        { title: `Chat avec ${nom} — BURUNDI PI CONNECT` },
        { name: "description", content: c ? `Conversation ${c.contexte} avec ${nom}.` : "Conversation introuvable." },
        { property: "og:title", content: `Chat avec ${nom} — BURUNDI PI CONNECT` },
        { property: "og:description", content: "Messagerie directe entre membres de la plateforme." },
      ],
    };
  },
  component: Chat,
});

function Chat() {
  const { id } = Route.useParams();
  const conv = parConversation(id);
  const navigate = useNavigate();
  const [messages, setMessages] = useState(conv?.messages ?? []);
  const [texte, setTexte] = useState("");

  if (!conv) {
    return (
      <Carte className="text-center">
        <p className="font-semibold">Conversation introuvable.</p>
        <LienBouton to="/messages" taille="sm" className="mt-3">Retour aux messages</LienBouton>
      </Carte>
    );
  }

  const u = parUtilisateur(conv.utilisateurId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <Carte className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/messages" })} aria-label="Retour"><ArrowLeft className="size-5" /></button>
        <Avatar emoji={u.emoji} taille="sm" />
        <div className="min-w-0 flex-1">
          <Link to="/profil/$id" params={{ id: u.id }} className="block truncate font-semibold">{u.nom}</Link>
          <div className="flex gap-2"><Note note={u.note} /><Distance km={u.distanceKm} /></div>
        </div>
        <Bouton taille="sm" variante="contour" onClick={() => bientotDisponible("Les appels vocaux")}>APPELER</Bouton>
      </Carte>

      <p className="text-center text-xs text-muted-foreground">{conv.contexte}</p>

      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.moi ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                m.moi
                  ? "max-w-[80%] rounded-2xl rounded-br-sm gradient-primary px-3 py-2 text-sm text-primary-foreground"
                  : "max-w-[80%] rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm shadow-[var(--shadow-card)]"
              }
            >
              <p>{m.texte}</p>
              <p className={m.moi ? "mt-1 text-[0.65rem] opacity-80" : "mt-1 text-[0.65rem] text-muted-foreground"}>{m.temps}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        className="sticky bottom-20 flex gap-2 rounded-xl bg-card p-2 shadow-[var(--shadow-card)] lg:bottom-4"
        onSubmit={(e) => {
          e.preventDefault();
          const propre = texte.trim();
          if (!propre) return;
          setMessages([...messages, { moi: true, texte: propre, temps: "à l'instant" }]);
          setTexte("");
        }}
      >
        <Saisie placeholder="Saisir un message…" value={texte} onChange={(e) => setTexte(e.target.value)} maxLength={500} />
        <Bouton type="submit" taille="sm">Envoyer</Bouton>
      </form>

      <div className="flex flex-wrap gap-2">
        <Bouton variante="contour" taille="sm" onClick={() => bientotDisponible("Le partage de conversation")}>PARTAGER</Bouton>
        <Bouton variante="danger" taille="sm" onClick={() => bientotDisponible("Le signalement")}>SIGNALER</Bouton>
        <Bouton variante="danger" taille="sm" onClick={() => bientotDisponible("Le blocage")}>BLOQUER</Bouton>
      </div>
    </div>
  );
}
