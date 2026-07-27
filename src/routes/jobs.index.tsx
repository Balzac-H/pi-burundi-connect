import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Carte, Etiquette, Saisie, Selection, LienBouton, Avatar, Note, Distance } from "@/components/ui-kit";
import { jobs, parUtilisateur, categoriesJobs } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/")({
  head: () => ({
    meta: [
      { title: "Offres d'emploi payées en Pi — BURUNDI PI CONNECT" },
      { name: "description", content: "Parcourez les offres d'emploi au Burundi : menuiserie, électricité, construction, nettoyage. Salaires payés en Pi." },
      { property: "og:title", content: "Offres d'emploi — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Trouvez un job près de chez vous et soyez payé en Pi." },
    ],
  }),
  component: ListeJobs,
});

function ListeJobs() {
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [salaireMin, setSalaireMin] = useState(0);
  const [distanceMax, setDistanceMax] = useState(100);
  const candidatures = useStore((s) => s.candidatures);

  const resultats = jobs.filter((j) => {
    const emp = parUtilisateur(j.employeurId);
    return (
      (!categorie || j.categorie === categorie) &&
      j.salairePi >= salaireMin &&
      emp.distanceKm <= distanceMax &&
      (j.titre + j.description + j.categorie).toLowerCase().includes(recherche.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-primary">JOBS 💼</h1>
        <div className="flex gap-2">
          <LienBouton to="/jobs/postulations" variante="contour" taille="sm">Mes postulations</LienBouton>
          <LienBouton to="/jobs/creer" variante="secondaire" taille="sm">Créer une offre</LienBouton>
        </div>
      </div>

      <Carte className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Selection value={categorie} onChange={(e) => setCategorie(e.target.value)}>
          <option value="">Toutes catégories</option>
          {categoriesJobs.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Selection>
        <Selection value={salaireMin} onChange={(e) => setSalaireMin(Number(e.target.value))}>
          <option value={0}>Salaire min.</option>
          <option value={500}>500 Pi +</option>
          <option value={1500}>1 500 Pi +</option>
          <option value={4000}>4 000 Pi +</option>
        </Selection>
        <Selection value={distanceMax} onChange={(e) => setDistanceMax(Number(e.target.value))}>
          <option value={100}>Toute distance</option>
          <option value={3}>Moins de 3 km</option>
          <option value={10}>Moins de 10 km</option>
        </Selection>
        <Saisie
          placeholder="Rechercher un emploi…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          maxLength={80}
        />
      </Carte>

      <div className="grid gap-3 lg:grid-cols-2">
        {resultats.map((j) => {
          const emp = parUtilisateur(j.employeurId);
          const postule = candidatures.includes(j.id);
          return (
            <Carte key={j.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Avatar emoji={emp.emoji} taille="sm" />
                <Link to="/profil/$id" params={{ id: emp.id }} className="text-sm font-semibold">{emp.nom}</Link>
                <Note note={emp.note} />
                <Distance km={emp.distanceKm} />
              </div>
              <div>
                <p className="text-xs font-semibold text-accent">{j.categorie}</p>
                <h2 className="font-bold leading-snug">{j.titre}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Etiquette ton="pi">{j.salaire}</Etiquette>
                <Etiquette>⏱️ {j.duree}</Etiquette>
                {j.urgent && <Etiquette ton="urgent">⚡ Urgent</Etiquette>}
              </div>
              <div className="flex gap-2">
                <LienBouton to="/jobs/$id" params={{ id: j.id }} variante="contour" taille="sm">VOIR DÉTAIL</LienBouton>
                <Bouton
                  taille="sm"
                  disabled={postule}
                  onClick={() => {
                    store.postuler(j.id);
                    toast.success("Postulation envoyée !");
                  }}
                >
                  {postule ? "POSTULÉ ✓" : "POSTULER"}
                </Bouton>
              </div>
            </Carte>
          );
        })}
        {resultats.length === 0 && (
          <Carte className="text-center text-sm text-muted-foreground">Aucune offre ne correspond à vos filtres.</Carte>
        )}
      </div>
    </div>
  );
}
