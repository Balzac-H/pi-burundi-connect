import { createFileRoute } from "@tanstack/react-router";
import { ProfilComplet } from "@/components/ProfilComplet";

export const Route = createFileRoute("/profil/$id")({
  head: () => ({
    meta: [
      { title: "Profil — WICO" },
      {
        name: "description",
        content: "Profil d'un membre WICO : avis, offres et ventes vérifiées.",
      },
      { property: "og:title", content: "Profil — WICO" },
      {
        property: "og:description",
        content: "Vérifiez la réputation d'un vendeur ou employeur sur WICO.",
      },
    ],
  }),
  component: PageProfil,
});

function PageProfil() {
  const { id } = Route.useParams();
  return <ProfilComplet id={id} />;
}
