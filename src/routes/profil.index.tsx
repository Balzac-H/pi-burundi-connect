import { createFileRoute } from "@tanstack/react-router";
import { ProfilComplet } from "@/components/ProfilComplet";

export const Route = createFileRoute("/profil/")({
  head: () => ({
    meta: [
      { title: "Mon profil — BURUNDI PI CONNECT" },
      { name: "description", content: "Consultez vos statistiques, vos avis, vos jobs complétés et vos ventes sur Burundi Pi Connect." },
      { property: "og:title", content: "Mon profil — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Vos statistiques, avis et historique sur la plateforme." },
    ],
  }),
  component: () => <ProfilComplet id="u-moi" monProfil />,
});
