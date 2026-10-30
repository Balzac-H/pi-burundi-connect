import { createFileRoute } from "@tanstack/react-router";
import { ProfilComplet } from "@/components/ProfilComplet";
import { parUtilisateur } from "@/lib/data";

export const Route = createFileRoute("/profil/$id")({
  head: ({ params }) => {
    const u = parUtilisateur(params.id);
    return {
      meta: [
        { title: `${u.nom} — Profil WICO` },
        { name: "description", content: `${u.nom}, ${u.metier} à ${u.ville}. Note ${u.note}/5 sur ${u.avis} avis.` },
        { property: "og:title", content: `${u.nom} — WICO` },
        { property: "og:description", content: u.bio },
      ],
    };
  },
  component: PageProfil,
});

function PageProfil() {
  const { id } = Route.useParams();
  return <ProfilComplet id={id} monProfil={id === "u-moi"} />;
}
