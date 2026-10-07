import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { demanderAssistant } from "@/lib/assistant.functions";
import { useLangue } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const textes = {
  fr: {
    titre: "Assistant Arija",
    accueil:
      "Bonjour, je suis l'assistant d'Arija. Comment puis-je vous aider ? Vous cherchez un produit, un service ou un emploi ?",
    placeholder: "Écrivez votre question…",
    ouvrir: "Ouvrir l'assistant",
    fermer: "Fermer l'assistant",
  },
  rn: {
    titre: "Umufasha Arija",
    accueil:
      "Bwakeye, ndi umufasha w'Arija. Nogufasha gute ? Urondera igicuruzwa, serivisi canke akazi ?",
    placeholder: "Andika ikibazo cawe…",
    ouvrir: "Fungura umufasha",
    fermer: "Ugara umufasha",
  },
  sw: {
    titre: "Msaidizi Arija",
    accueil:
      "Habari, mimi ni msaidizi wa Arija. Nikusaidie vipi ? Unatafuta bidhaa, huduma au kazi ?",
    placeholder: "Andika swali lako…",
    ouvrir: "Fungua msaidizi",
    fermer: "Funga msaidizi",
  },
  en: {
    titre: "Arija Assistant",
    accueil:
      "Hello, I'm the Arija assistant. How can I help? Looking for a product, a service or a job?",
    placeholder: "Type your question…",
    ouvrir: "Open assistant",
    fermer: "Close assistant",
  },
} as const;

export function AssistantArija() {
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
        className="fixed bottom-20 right-4 z-40 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg transition-colors duration-150 hover:bg-primary/90 lg:bottom-6"
      >
        {ouvert ? t.fermer : t.ouvrir}
      </button>

      {ouvert && (
        <div
          role="dialog"
          aria-label={t.titre}
          className="fixed bottom-36 right-4 z-40 flex max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg lg:bottom-24"
        >
          <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
            <p className="text-sm font-semibold text-foreground">{t.titre}</p>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            <Bulle role="assistant">{t.accueil}</Bulle>
            {messages.map((m, i) => (
              <Bulle key={i} role={m.role}>
                {m.content}
              </Bulle>
            ))}
            {enCours && <p className="text-xs text-muted-foreground">…</p>}
            <div ref={finRef} />
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-2"
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
              className="min-h-11 flex-1 rounded-md border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors duration-150 focus:border-primary"
            />
            <button
              type="submit"
              disabled={enCours || !saisie.trim()}
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
            >
              Envoyer
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
