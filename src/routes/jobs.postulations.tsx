import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, LienBouton } from "@/components/ui-kit";
import { chargerJob, type JobDb } from "@/lib/annonces";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { store, useStore, formatPi } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/postulations")({
  head: () => ({
    meta: [
      { title: "Mes postulations — Arija Connect" },
      { name: "description", content: "Suivez vos candidatures et annulez-les en un clic." },
      { property: "og:title", content: "Mes postulations — Arija Connect" },
      {
        property: "og:description",
        content: "Gérez toutes vos candidatures d'emploi en un endroit.",
      },
    ],
  }),
  component: Postulations,
});

function Postulations() {
  const candidatures = useStore((s) => s.candidatures);
  const [jobs, setJobs] = useState<Record<string, JobDb | null>>({});
  const [employeurs, setEmployeurs] = useState<Record<string, Profil | null>>({});

  useEffect(() => {
    let vivant = true;
    Promise.all(candidatures.map((id) => chargerJob(id)))
      .then(async (liste) => {
        if (!vivant) return;
        const map = Object.fromEntries(candidatures.map((id, i) => [id, liste[i]]));
        setJobs(map);
        const ids = [...new Set(liste.filter((j): j is JobDb => !!j).map((j) => j.employeur_id))];
        const profils = await Promise.all(ids.map((id) => chargerProfilCache(id)));
        if (vivant) setEmployeurs(Object.fromEntries(ids.map((id, i) => [id, profils[i]])));
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [candidatures]);

  const triees = [...candidatures]
    .map((id) => jobs[id])
    .filter((j): j is JobDb => !!j)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Mes postulations</h1>

      <section className="space-y-2">
        <h2 className="section-label">En attente ({triees.length})</h2>
        {triees.map((j) => (
          <Carte key={j.id} className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{j.titre}</p>
              <p className="text-xs text-muted-foreground">
                {j.salaire != null ? formatPi(Number(j.salaire)) : "Salaire à convenir"} ·{" "}
                {employeurs[j.employeur_id]?.nom ?? "…"} · {j.localisation}
              </p>
              <p className="text-xs text-muted-foreground">
                Postulé le {new Date(j.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <Etiquette ton="attente">En attente</Etiquette>
            <div className="flex gap-2">
              <LienBouton to="/jobs/$id" params={{ id: j.id }} variante="contour" taille="sm">
                VOIR
              </LienBouton>
              <Bouton
                variante="danger"
                taille="sm"
                onClick={() => {
                  store.annulerCandidature(j.id);
                  toast.success("Postulation annulée.");
                }}
              >
                ANNULER
              </Bouton>
            </div>
          </Carte>
        ))}
        {triees.length === 0 && candidatures.length === 0 && (
          <Carte className="text-sm text-muted-foreground">
            Aucune candidature pour le moment.
          </Carte>
        )}
        {triees.length === 0 && candidatures.length > 0 && (
          <Carte className="text-sm text-muted-foreground">
            Les offres liées à vos candidatures ont été retirées.
          </Carte>
        )}
      </section>
    </div>
  );
}
