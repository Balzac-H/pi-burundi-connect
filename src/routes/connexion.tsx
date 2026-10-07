import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";
import { connexionPi } from "@/lib/pi-session";
import { piDisponible } from "@/lib/pi";
import { cheminRetour } from "@/lib/retour";
import { toast } from "sonner";

type ConnexionSearch = { retour?: string };

export const Route = createFileRoute("/connexion")({
  validateSearch: (search: Record<string, unknown>): ConnexionSearch => ({
    retour: typeof search.retour === "string" ? search.retour : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Connexion — WICO" },
      { name: "description", content: "Connectez-vous à WICO avec votre compte Pi Network." },
      { property: "og:title", content: "Connexion — WICO" },
      { property: "og:description", content: "Accédez à la plateforme peer-to-peer du Burundi." },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const t = useT();
  const [enCours, setEnCours] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const { retour } = Route.useSearch();
  const cible = cheminRetour(retour);

  async function seConnecterAvecPi() {
    if (!piDisponible()) {
      toast.error(t("piBrowserRequis"));
      return;
    }
    setEnCours(true);
    try {
      const username = await connexionPi();
      toast.success(t("seConnecter") + " : " + username);
      // Retour automatique à la page d'origine (le panier est conservé).
      if (retour) router.history.push(cible);
      else navigate({ to: "/profil" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message !== "User cancelled the login flow") {
        toast.error(message || "Connexion impossible.");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl gradient-primary text-3xl font-bold text-primary-foreground">
            π
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-primary">WICO</h1>
          <p className="text-sm text-muted-foreground">{t("sloganAccueil")}</p>
        </div>

        <div className="card-surface space-y-3 p-5">
          <h2 className="text-lg font-bold">{t("connexionRequise")}</h2>
          <p className="text-xs text-muted-foreground">
            Un seul compte, créé avec Pi Network. Vos achats, ventes et paiements sont liés à votre
            identité Pi.
          </p>
          <Bouton
            type="button"
            variante="pi"
            className="w-full"
            onClick={seConnecterAvecPi}
            disabled={enCours}
          >
            {enCours ? t("paiementEnCours") : `π ${t("seConnecterPi")}`}
          </Bouton>
          {!piDisponible() && (
            <p className="text-center text-xs font-semibold text-destructive">
              {t("piBrowserRequis")}
            </p>
          )}
          <button
            type="button"
            className="w-full text-center text-xs font-semibold text-muted-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            {t("explorerSansCompte")}
          </button>
        </div>

        <p className="px-4 text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos{" "}
          <button
            type="button"
            className="font-semibold text-accent underline"
            onClick={() => navigate({ to: "/conditions" })}
          >
            {t("conditions")}
          </button>{" "}
          et notre{" "}
          <button
            type="button"
            className="font-semibold text-accent underline"
            onClick={() => navigate({ to: "/confidentialite" })}
          >
            {t("confidentialite")}
          </button>
          .
        </p>
      </div>
    </div>
  );
}
