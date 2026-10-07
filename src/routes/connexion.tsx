import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Champ, Saisie, Selection } from "@/components/ui-kit";
import { typesCompte } from "@/lib/annonces";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Link } from "@tanstack/react-router";
import { connexionPi } from "@/lib/pi-session";
import { piDisponible } from "@/lib/pi";


export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — WICO" },
      { name: "description", content: "Connectez-vous ou créez votre compte WICO avec votre email et votre mot de passe." },
      { property: "og:title", content: "Connexion — WICO" },
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
  const [typeCompte, setTypeCompte] = useState("vendeur");
  const [attenteConfirmation, setAttenteConfirmation] = useState(false);
  const [motDePasse, setMotDePasse] = useState("");
  const navigate = useNavigate();

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    try {
      if (inscription) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nom, telephone, whatsapp, type_compte: typeCompte },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Compte créé ! Complétez votre profil.");
          navigate({ to: "/profil/modifier" });
        } else {
          setAttenteConfirmation(true);
        }
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
          <h1 className="mt-3 text-2xl font-extrabold text-primary">WICO</h1>
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
          <Bouton type="button" variante="pi" className="w-full" disabled={enCours} onClick={async () => {
            if (!piDisponible()) return toast("Ouvrez WICO dans le Pi Browser pour payer en Pi.");
            setEnCours(true);
            try { const u = await connexionPi(); toast.success(`Bienvenue ${u} !`); navigate({ to: "/profil" }); }
            catch (e) { toast.error(e instanceof Error ? e.message : "Connexion Pi impossible."); }
            finally { setEnCours(false); }
          }}>
            π Se connecter avec Pi
          </Bouton>
          <button
            type="button"
            className="w-full text-center text-xs font-semibold text-muted-foreground"
            onClick={() => navigate({ to: "/" })}
          >
            Explorer l'application sans compte
          </button>
          <p className="text-center text-xs text-muted-foreground">
            En continuant, vous acceptez les <Link to="/conditions" className="underline">conditions</Link> et la <Link to="/confidentialite" className="underline">politique de confidentialité</Link>.
          </p>
        </div>
        {attenteConfirmation ? (
          <div className="card-surface space-y-2 p-5 text-center">
            <h2 className="text-lg font-bold">Confirmez votre email 📩</h2>
            <p className="text-sm text-muted-foreground">
              Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte :
              votre profil recevra alors le badge « Vérifié ».
            </p>
          </div>
        ) : (
        <form className="card-surface space-y-4 p-5" onSubmit={soumettre}>
          <h2 className="text-lg font-bold">{inscription ? "Créer un compte" : "Se connecter"}</h2>

          {inscription && (
            <>
              <Champ label="Nom complet" obligatoire>
                <Saisie required value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Didier Ndayisenga" maxLength={100} />
              </Champ>
              <Champ label="Type de compte" obligatoire>
                <Selection value={typeCompte} onChange={(e) => setTypeCompte(e.target.value)}>
                  {typesCompte.map((t) => (
                    <option key={t.code} value={t.code}>{t.nom}</option>
                  ))}
                </Selection>
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
        )}
      </div>
    </div>
  );
}
