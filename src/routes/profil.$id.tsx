import { createFileRoute } from "@tanstack/react-router";
import { ProfilComplet } from "@/components/ProfilComplet";

export const Route = createFileRoute("/profil/$id")({
  head: () => ({
    meta: [
      { title: "Profil — Arija Connect" },
      {
        name: "description",
        content: "Profil d'un membre Arija Connect : avis, offres et ventes vérifiées.",
      },
      { property: "og:title", content: "Profil — Arija Connect" },
      {
        property: "og:description",
        content: "Vérifiez la réputation d'un vendeur ou employeur sur Arija Connect.",
      },
    ],
  }),
  component: PageProfil,
});

function PageProfil() {
  const { id } = Route.useParams();
  return <ProfilComplet id={id} />;
}
