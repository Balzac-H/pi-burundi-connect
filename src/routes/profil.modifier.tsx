import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bouton, Carte, Champ, Saisie, Selection, Zone, Avatar } from "@/components/ui-kit";
import { parUtilisateur } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/profil/modifier")({
  head: () => ({
    meta: [
      { title: "Modifier mon profil — BURUNDI PI CONNECT" },
      { name: "description", content: "Mettez à jour votre photo, bio, compétences, localisation et prix horaire." },
      { property: "og:title", content: "Modifier mon profil — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Gérez vos informations publiques sur la plateforme." },
    ],
  }),
  component: Modifier,
});

function Modifier() {
  const u = parUtilisateur("u-moi");
  const navigate = useNavigate();

  return (
    <form
      className="mx-auto max-w-2xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        toast.success("Profil mis à jour !");
        navigate({ to: "/profil" });
      }}
    >
      <h1 className="text-2xl font-extrabold text-primary">Modifier mon profil</h1>

      <Carte className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar emoji={u.emoji} taille="lg" />
          <Bouton type="button" variante="contour" taille="sm" onClick={() => toast("Sélecteur de photo (upload) à connecter.")}>
            Changer la photo
          </Bouton>
        </div>

        <Champ label="Nom complet" obligatoire>
          <Saisie required defaultValue={u.nom} maxLength={100} />
        </Champ>
        <Champ label="Bio / Description" aide="Max 300 caractères">
          <Zone defaultValue={u.bio} maxLength={300} />
        </Champ>
        <Champ label="Compétences / Tags" aide="Séparées par des virgules">
          <Saisie defaultValue={u.competences.join(", ")} maxLength={200} />
        </Champ>
        <Champ label="Localisation" obligatoire>
          <Saisie required defaultValue={u.ville} maxLength={120} />
        </Champ>
        <Champ label="Numéro de téléphone" obligatoire>
          <Saisie required type="tel" defaultValue="+257 79 123 456" maxLength={15} />
        </Champ>
        <Champ label="Prix horaire (Pi)">
          <Saisie type="number" min={0} defaultValue={u.prixHoraire} />
        </Champ>
        <Champ label="Statut">
          <Selection defaultValue="prestataire">
            <option value="prestataire">Prestataire de services</option>
            <option value="vendeur">Vendeur Market</option>
            <option value="les-deux">Les deux</option>
          </Selection>
        </Champ>
        <Champ label="Portefeuille Pi">
          <Saisie readOnly value="pi://didier-n" className="bg-muted" />
        </Champ>
      </Carte>

      <div className="flex gap-2">
        <Bouton type="submit">ENREGISTRER</Bouton>
        <Bouton type="button" variante="contour" onClick={() => navigate({ to: "/profil" })}>ANNULER</Bouton>
      </div>
    </form>
  );
}
