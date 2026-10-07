import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bouton,
  Carte,
  Etiquette,
  Avatar,
  BoutonSuivre,
  LienBouton,
  BandeauPi,
} from "@/components/ui-kit";
import { chargerJob, idsVerifies, type JobDb } from "@/lib/annonces";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { BadgeVerifie, BoutonSignaler } from "@/components/Confiance";
import { store, useStore, formatPi } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/$id")({
  head: () => ({
    meta: [
      { title: "Offre d'emploi — Arija" },
      { name: "description", content: "Détail d'une offre d'emploi au Burundi, payée en Pi." },
      { property: "og:title", content: "Offre d'emploi — Arija" },
      { property: "og:description", content: "Postulez en un clic et soyez payé en Pi." },
    ],
  }),
  component: DetailJob,
});

function DetailJob() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const postule = useStore((s) => s.candidatures.includes(id));
  const [job, setJob] = useState<JobDb | null | undefined>(undefined);
  const [emp, setEmp] = useState<Profil | null>(null);
  const [verifie, setVerifie] = useState(false);

  useEffect(() => {
    let vivant = true;
    chargerJob(id)
      .then(async (j) => {
        if (!vivant) return;
        setJob(j);
        if (j) {
          setEmp(await chargerProfilCache(j.employeur_id));
          setVerifie((await idsVerifies([j.employeur_id])).has(j.employeur_id));
        }
      })
      .catch(() => {
        if (vivant) setJob(null);
      });
    return () => {
      vivant = false;
    };
  }, [id]);

  if (job === undefined)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!job) {
    return (
      <Carte className="text-center">
        <p className="font-semibold">Cette offre n'existe plus.</p>
        <LienBouton to="/jobs" taille="sm" className="mt-3">
          Retour aux offres
        </LienBouton>
      </Carte>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button
        onClick={() => navigate({ to: "/jobs" })}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground"
      >
        Retour
      </button>

      <Carte className="space-y-3">
        <h1 className="text-2xl font-semibold text-foreground">{job.titre}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Avatar emoji={emp?.photo_url ?? undefined} nom={emp?.nom ?? undefined} taille="sm" />
          <Link
            to="/profil/$id"
            params={{ id: job.employeur_id }}
            className="text-sm font-semibold"
          >
            {emp?.nom ?? "…"}
          </Link>
          <BadgeVerifie verifie={verifie} />
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Info label="Catégorie" valeur={job.categorie} />
          <Info
            label="Salaire"
            valeur={job.salaire != null ? formatPi(Number(job.salaire)) : "À convenir"}
          />
          <Info label="Durée" valeur={job.duree ?? "—"} />
          <Info label="Lieu" valeur={job.localisation} />
          <Info label="Urgence" valeur={job.urgent ? "Oui" : "Non"} />
          <Info
            label="Publiée le"
            valeur={new Date(job.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
          />
        </dl>

        <div>
          <h2 className="section-label">Description</h2>
          <p className="mt-1 whitespace-pre-line text-sm">{job.description}</p>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="section-label">Profil employeur</h2>
        <div className="flex items-center gap-3">
          <Avatar emoji={emp?.photo_url ?? undefined} nom={emp?.nom ?? undefined} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{emp?.nom ?? "…"}</p>
            {emp?.bio && <p className="text-xs italic text-muted-foreground">« {emp.bio} »</p>}
            {emp?.ville && <p className="text-xs text-muted-foreground">{emp.ville}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LienBouton
            to="/profil/$id"
            params={{ id: job.employeur_id }}
            variante="contour"
            taille="sm"
          >
            Visiter profil
          </LienBouton>
          <BoutonSuivre id={job.employeur_id} />
          <LienBouton
            to="/messages/$id"
            params={{ id: job.employeur_id }}
            variante="secondaire"
            taille="sm"
          >
            Chat
          </LienBouton>
        </div>
      </Carte>

      <BandeauPi texte="Salaire versé en Pi via escrow sécurisé" />

      <div className="sticky bottom-20 flex flex-wrap gap-2 lg:bottom-4">
        <Bouton
          className="flex-1"
          disabled={postule}
          onClick={() => {
            store.postuler(job.id);
            toast.success("Postulation enregistrée !");
          }}
        >
          {postule ? "Postulation envoyée" : "Postuler maintenant"}
        </Bouton>
        <Bouton
          variante="contour"
          taille="sm"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href).then(
              () => toast.success("Lien de l'offre copié !"),
              () => toast("Copiez l'adresse depuis la barre d'URL."),
            );
          }}
        >
          Partager
        </Bouton>
        <BoutonSignaler cibleType="job" cibleId={job.id} utilisateurId={job.employeur_id} />
      </div>

      <Etiquette>Publié le {new Date(job.created_at).toLocaleDateString("fr-FR")}</Etiquette>
    </div>
  );
}

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{valeur}</dd>
    </div>
  );
}
