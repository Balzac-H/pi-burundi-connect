import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { demanderAssistant } from "@/lib/assistant.functions";
import { useLangue } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "assistant"; content: string };

const textes = {
  fr: {
    titre: "Assistant Arija Connect",
    accueil:
      "Bonjour, je suis l'assistant d'Arija Connect. Comment puis-je vous aider ? Vous cherchez un produit, un service ou un emploi ?",
    avertissement:
      "Ne partagez jamais d'informations personnelles : mot de passe, phrase secrète, code de validation ou numéro de téléphone.",
    placeholder: "Écrivez votre question…",
    envoyez: "Envoyer",
    ouvrir: "Ouvrir l'assistant",
    fermer: "Fermer l'assistant",
  },
  rn: {
    titre: "Umufasha Arija Connect",
    accueil:
      "Bwakeye, ndi umufasha w'Arija Connect. Nogufasha gute ? Urondera igicuruzwa, serivisi canke akazi ?",
    avertissement:
      "Ntuze utange amakuru bwite : ijambobanga, ijambo ry'ibanga, kode yo kwemeza canke nimero ya telefone.",
    placeholder: "Andika ikibazo cawe…",
    envoyez: "Ohereza",
    ouvrir: "Fungura umufasha",
    fermer: "Ugara umufasha",
  },
  sw: {
    titre: "Msaidizi Arija Connect",
    accueil:
      "Habari, mimi ni msaidizi wa Arija Connect. Nikusaidie vipi ? Unatafuta bidhaa, huduma au kazi ?",
    avertissement:
      "Usishiriki taarifa za kibinafsi : nenosiri, neno la siri, msimbo wa uthibitisho au namba ya simu.",
    placeholder: "Andika swali lako…",
    envoyez: "Tuma",
    ouvrir: "Fungua msaidizi",
    fermer: "Funga msaidizi",
  },
  en: {
    titre: "Arija Connect Assistant",
    accueil:
      "Hello, I'm the Arija Connect assistant. How can I help? Looking for a product, a service or a job?",
    avertissement:
      "Never share personal information: password, passphrase, verification code or phone number.",
    placeholder: "Type your question…",
    envoyez: "Send",
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

          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            {t.avertissement}
          </p>

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
              {t.envoyez}
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
