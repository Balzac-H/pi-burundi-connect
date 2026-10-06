import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listerJobs, idsVerifies, type JobDb } from "@/lib/annonces";
import { BadgeVerifie, BoutonSignaler } from "@/components/Confiance";
import {
  Bouton,
  Carte,
  Etiquette,
  Saisie,
  Selection,
  LienBouton,
  Avatar,
} from "@/components/ui-kit";
import { categoriesJobs } from "@/lib/data";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { store, useStore, formatPi } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Offres d'emploi payées en Pi — WICO" },
      {
        name: "description",
        content:
          "Parcourez les offres d'emploi au Burundi : menuiserie, électricité, construction, nettoyage. Salaires payés en Pi.",
      },
      { property: "og:title", content: "Offres d'emploi — WICO" },
      {
        property: "og:description",
        content: "Trouvez un job près de chez vous et soyez payé en Pi.",
      },
    ],
  }),
  component: ListeJobs,
});

function ListeJobs() {
  const t = useT();
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [salaireMin, setSalaireMin] = useState(0);
  const candidatures = useStore((s) => s.candidatures);
  const [liste, setListe] = useState<JobDb[]>([]);
  const [verifies, setVerifies] = useState<Set<string>>(new Set());

  useEffect(() => {
    let vivant = true;
    listerJobs()
      .then(async (j) => {
        if (!vivant) return;
        setListe(j);
        setVerifies(await idsVerifies(j.map((x) => x.employeur_id)));
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, []);

  const resultats = useMemo(
    () =>
      liste.filter(
        (j) =>
          (!categorie || j.categorie === categorie) &&
          (j.salaire ?? 0) >= salaireMin &&
          (!recherche ||
            (j.titre + j.description + j.categorie)
              .toLowerCase()
              .includes(recherche.toLowerCase())),
      ),
    [liste, categorie, salaireMin, recherche],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-primary">JOBS 💼</h1>
        <div className="flex gap-2">
          <LienBouton to="/jobs/postulations" variante="contour" taille="sm">
            Mes postulations
          </LienBouton>
          <LienBouton to="/jobs/creer" variante="secondaire" taille="sm">
            Créer une offre
          </LienBouton>
        </div>
      </div>

      <Carte className="grid gap-2 sm:grid-cols-3">
        <Selection value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categoriesJobs.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Selection>
        <Selection value={salaireMin} onChange={(e) => setSalaireMin(Number(e.target.value))}>
          <option value={0}>Salaire min.</option>
          <option value={500}>500 Pi +</option>
          <option value={1500}>1 500 Pi +</option>
          <option value={4000}>4 000 Pi +</option>
        </Selection>
        <Saisie
          placeholder="Rechercher un emploi…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          maxLength={80}
        />
      </Carte>

      <h2 className="text-lg font-bold">{t("jobs")}</h2>
      <div className="grid gap-3 lg:grid-cols-2">
        {resultats.map((j) => (
          <CarteJob
            key={j.id}
            j={j}
            verifie={verifies.has(j.employeur_id)}
            postule={candidatures.includes(j.id)}
          />
        ))}
        {resultats.length === 0 && (
          <Carte className="text-center text-sm text-muted-foreground">{t("aucuneOffre")}</Carte>
        )}
      </div>
    </div>
  );
}

function CarteJob({ j, verifie, postule }: { j: JobDb; verifie: boolean; postule: boolean }) {
  const [emp, setEmp] = useState<Profil | null>(null);
  useEffect(() => {
    chargerProfilCache(j.employeur_id)
      .then(setEmp)
      .catch(() => undefined);
  }, [j.employeur_id]);

  return (
    <Carte className="space-y-3">
      <div className="flex items-center gap-2">
        <Avatar emoji={emp?.photo_url ?? "👤"} taille="sm" />
        <Link to="/profil/$id" params={{ id: j.employeur_id }} className="text-sm font-semibold">
          {emp?.nom ?? "…"}
        </Link>
        <BadgeVerifie verifie={verifie} />
      </div>
      <div>
        <p className="text-xs font-semibold text-accent">{j.categorie}</p>
        <h2 className="font-bold leading-snug">{j.titre}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {j.salaire != null && <Etiquette ton="pi">{formatPi(Number(j.salaire))}</Etiquette>}
        {j.duree && <Etiquette>⏱️ {j.duree}</Etiquette>}
        <Etiquette>📍 {j.localisation}</Etiquette>
        {j.urgent && <Etiquette ton="urgent">⚡ Urgent</Etiquette>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LienBouton to="/jobs/$id" params={{ id: j.id }} variante="contour" taille="sm">
          VOIR DÉTAIL
        </LienBouton>
        <Bouton
          taille="sm"
          disabled={postule}
          onClick={() => {
            store.postuler(j.id);
            toast.success("Postulation enregistrée !");
          }}
        >
          {postule ? "POSTULÉ ✓" : "POSTULER"}
        </Bouton>
        <BoutonSignaler cibleType="job" cibleId={j.id} utilisateurId={j.employeur_id} />
      </div>
    </Carte>
  );
}
