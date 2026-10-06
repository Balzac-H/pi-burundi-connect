import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bouton, Carte, Avatar, Saisie, LienBouton } from "@/components/ui-kit";
import { BoutonSignaler } from "@/components/Confiance";
import { chargerProfilCache, ouvrirWhatsApp, type Profil } from "@/lib/comptes";
import { envoyerMessage, marquerLus, messagesAvec, type MessageDb } from "@/lib/messagerie";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { ArrowLeft, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/messages/$id")({
  head: () => ({
    meta: [
      { title: "Chat — WICO" },
      { name: "description", content: "Conversation directe entre membres de la plateforme." },
      { property: "og:title", content: "Chat — WICO" },
      { property: "og:description", content: "Messagerie directe entre membres de la plateforme." },
    ],
  }),
  component: Chat,
});

function Chat() {
  const { id: autreId } = Route.useParams();
  const { utilisateur } = useSession();
  const navigate = useNavigate();
  const [interlocuteur, setInterlocuteur] = useState<Profil | null>(null);
  const [messages, setMessages] = useState<MessageDb[]>([]);
  const [texte, setTexte] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const monId = utilisateur?.id;

  useEffect(() => {
    chargerProfilCache(autreId)
      .then(setInterlocuteur)
      .catch(() => undefined);
  }, [autreId]);

  useEffect(() => {
    if (!monId) return;
    let vivant = true;
    const recharger = () => {
      messagesAvec(monId, autreId)
        .then((m) => {
          if (vivant) setMessages(m);
        })
        .catch(() => undefined);
      marquerLus(monId, autreId).catch(() => undefined);
    };
    recharger();
    const minuteur = window.setInterval(recharger, 5000);
    return () => {
      vivant = false;
      window.clearInterval(minuteur);
    };
  }, [monId, autreId]);

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <p className="font-semibold">Connexion requise</p>
        <p className="text-sm text-muted-foreground">
          Connectez-vous avec Pi pour échanger des messages.
        </p>
        <LienBouton to="/connexion" taille="sm">
          SE CONNECTER
        </LienBouton>
      </Carte>
    );
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!monId) return;
    const propre = texte.trim();
    if (!propre || envoi) return;
    setEnvoi(true);
    try {
      await envoyerMessage(monId, autreId, propre);
      setTexte("");
      const m = await messagesAvec(monId, autreId);
      setMessages(m);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <Carte className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/messages" })} aria-label="Retour">
          <ArrowLeft className="size-5" />
        </button>
        <Avatar emoji={interlocuteur?.photo_url ?? "👤"} taille="sm" />
        <div className="min-w-0 flex-1">
          <Link to="/profil/$id" params={{ id: autreId }} className="block truncate font-semibold">
            {interlocuteur?.nom ?? "…"}
          </Link>
          {interlocuteur?.ville && (
            <p className="truncate text-xs text-muted-foreground">{interlocuteur.ville}</p>
          )}
        </div>
        {interlocuteur?.whatsapp && (
          <Bouton
            taille="sm"
            variante="contour"
            onClick={() =>
              ouvrirWhatsApp(interlocuteur.whatsapp!, `Bonjour ${interlocuteur.nom} 👋`)
            }
          >
            <MessageCircle className="size-4" /> WHATSAPP
          </Bouton>
        )}
      </Carte>

      <div className="space-y-2">
        {messages.map((m) => {
          const moi = m.expediteur_id === monId;
          return (
            <div key={m.id} className={moi ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  moi
                    ? "max-w-[80%] rounded-2xl rounded-br-sm gradient-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[80%] rounded-2xl rounded-bl-sm bg-card px-3 py-2 text-sm shadow-[var(--shadow-card)]"
                }
              >
                <p>{m.contenu}</p>
                <p
                  className={
                    moi
                      ? "mt-1 text-[0.65rem] opacity-80"
                      : "mt-1 text-[0.65rem] text-muted-foreground"
                  }
                >
                  {new Date(m.created_at).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <Carte className="text-center text-sm text-muted-foreground">
            Aucun message. Dites bonjour 👋
          </Carte>
        )}
      </div>

      <form
        className="sticky bottom-20 flex gap-2 rounded-xl bg-card p-2 shadow-[var(--shadow-card)] lg:bottom-4"
        onSubmit={envoyer}
      >
        <Saisie
          placeholder="Saisir un message…"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={500}
        />
        <Bouton type="submit" taille="sm" disabled={envoi}>
          {envoi ? "…" : "Envoyer"}
        </Bouton>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <BoutonSignaler cibleType="profil" cibleId={autreId} utilisateurId={autreId} />
      </div>
    </div>
  );
}
