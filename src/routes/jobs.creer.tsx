import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bouton, Carte, Champ, Saisie, Selection, Zone } from "@/components/ui-kit";
import { categoriesJobs } from "@/lib/data";
import { bientotDisponible } from "@/lib/utils";
import { toast } from "sonner";
import { BesoinCompte } from "@/components/BesoinCompte";

export const Route = createFileRoute("/jobs/creer")({
  head: () => ({
    meta: [
      { title: "Publier une offre d'emploi — WICO" },
      { name: "description", content: "Publiez gratuitement une offre d'emploi payée en Pi et recrutez des travailleurs près de chez vous." },
      { property: "og:title", content: "Publier une offre d'emploi — WICO" },
      { property: "og:description", content: "Recrutez rapidement au Burundi, paiement en Pi." },
    ],
  }),
  component: CreerOffreProtege,
});

function CreerOffre() {
  const navigate = useNavigate();

  return (
    <form
      className="mx-auto max-w-2xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        toast.success("Offre publiée avec succès !");
        navigate({ to: "/jobs" });
      }}
    >
      <h1 className="text-2xl font-extrabold text-primary">Créer une offre d'emploi</h1>

      <Carte className="space-y-4">
        <Champ label="Titre du poste" obligatoire>
          <Saisie required maxLength={100} placeholder="Ex. Fabrication de portes en bois" />
        </Champ>
        <Champ label="Catégorie" obligatoire>
          <Selection required defaultValue="">
            <option value="" disabled>Choisir une catégorie</option>
            {categoriesJobs.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Selection>
        </Champ>
        <Champ label="Description détaillée" obligatoire aide="Max 1000 caractères">
          <Zone required maxLength={1000} placeholder="Décrivez la mission, les conditions, le matériel fourni…" />
        </Champ>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Salaire (Pi)" obligatoire>
            <Saisie required type="number" min={1} placeholder="1500" />
          </Champ>
          <Champ label="Durée" obligatoire>
            <Selection required defaultValue="jours">
              <option value="heures">Heures</option>
              <option value="jours">Jours</option>
              <option value="semaines">Semaines</option>
              <option value="permanent">Permanent</option>
            </Selection>
          </Champ>
          <Champ label="Date de début" obligatoire>
            <Saisie required type="date" />
          </Champ>
          <Champ label="Nombre de postes" obligatoire>
            <Saisie required type="number" min={1} defaultValue={1} />
          </Champ>
        </div>
        <Champ label="Localisation / Adresse" obligatoire>
          <Saisie required maxLength={150} placeholder="Quartier Rohero, Bujumbura" />
        </Champ>
        <Champ label="Compétences requises" aide="Séparées par des virgules">
          <Saisie maxLength={200} placeholder="Menuiserie, bois massif" />
        </Champ>
        <Champ label="Niveau d'expérience">
          <Selection defaultValue="Intermédiaire">
            <option>Débutant</option>
            <option>Intermédiaire</option>
            <option>Expert</option>
          </Selection>
        </Champ>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-4 accent-[oklch(0.36_0.062_159)]" /> Permis / certification requis
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" className="size-4 accent-[oklch(0.76_0.171_62)]" /> ⚡ Offre urgente
        </label>
      </Carte>

      <div className="flex flex-wrap gap-2">
        <Bouton type="submit">PUBLIER L'OFFRE</Bouton>
        <Bouton type="button" variante="contour" onClick={() => bientotDisponible("L'aperçu d'offre")}>APERÇU</Bouton>
        <Bouton type="button" variante="fantome" onClick={() => bientotDisponible("L'enregistrement de brouillon")}>BROUILLON</Bouton>
      </div>
    </form>
  );
}

function CreerOffreProtege() {
  return (
    <BesoinCompte titre="Créer une offre d'emploi">
      <CreerOffre />
    </BesoinCompte>
  );
}
