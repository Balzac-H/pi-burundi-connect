import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Carte, Champ, Saisie, Selection, Zone } from "@/components/ui-kit";
import { categoriesJobs } from "@/lib/data";
import { creerJob } from "@/lib/annonces";
import { useSession } from "@/lib/auth";
import { chargerProfil } from "@/lib/comptes";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import { BesoinCompte } from "@/components/BesoinCompte";

export const Route = createFileRoute("/jobs/creer")({
  head: () => ({
    meta: [
      { title: "Publier une offre d'emploi — WICO" },
      {
        name: "description",
        content:
          "Publiez gratuitement une offre d'emploi payée en Pi et recrutez des travailleurs près de chez vous.",
      },
      { property: "og:title", content: "Publier une offre d'emploi — WICO" },
      { property: "og:description", content: "Recrutez rapidement au Burundi, paiement en Pi." },
    ],
  }),
  component: CreerOffreProtege,
});

function CreerOffre() {
  const navigate = useNavigate();
  const t = useT();
  const { utilisateur } = useSession();
  const [envoi, setEnvoi] = useState(false);

  return (
    <form
      className="mx-auto max-w-2xl space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!utilisateur) return;
        const f = new FormData(e.currentTarget);
        const titre = String(f.get("titre") ?? "").trim();
        const description = String(f.get("description") ?? "").trim();
        if (titre.length < 3 || description.length < 10) {
          toast.error("Titre (3 caractères min.) et description (10 min.) requis.");
          return;
        }
        const salaire = Number(f.get("salaire"));
        setEnvoi(true);
        try {
          const profil = await chargerProfil(utilisateur.id);
          if (!profil?.pi_uid) {
            toast.error(t("piRequisPourVendre"));
            return;
          }
          if (!profil.vendeur_actif) {
            toast.error(t("activerPourPublier"));
            return;
          }
          await creerJob({
            employeur_id: utilisateur.id,
            titre: titre.slice(0, 100),
            description: description.slice(0, 1000),
            categorie: String(f.get("categorie") || "Autre"),
            localisation: String(f.get("localisation") ?? "")
              .trim()
              .slice(0, 150),
            salaire: Number.isFinite(salaire) && salaire > 0 ? salaire : null,
            duree: String(f.get("duree") || "") || null,
            urgent: f.get("urgent") === "on",
          });
          toast.success("Offre publiée, visible par tous !");
          navigate({ to: "/jobs" });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Échec de la publication.");
        } finally {
          setEnvoi(false);
        }
      }}
    >
      <h1 className="text-2xl font-extrabold text-primary">Créer une offre d'emploi</h1>

      <Carte className="space-y-4">
        <Champ label="Titre du poste" obligatoire>
          <Saisie
            name="titre"
            required
            maxLength={100}
            placeholder="Ex. Fabrication de portes en bois"
          />
        </Champ>
        <Champ label="Catégorie" obligatoire>
          <Selection name="categorie" required defaultValue="">
            <option value="" disabled>
              Choisir une catégorie
            </option>
            {categoriesJobs.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Selection>
        </Champ>
        <Champ label="Description détaillée" obligatoire aide="Max 1000 caractères">
          <Zone
            name="description"
            required
            maxLength={1000}
            placeholder="Décrivez la mission, les conditions, le matériel fourni…"
          />
        </Champ>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Salaire (π)">
            <Saisie name="salaire" type="number" min={0} step="0.001" placeholder="0.05" />
          </Champ>
          <Champ label="Durée" obligatoire>
            <Selection name="duree" required defaultValue="Jours">
              <option>Heures</option>
              <option>Jours</option>
              <option>Semaines</option>
              <option>Permanent</option>
            </Selection>
          </Champ>
        </div>
        <Champ label="Localisation" obligatoire>
          <Saisie
            name="localisation"
            required
            maxLength={150}
            placeholder="Quartier Rohero, Bujumbura"
          />
        </Champ>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input name="urgent" type="checkbox" className="size-4" /> ⚡ Offre urgente
        </label>
      </Carte>

      <Bouton type="submit" disabled={envoi}>
        {envoi ? "Publication…" : "Publier l'offre"}
      </Bouton>
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
