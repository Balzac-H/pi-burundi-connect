import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
// TODO: renseigner l'URL publique du site (domaine Lovable ou personnalisé).
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/jobs", changefreq: "daily", priority: "0.9" },
          { path: "/market", changefreq: "daily", priority: "0.9" },
          { path: "/jobs/creer", changefreq: "monthly", priority: "0.5" },
          { path: "/market/vendre", changefreq: "monthly", priority: "0.5" },
          { path: "/market/boutique", changefreq: "weekly", priority: "0.5" },
          { path: "/connexion", changefreq: "monthly", priority: "0.4" },
          { path: "/conditions", changefreq: "yearly", priority: "0.3" },
          { path: "/confidentialite", changefreq: "yearly", priority: "0.3" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
