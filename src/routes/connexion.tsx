import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Champ, Saisie } from "@/components/ui-kit";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";


export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — BURUNDI PI CONNECT" },
      { name: "description", content: "Connectez-vous ou créez votre compte Burundi Pi Connect avec votre email et votre mot de passe." },
      { property: "og:title", content: "Connexion — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Accédez à la plateforme peer-to-peer du Burundi." },
    ],
  }),
  component: Connexion,
});

function Connexion() {
  const [inscription, setInscription] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const navigate = useNavigate();

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    try {
      if (inscription) {
        const { error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nom, telephone, whatsapp },
          },
        });
        if (error) throw error;
        toast.success("Compte créé ! Complétez votre profil.");
        navigate({ to: "/profil/modifier" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse });
        if (error) throw error;
        toast.success("Connexion réussie !");
        navigate({ to: "/profil" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setEnCours(false);
    }
  }

  async function connexionGoogle() {
    setEnCours(true);
    try {
      await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Connexion Google impossible.");
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
          <h1 className="mt-3 text-2xl font-extrabold text-primary">BURUNDI PI CONNECT</h1>
          <p className="text-sm text-muted-foreground">Emplois, marché et paiements en Pi</p>
        </div>

        <div className="card-surface space-y-3 p-5">
          <h2 className="text-lg font-bold">Connexion sécurisée</h2>
          <p className="text-xs text-muted-foreground">
            Vos données de compte sont enregistrées et conservées en toute sécurité.
          </p>
          <Bouton type="button" variante="secondaire" className="w-full" onClick={connexionGoogle} disabled={enCours}>
            Continuer avec Google
          </Bouton>
          <Bouton
            type="button"
            variante="pi"
            className="w-full"
            onClick={() => bientotDisponible("L'authentification Pi Wallet")}
          >
            π Continuer avec Pi Network
          </Bouton>
          <button
            type="button"
            className="w-full text-center text-xs font-semibold text-muted-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            Explorer l'application sans compte
          </button>
        </div>



        <form className="card-surface space-y-4 p-5" onSubmit={soumettre}>
          <h2 className="text-lg font-bold">{inscription ? "Créer un compte" : "Se connecter"}</h2>

          {inscription && (
            <>
              <Champ label="Nom complet" obligatoire>
                <Saisie required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Didier Ndayisenga" maxLength={100} />
              </Champ>
              <Champ label="Numéro de téléphone" obligatoire>
                <Saisie required type="tel" inputMode="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="+257 79 000 000" maxLength={20} />
              </Champ>
              <Champ label="Numéro WhatsApp" aide="Vos clients pourront vous écrire directement">
                <Saisie type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+257 79 000 000" maxLength={20} />
              </Champ>
            </>
          )}

          <Champ label="Email" obligatoire>
            <Saisie required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@example.com" maxLength={255} />
          </Champ>

          <Champ label="Mot de passe" obligatoire aide="Minimum 8 caractères — enregistré de façon sécurisée">
            <Saisie required type="password" minLength={8} maxLength={72} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} placeholder="••••••••" />
          </Champ>

          <Bouton type="submit" className="w-full" disabled={enCours}>
            {enCours ? "Patientez…" : inscription ? "CRÉER MON COMPTE" : "SE CONNECTER"}
          </Bouton>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <Bouton
            type="button"
            variante="pi"
            className="w-full"
            onClick={() => bientotDisponible("La connexion Pi Wallet")}
          >
            π Se connecter avec Pi Wallet
          </Bouton>

          <div className="flex justify-between text-xs font-semibold">
            <button type="button" className="text-accent" onClick={() => setInscription((v) => !v)}>
              {inscription ? "J'ai déjà un compte" : "Créer un compte"}
            </button>
            <button
              type="button"
              className="text-muted-foreground"
              onClick={async () => {
                if (!email) return toast("Entrez d'abord votre email.");
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${window.location.origin}/connexion`,
                });
                toast[error ? "error" : "success"](error ? error.message : "Lien de réinitialisation envoyé par email.");
              }}
            >
              Mot de passe oublié ?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
