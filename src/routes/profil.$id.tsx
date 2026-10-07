import { createFileRoute } from "@tanstack/react-router";
import { ProfilComplet } from "@/components/ProfilComplet";

export const Route = createFileRoute("/profil/$id")({
  head: () => ({
    meta: [
      { title: "Profil — Arija" },
      {
        name: "description",
        content: "Profil d'un membre Arija : avis, offres et ventes vérifiées.",
      },
      { property: "og:title", content: "Profil — Arija" },
      {
        property: "og:description",
        content: "Vérifiez la réputation d'un vendeur ou employeur sur Arija.",
      },
    ],
  }),
  component: PageProfil,
});

function PageProfil() {
  const { id } = Route.useParams();
  return <ProfilComplet id={id} />;
}
