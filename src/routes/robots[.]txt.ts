import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { BASE_URL } from "@/lib/env";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const lignes = ["User-agent: *", "Allow: /"];
        if (BASE_URL) lignes.push("", `Sitemap: ${BASE_URL}/sitemap.xml`);
        return new Response(`${lignes.join("\n")}\n`, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
