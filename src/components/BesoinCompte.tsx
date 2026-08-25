import type { ReactNode } from "react";
import { Carte, LienBouton } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";

/**
 * Laisse consulter l'application sans compte, mais demande la création
 * d'un compte au moment d'exécuter une action (publier, payer, discuter…).
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

  if (chargement) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  }

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-extrabold text-primary">{titre}</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <LienBouton to="/connexion">CRÉER UN COMPTE / SE CONNECTER</LienBouton>
      </Carte>
    );
  }

  return <>{children}</>;
}
