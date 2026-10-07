import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, seDeconnecter } from "@/lib/auth";
import { chargerEtatLocal, compterPanier, useStore } from "@/lib/store";
import {
  useAlertesTempsReel,
  useNotifsLive,
  compterNonLues,
  chargerNotificationsBd,
} from "@/lib/notifications";
import { useEffect, useState } from "react";
import { useT, useLangue, definirLangue, langues, type Langue } from "@/lib/i18n";
import { BoutonRetour } from "@/components/ui-kit";
import { toast } from "sonner";
import type { ReactNode } from "react";

const onglets = [
  { to: "/", cle: "accueil" },
  { to: "/jobs", cle: "jobs" },
  { to: "/market", cle: "market" },
  { to: "/messages", cle: "chat" },
  { to: "/profil", cle: "profil" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const chemin = useRouterState({ select: (s) => s.location.pathname });
  const { utilisateur } = useSession();
  useAlertesTempsReel(!!utilisateur, utilisateur?.id);
  const notifs = useNotifsLive();
  const nonLues = compterNonLues(notifs);
  const nbPanier = useStore((st) => compterPanier(st.panier));
  const [logoAbsent, setLogoAbsent] = useState(false);

  useEffect(() => {
    if (utilisateur?.id) chargerNotificationsBd(utilisateur.id).catch(() => undefined);
  }, [utilisateur?.id]);

  useEffect(() => {
    chargerEtatLocal();
  }, []);
  const t = useT();
  const langue = useLangue();

  const lienNavigation =
    "rounded-md px-2 py-1.5 text-sm transition-colors duration-150 whitespace-nowrap";
  const lienActif = "font-semibold text-primary";
  const lienInactif = "font-medium text-muted-foreground hover:text-foreground";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            {logoAbsent ? (
              <span className="text-lg leading-none font-bold text-primary">Arija</span>
            ) : (
              <img
                src="/logo-arija.svg"
                alt="Arija"
                className="h-7 w-auto"
                onError={() => setLogoAbsent(true)}
              />
            )}
            <span className="hidden text-xs leading-tight text-muted-foreground sm:block">
              {t("sousTitre")}
            </span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {[
              { to: "/jobs", label: t("jobs") },
              { to: "/market", label: t("market") },
              { to: "/messages", label: t("chat") },
              { to: "/portefeuille", label: t("mesCommandes") },
              { to: "/activite", label: t("monActivite") },
              { to: "/vendeurs", label: t("vendeurs") },
              { to: "/favoris", label: t("favoris") },
              { to: "/a-propos", label: t("aPropos") },
              { to: "/transparence", label: t("transparence") },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(lienNavigation, chemin.startsWith(l.to) ? lienActif : lienInactif)}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <select
              aria-label={t("langue")}
              value={langue}
              onChange={(e) => definirLangue(e.target.value as Langue)}
              className="min-h-11 rounded-md border border-border bg-card px-1.5 text-xs font-semibold text-foreground"
            >
              {langues.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code.toUpperCase()}
                </option>
              ))}
            </select>
            <Link
              to="/notifications"
              className={cn(
                "relative min-h-11 rounded-md px-2 text-xs",
                chemin.startsWith("/notifications") ? lienActif : lienInactif,
              )}
            >
              {t("notifications")}
              {nonLues > 0 && (
                <span className="ml-1 font-semibold text-primary">
                  ({nonLues > 99 ? "99+" : nonLues})
                </span>
              )}
            </Link>
            <Link
              to="/parametres"
              className={cn(
                "hidden min-h-11 rounded-md px-2 text-xs sm:block",
                chemin.startsWith("/parametres") ? lienActif : lienInactif,
              )}
            >
              {t("parametres")}
            </Link>
            <Link
              to="/panier"
              className="relative flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-foreground transition-colors duration-150 hover:text-primary"
              aria-label={t("panier")}
              title={t("panier")}
            >
              <ShoppingCart className="size-5" aria-hidden />
              <span className="hidden sm:inline">{t("panier")}</span>
              {nbPanier > 0 && (
                <span className="grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] leading-4 text-primary-foreground">
                  {nbPanier > 99 ? "99+" : nbPanier}
                </span>
              )}
            </Link>
            {utilisateur ? (
              <button
                type="button"
                className="hidden min-h-11 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground sm:block"
                onClick={async () => {
                  await seDeconnecter();
                  toast.success("Vous êtes déconnecté.");
                }}
              >
                {t("seDeconnecter")}
              </button>
            ) : (
              <Link
                to="/connexion"
                className="min-h-11 rounded-md px-2 text-xs font-semibold text-primary transition-colors duration-150 hover:underline"
              >
                {t("seConnecter")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {chemin !== "/" && (
        <div className="mx-auto w-full max-w-6xl px-4 pt-3">
          <BoutonRetour label={t("retour")} />
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-4 lg:pb-10">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 text-center text-xs text-muted-foreground lg:pb-10">
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-medium">
          <Link to="/a-propos" className="hover:text-primary">
            {t("aPropos")}
          </Link>
          <Link to="/transparence" className="hover:text-primary">
            {t("transparence")}
          </Link>
          <Link to="/conditions" className="hover:text-primary">
            {t("conditions")}
          </Link>
          <Link to="/confidentialite" className="hover:text-primary">
            {t("confidentialite")}
          </Link>
          <Link to="/a-propos" hash="support" className="hover:text-primary">
            {t("support")}
          </Link>
        </nav>
        <p className="mx-auto mt-4 max-w-3xl leading-relaxed">{t("nomCompletOng")}</p>
        <p className="mt-1">{t("sousTitre")}</p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch">
          {onglets.map((o) => {
            const actif = o.to === "/" ? chemin === "/" : chemin.startsWith(o.to);
            return (
              <Link
                key={o.to}
                to={o.to}
                className={cn(
                  "flex min-h-12 flex-1 items-center justify-center px-1 py-3 text-center text-xs",
                  actif
                    ? "font-bold text-primary underline decoration-2 underline-offset-4"
                    : "font-medium text-muted-foreground",
                )}
              >
                {t(o.cle)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
