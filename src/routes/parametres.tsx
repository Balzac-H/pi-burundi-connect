import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLangue, definirLangue, langues, type Langue } from "@/lib/i18n";
import { useTheme, definirTheme, themes, type Theme } from "@/lib/theme";
import { Bouton, Carte, Champ, Saisie, Selection, LienBouton } from "@/components/ui-kit";
import { useSession, seDeconnecter } from "@/lib/auth";
import { chargerProfil, type Profil } from "@/lib/comptes";
import { supprimerMonCompte } from "@/lib/pi.functions";
import { toast } from "sonner";
import { BoutonTheme } from "@/components/Confiance";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Arija Connect" },
      {
        name: "description",
        content: "Langue, thème, sécurité et session de votre compte Arija Connect.",
      },
      { property: "og:title", content: "Paramètres — Arija Connect" },
      { property: "og:description", content: "Compte, langue, thème et sécurité." },
    ],
  }),
  component: Parametres,
});

function Parametres() {
  const langue = useLangue();
  const theme = useTheme();
  const navigate = useNavigate();
  const { utilisateur, chargement } = useSession();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (utilisateur) chargerProfil(utilisateur.id).then(setProfil);
  }, [utilisateur]);

  if (chargement)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Connectez-vous pour gérer votre compte.</p>
        <LienBouton to="/connexion">Se connecter / S'inscrire</LienBouton>
      </Carte>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Paramètres</h1>

      <Carte className="space-y-3">
        <h2 className="section-label">Compte</h2>
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Nom</p>
          <p className="font-semibold">{profil?.nom ?? "—"}</p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="font-semibold break-all">{utilisateur.email}</p>
        </div>
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">Téléphone</p>
          <p className="font-semibold">{profil?.telephone ?? "—"}</p>
        </div>
        <Champ label="Langue / Ururimi / Lugha / Language">
          <Selection value={langue} onChange={(e) => definirLangue(e.target.value as Langue)}>
            {langues.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nom}
              </option>
            ))}
          </Selection>
        </Champ>
        <Champ label="Thème" aide="Mémorisé sur cet appareil et appliqué à toute l'application">
          <Selection value={theme} onChange={(e) => definirTheme(e.target.value as Theme)}>
            {themes.map((t) => (
              <option key={t.code} value={t.code}>
                {t.nom}
              </option>
            ))}
          </Selection>
        </Champ>
        <div className="flex flex-wrap gap-2">
          <BoutonTheme />
          <LienBouton to="/profil/modifier" variante="contour" taille="sm">
            Modifier mon profil
          </LienBouton>
          <LienBouton to="/admin" variante="fantome" taille="sm">
            Espace admin
          </LienBouton>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="section-label">Sécurité</h2>
        <p className="text-sm text-muted-foreground">
          Arija Connect n'utilise ni mot de passe ni adresse email de connexion : l'accès au compte
          passe uniquement par Pi (Pi Browser). En cas de perte d'accès, reconnectez-vous avec Pi
          pour retrouver vos achats, ventes et messages.
        </p>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="section-label">Conformité</h2>
        <div className="flex flex-wrap gap-2">
          <LienBouton to="/conditions" variante="contour" taille="sm">
            Conditions d'utilisation
          </LienBouton>
          <LienBouton to="/confidentialite" variante="contour" taille="sm">
            Politique de confidentialité
          </LienBouton>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="section-label">Session</h2>
        <Bouton
          variante="danger"
          className="w-full"
          onClick={async () => {
            await seDeconnecter();
            toast.success("Vous êtes déconnecté.");
            navigate({ to: "/connexion" });
          }}
        >
          Se déconnecter
        </Bouton>
      </Carte>

      <Carte className="space-y-3 border border-destructive/40">
        <h2 className="text-sm font-semibold text-destructive">Zone dangereuse</h2>
        <p className="text-sm text-muted-foreground">
          Supprime définitivement votre compte, vos annonces, messages, avis et profils. Les
          paiements déjà libérés restent enregistrés chez Pi. Cette action est irréversible.
        </p>
        <Bouton
          variante="danger"
          className="w-full"
          disabled={enCours}
          onClick={async () => {
            if (!window.confirm("Supprimer définitivement votre compte et toutes vos données ?"))
              return;
            if (
              !window.confirm(
                "Dernière confirmation : tout sera effacé, sans récupération possible.",
              )
            )
              return;
            setEnCours(true);
            try {
              await supprimerMonCompte();
              await seDeconnecter();
              toast.success("Votre compte et vos données ont été supprimés.");
              navigate({ to: "/" });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Suppression impossible.");
            } finally {
              setEnCours(false);
            }
          }}
        >
          Supprimer mon compte et mes données
        </Bouton>
      </Carte>
    </div>
  );
}
