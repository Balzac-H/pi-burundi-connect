import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Champ, Saisie } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — BURUNDI PI CONNECT" },
      { name: "description", content: "Connectez-vous ou créez votre compte Burundi Pi Connect avec votre numéro de téléphone ou votre Pi Wallet." },
      { property: "og:title", content: "Connexion — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Accédez à la plateforme peer-to-peer du Burundi." },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const [inscription, setInscription] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl gradient-primary text-3xl font-bold text-primary-foreground">
            π
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-primary">BURUNDI PI CONNECT</h1>
          <p className="text-sm text-muted-foreground">Emplois, marché et paiements en Pi</p>
        </div>

        <form
          className="card-surface space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success(inscription ? "Compte créé avec succès !" : "Connexion réussie !");
            navigate({ to: "/" });
          }}
        >
          <h2 className="text-lg font-bold">{inscription ? "Créer un compte" : "Se connecter"}</h2>

          {inscription && (
            <Champ label="Nom complet" obligatoire>
              <Saisie required placeholder="Ex. Didier Ndayisenga" />
            </Champ>
          )}

          <Champ label="Numéro de téléphone" obligatoire>
            <Saisie required type="tel" inputMode="tel" pattern="[0-9+ ]{8,15}" placeholder="+257 79 000 000" maxLength={15} />
          </Champ>

          <Champ label="Email (optionnel)">
            <Saisie type="email" placeholder="vous@example.com" maxLength={255} />
          </Champ>

          <Champ label="Mot de passe" obligatoire aide="Minimum 8 caractères">
            <Saisie required type="password" minLength={8} maxLength={72} placeholder="••••••••" />
          </Champ>

          <Bouton type="submit" className="w-full">
            {inscription ? "CRÉER MON COMPTE" : "SE CONNECTER"}
          </Bouton>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <Bouton
            type="button"
            variante="pi"
            className="w-full"
            onClick={() => toast("Connexion Pi Wallet bientôt disponible (Pi App Studio).")}
          >
            π Se connecter avec Pi Wallet
          </Bouton>

          <div className="flex justify-between text-xs font-semibold">
            <button type="button" className="text-accent" onClick={() => setInscription((v) => !v)}>
              {inscription ? "J'ai déjà un compte" : "Créer un compte"}
            </button>
            <button type="button" className="text-muted-foreground" onClick={() => toast("Un lien de réinitialisation vous sera envoyé par SMS.")}>
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
