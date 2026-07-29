import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useLangue, definirLangue, langues, type Langue } from "@/lib/i18n";
import { Bouton, Carte, Champ, Saisie, Selection, LienBouton } from "@/components/ui-kit";
import { toast } from "sonner";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — BURUNDI PI CONNECT" },
      { name: "description", content: "Gérez votre compte, la sécurité 2FA, les notifications et vos préférences de confidentialité." },
      { property: "og:title", content: "Paramètres — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Compte, sécurité et préférences." },
    ],
  }),
  component: Parametres,
});

function Parametres() {
  const langue = useLangue();
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Paramètres ⚙️</h1>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Compte</h2>
        <Champ label="Numéro de téléphone (vérifié)">
          <Saisie defaultValue="+257 79 123 456" maxLength={15} />
        </Champ>
        <Champ label="Email" aide="Une confirmation vous sera envoyée">
          <Saisie type="email" defaultValue="didier@example.com" maxLength={255} />
        </Champ>
        <Champ label="Langue / Ururimi / Lugha / Language">
          <Selection value={langue} onChange={(e) => definirLangue(e.target.value as Langue)}>
            {langues.map((l) => (
              <option key={l.code} value={l.code}>
                {l.drapeau} {l.nom}
              </option>
            ))}
          </Selection>
        </Champ>
        <LienBouton to="/profil/modifier" variante="contour" taille="sm">Modifier mon profil</LienBouton>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Sécurité</h2>
        <Interrupteur label="Authentification à deux facteurs (2FA)" />
        <Interrupteur label="Confirmation par code pour chaque paiement Pi" defaut />
        <Bouton variante="contour" taille="sm" onClick={() => toast("Un lien de changement de mot de passe a été envoyé.")}>
          Changer le mot de passe
        </Bouton>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Notifications</h2>
        <Interrupteur label="Nouveaux messages" defaut />
        <Interrupteur label="Candidatures et offres d'emploi" defaut />
        <Interrupteur label="Baisse de prix sur mes favoris" defaut />
        <Interrupteur label="Activité des personnes suivies" />
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Confidentialité</h2>
        <Interrupteur label="Afficher ma distance approximative" defaut />
        <Interrupteur label="Profil visible dans les suggestions" defaut />
      </Carte>

      <Bouton
        variante="danger"
        className="w-full"
        onClick={() => {
          toast.success("Déconnexion effectuée.");
          navigate({ to: "/connexion" });
        }}
      >
        SE DÉCONNECTER
      </Bouton>
    </div>
  );
}

function Interrupteur({ label, defaut }: { label: string; defaut?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium">
      {label}
      <input type="checkbox" defaultChecked={defaut} className="size-5 accent-[oklch(0.36_0.062_159)]" />
    </label>
  );
}
