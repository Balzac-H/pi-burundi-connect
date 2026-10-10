import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { urlAbsolue } from "@/lib/env";

export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: () => {
        const racine = urlAbsolue("/");
        const manifest = {
          name: "Arija Connect — Marché et emplois solidaires au Burundi",
          short_name: "Arija Connect",
          description: "Marché et emplois solidaires au Burundi, payés en Pi.",
          start_url: racine,
          scope: racine,
          display: "standalone",
          background_color: "#FBFAF7",
          theme_color: "#1F4E3D",
          lang: "fr",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        };
        return new Response(JSON.stringify(manifest, null, 2), {
          headers: {
            "Content-Type": "application/manifest+json",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
