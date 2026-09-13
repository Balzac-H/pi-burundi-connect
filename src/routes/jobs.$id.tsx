import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bouton, Carte, Etiquette, Avatar, Note, BoutonSuivre, LienBouton, BandeauPi } from "@/components/ui-kit";
import { parJob, parUtilisateur } from "@/lib/data";
import { store, useStore } from "@/lib/store";
import { bientotDisponible } from "@/lib/utils";
import { ArrowLeft, Share2, Flag } from "lucide-react";

export const Route = createFileRoute("/jobs/$id")({
  head: ({ params }) => {
    const j = parJob(params.id);
    return {
      meta: [
        { title: j ? `${j.titre} — Emploi ${j.salaire}` : "Offre introuvable" },
        { name: "description", content: j ? `${j.categorie} à ${j.lieu}. Salaire ${j.salaire}, durée ${j.duree}.` : "Cette offre n'existe pas." },
        { property: "og:title", content: j ? `${j.titre} — BURUNDI PI CONNECT` : "Offre introuvable" },
        { property: "og:description", content: j ? j.description.slice(0, 150) : "Offre d'emploi indisponible." },
      ],
    };
  },
  component: DetailJob,
});

function DetailJob() {
  const { id } = Route.useParams();
  const job = parJob(id);
  const navigate = useNavigate();
  const postule = useStore((s) => s.candidatures.includes(id));

  if (!job) {
    return (
      <Carte className="text-center">
        <p className="font-semibold">Cette offre n'existe plus.</p>
        <LienBouton to="/jobs" taille="sm" className="mt-3">Retour aux offres</LienBouton>
      </Carte>
    );
  }

  const emp = parUtilisateur(job.employeurId);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <button onClick={() => navigate({ to: "/jobs" })} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
        <ArrowLeft className="size-4" /> RETOUR
      </button>

      <Carte className="space-y-3">
        <h1 className="text-2xl font-extrabold text-primary">{job.titre}</h1>
        <div className="flex items-center gap-2">
          <Avatar emoji={emp.emoji} taille="sm" />
          <Link to="/profil/$id" params={{ id: emp.id }} className="text-sm font-semibold">{emp.nom}</Link>
          <Note note={emp.note} avis={emp.avis} />
        </div>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Info label="💼 Catégorie" valeur={job.categorie} />
          <Info label="💰 Salaire" valeur={job.salaire} />
          <Info label="⏱️ Durée" valeur={job.duree} />
          <Info label="📍 Lieu" valeur={job.lieu} />
          <Info label="⚡ Urgence" valeur={job.urgent ? "OUI" : "Non"} />
          <Info label="👥 Postes" valeur={`${job.postes} ouvrier(s)`} />
          <Info label="📅 Date" valeur={job.dateDebut} />
          <Info label="🎓 Niveau" valeur={job.niveau} />
          <Info label="📄 Certification" valeur={job.certification ? "Requise" : "Non requise"} />
        </dl>

        <div>
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Description</h2>
          <p className="mt-1 text-sm">{job.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {job.competences.map((c) => (
            <Etiquette key={c}>{c}</Etiquette>
          ))}
        </div>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Profil employeur</h2>
        <div className="flex items-center gap-3">
          <Avatar emoji={emp.emoji} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{emp.nom}</p>
            <p className="text-xs italic text-muted-foreground">« {emp.bio} »</p>
            <p className="text-xs text-muted-foreground">
              ✅ {emp.jobsCompletes} emplois publiés · ✅ {emp.satisfaction} % satisfaction
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LienBouton to="/profil/$id" params={{ id: emp.id }} variante="contour" taille="sm">VISITER PROFIL</LienBouton>
          <BoutonSuivre id={emp.id} />
          <LienBouton to="/messages" variante="secondaire" taille="sm">CHAT</LienBouton>
        </div>
      </Carte>

      <BandeauPi texte="Salaire versé en Pi via escrow sécurisé" />

      <div className="sticky bottom-20 flex flex-wrap gap-2 lg:bottom-4">
        <Bouton
          className="flex-1"
          disabled={postule}
          onClick={() => {
            store.postuler(job.id);
            toast.success("Postulation envoyée à " + emp.nom + " !");
          }}
        >
          {postule ? "POSTULATION ENVOYÉE ✓" : "POSTULER MAINTENANT"}
        </Bouton>
        <Bouton variante="contour" taille="sm" onClick={() => bientotDisponible("Le partage d'offre")}>
          <Share2 className="size-4" /> PARTAGER
        </Bouton>
        <Bouton variante="danger" taille="sm" onClick={() => bientotDisponible("Le signalement")}>
          <Flag className="size-4" /> SIGNALER
        </Bouton>
      </div>
    </div>
  );
}

function Info({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{valeur}</dd>
    </div>
  );
}
