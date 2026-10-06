import { useState } from "react";
import { BadgeCheck, Flag, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Bouton, Champ, Selection, Zone } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { raisonsSignalement, signaler, type CibleType, type Raison } from "@/lib/annonces";
import { definirTheme, useTheme } from "@/lib/theme";

/** Badge affiché uniquement si l'email ou le téléphone du membre est confirmé. */
export function BadgeVerifie({ verifie }: { verifie: boolean }) {
  if (!verifie) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success"
      title="Email ou téléphone confirmé"
    >
      <BadgeCheck className="size-3.5" /> Vérifié
    </span>
  );
}

export function BoutonSignaler({
  cibleType,
  cibleId,
  utilisateurId,
  compact,
}: {
  cibleType: CibleType;
  cibleId: string;
  utilisateurId: string;
  compact?: boolean;
}) {
  const { utilisateur } = useSession();
  const [ouvert, setOuvert] = useState(false);
  const [raison, setRaison] = useState<Raison>("arnaque");
  const [details, setDetails] = useState("");
  const [envoi, setEnvoi] = useState(false);

  if (utilisateur?.id === utilisateurId) return null;

  async function envoyer() {
    if (!utilisateur) return;
    setEnvoi(true);
    try {
      await signaler({
        auteur_id: utilisateur.id,
        utilisateur_signale_id: utilisateurId,
        cible_type: cibleType,
        cible_id: cibleId,
        raison,
        details,
      });
      toast.success("Merci, votre signalement a été transmis à l'équipe WICO.");
      setOuvert(false);
      setDetails("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du signalement.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
        aria-label="Signaler"
      >
        <Flag className="size-3.5" /> {!compact && "Signaler"}
      </button>
      {ouvert && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4"
          onClick={() => setOuvert(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Signaler"
            className="card-surface w-full max-w-sm space-y-3 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">
              Signaler {cibleType === "profil" ? "ce membre" : "cette annonce"}
            </h2>
            {!utilisateur ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous pour envoyer un signalement.
                </p>
                <Link to="/connexion" className="font-semibold text-accent">
                  Se connecter
                </Link>
              </>
            ) : (
              <>
                <Champ label="Raison" obligatoire>
                  <Selection value={raison} onChange={(e) => setRaison(e.target.value as Raison)}>
                    {raisonsSignalement.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.nom}
                      </option>
                    ))}
                  </Selection>
                </Champ>
                <Champ label="Précisions (facultatif)">
                  <Zone
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    maxLength={500}
                    placeholder="Que s'est-il passé ?"
                  />
                </Champ>
                <div className="flex gap-2">
                  <Bouton variante="danger" taille="sm" disabled={envoi} onClick={envoyer}>
                    {envoi ? "Envoi…" : "Envoyer"}
                  </Bouton>
                  <Bouton variante="contour" taille="sm" onClick={() => setOuvert(false)}>
                    Annuler
                  </Bouton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** Bascule clair/sombre en un clic (mémorisé sur l'appareil et dans le compte). */
export function BoutonTheme() {
  const theme = useTheme();
  const sombre =
    theme === "sombre" ||
    (theme === "auto" &&
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"));
  return (
    <Bouton
      variante="contour"
      taille="sm"
      onClick={() => definirTheme(sombre ? "clair" : "sombre")}
      aria-label={sombre ? "Passer au thème clair" : "Passer au thème sombre"}
    >
      {sombre ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {sombre ? "Thème clair" : "Thème sombre"}
    </Bouton>
  );
}
