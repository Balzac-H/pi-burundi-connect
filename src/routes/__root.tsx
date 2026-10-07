import type { ErrorComponentProps } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "../components/AppShell";
import { AssistantArija } from "../components/AssistantArija";

import { EtatReseau } from "../components/EtatReseau";
import { enregistrerServiceWorker } from "../lib/pwa";
import { initTheme } from "../lib/theme";
import { initPiAuDemarrage, PI_SANDBOX } from "../lib/pi";
import { BASE_URL } from "../lib/env";
import { useT } from "../lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-semibold text-foreground">404</h1>
        <h2 className="mt-4 text-lg font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function BandeauModeTest() {
  const t = useT();
  return (
    <div className="bg-attente-bg px-3 py-2 text-center text-xs font-medium text-attente">
      {t("modeTest")}
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Arija — Marché et emplois solidaires au Burundi" },
      {
        name: "description",
        content:
          "Fil d'actualité : nouvelles offres d'emploi, produits tendance et activité de vos suivis, payés en Pi.",
      },
      { name: "author", content: "Arija" },
      { name: "theme-color", content: "#1F4E3D" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Arija" },
      { property: "og:type", content: "website" },
      ...(BASE_URL ? [{ property: "og:url", content: BASE_URL }] : []),
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Arija — Marché et emplois solidaires au Burundi" },
      { name: "twitter:title", content: "Arija — Marché et emplois solidaires au Burundi" },
      {
        property: "og:description",
        content:
          "Fil d'actualité : nouvelles offres d'emploi, produits tendance et activité de vos suivis, payés en Pi.",
      },
      {
        name: "twitter:description",
        content:
          "Fil d'actualité : nouvelles offres d'emploi, produits tendance et activité de vos suivis, payés en Pi.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9bd5e4c1-a346-48b0-823c-12f889e10520/id-preview-42fe7499--4c2efe0c-fc97-45aa-becc-558c99928a5d.lovable.app-1785175859727.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9bd5e4c1-a346-48b0-823c-12f889e10520/id-preview-42fe7499--4c2efe0c-fc97-45aa-becc-558c99928a5d.lovable.app-1785175859727.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      ...(BASE_URL ? [{ rel: "canonical", href: BASE_URL }] : []),
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
    scripts: [
      // SDK Pi 2.0 — indispensable pour l'authentification et les paiements.
      { src: "https://sdk.minepi.com/pi-sdk.js", defer: true },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const chemin = useRouterState({ select: (s) => s.location.pathname });
  const sansShell = chemin.startsWith("/connexion");

  useEffect(() => {
    initTheme();
    enregistrerServiceWorker();
    initPiAuDemarrage();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {PI_SANDBOX && <BandeauModeTest />}
      <EtatReseau />
      {!sansShell && <AssistantArija />}
      <Toaster position="top-center" richColors />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {sansShell ? (
        <Outlet />
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}
    </QueryClientProvider>
  );
}
