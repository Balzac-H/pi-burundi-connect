import type { ReactNode } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { Bouton, Carte } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { lienConnexion } from "@/lib/retour";

/**
 * Laisse consulter l'application sans compte, mais demande la connexion
 * au moment d'exécuter une action (publier, payer, discuter…).
 * Le lien de connexion revient automatiquement à la page d'origine.
 */
export function BesoinCompte({
  titre,
  message = "Créez un compte gratuitement pour continuer. Vos données sont enregistrées et conservées en toute sécurité.",
  children,
}: {
  titre: string;
  message?: string;
  children: ReactNode;
}) {
  const { utilisateur, chargement } = useSession();
  const router = useRouter();
  const localisation = useRouterState({ select: (s) => s.location });
  const retour = `${localisation.pathname}${localisation.searchStr ?? ""}`;

  if (chargement) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  }

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold text-foreground">{titre}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Bouton onClick={() => router.history.push(lienConnexion(retour))}>
          Se connecter avec Pi
        </Bouton>
      </Carte>
    );
  }

  return <>{children}</>;
}
