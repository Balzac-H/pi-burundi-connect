import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, X, Send, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { demanderAssistant } from "@/lib/assistant.functions";
import { useLangue } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const textes = {
  fr: {
    titre: "Assistant WICO",
    accueil:
      "Bonjour 👋 Je suis l'assistant WICO. Comment puis-je vous aider ? Vous cherchez un produit, un service ou un emploi ?",
    placeholder: "Écrivez votre question…",
    ouvrir: "Ouvrir l'assistant",
    fermer: "Fermer l'assistant",
  },
  rn: {
    titre: "Umufasha WICO",
    accueil:
      "Bwakeye 👋 Ndi umufasha wa WICO. Nogufasha gute ? Urondera igicuruzwa, serivisi canke akazi ?",
    placeholder: "Andika ikibazo cawe…",
    ouvrir: "Fungura umufasha",
    fermer: "Ugara umufasha",
  },
  sw: {
    titre: "Msaidizi WICO",
    accueil:
      "Habari 👋 Mimi ni msaidizi wa WICO. Nikusaidie vipi ? Unatafuta bidhaa, huduma au kazi ?",
    placeholder: "Andika swali lako…",
    ouvrir: "Fungua msaidizi",
    fermer: "Funga msaidizi",
  },
  en: {
    titre: "WICO Assistant",
    accueil:
      "Hello 👋 I'm the WICO assistant. How can I help? Looking for a product, a service or a job?",
    placeholder: "Type your question…",
    ouvrir: "Open assistant",
    fermer: "Close assistant",
  },
} as const;

export function AssistantWico() {
  const langue = useLangue();
  const t = textes[langue] ?? textes.fr;
  const [ouvert, setOuvert] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [saisie, setSaisie] = useState("");
  const [enCours, setEnCours] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const appeler = useServerFn(demanderAssistant);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ouvert, enCours]);

  async function envoyer() {
    const texte = saisie.trim();
    if (!texte || enCours) return;
    const suite: Message[] = [...messages, { role: "user", content: texte }];
    setMessages(suite);
    setSaisie("");
    setEnCours(true);
    try {
      const res = await appeler({ data: { messages: suite.slice(-20) } });
      setMessages([...suite, { role: "assistant", content: res.reponse }]);
    } catch {
      setMessages([
        ...suite,
        {
          role: "assistant",
          content: "Connexion indisponible. Réessayez quand le réseau revient.",
        },
      ]);
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-label={ouvert ? t.fermer : t.ouvrir}
        className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full gradient-primary text-primary-foreground shadow-lg transition hover:scale-105 lg:bottom-6"
      >
        {ouvert ? <X className="size-6" /> : <MessageCircleQuestion className="size-6" />}
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-label={t.titre}
          className="fixed bottom-36 right-4 z-40 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl lg:bottom-24"
        >
          <div className="flex items-center gap-2 border-b border-border/60 gradient-primary px-3 py-2 text-primary-foreground">
            <span className="grid size-7 place-items-center rounded-lg bg-black/15 text-sm font-bold">
              W
            </span>
            <p className="text-sm font-bold">{t.titre}</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            <Bulle role="assistant">{t.accueil}</Bulle>
            {messages.map((m, i) => (
              <Bulle key={i} role={m.role}>
                {m.content}
              </Bulle>
            ))}
            {enCours && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> …
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-border/60 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void envoyer();
            }}
          >
            <input
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              maxLength={500}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              className="min-h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
            />
            <button
              type="submit"
              disabled={enCours || !saisie.trim()}
              aria-label="Envoyer"
              className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bulle({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm",
        role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-foreground",
      )}
    >
      {typeof children === "string" ? nettoyer(children) : children}
    </div>
  );
}

/** Retire le balisage Markdown pour un affichage lisible en clair. */
function nettoyer(texte: string) {
  return texte
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^\s*\*\s+/gm, "• ")
    .replace(/^#{1,6}\s*/gm, "")
    .trim();
}
