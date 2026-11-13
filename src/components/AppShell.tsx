import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, LogIn, Menu, Moon, ShoppingCart, Sun } from "lucide-react";
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
import { definirTheme, useTheme } from "@/lib/theme";
import { BoutonRetour } from "@/components/ui-kit";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import type { ReactNode } from "react";

const onglets = [
  { to: "/", cle: "accueil" },
  { to: "/jobs", cle: "jobs" },
  { to: "/market", cle: "market" },
  { to: "/messages", cle: "chat" },
  { to: "/profil", cle: "profil" },
] as const;

const liensPrincipaux = [
  { to: "/jobs", cle: "jobs" },
  { to: "/market", cle: "market" },
  { to: "/messages", cle: "chat" },
] as const;

const liensSecondaires = [
  { to: "/portefeuille", cle: "mesCommandes" },
  { to: "/activite", cle: "monActivite" },
  { to: "/vendeurs", cle: "vendeurs" },
  { to: "/favoris", cle: "favoris" },
  { to: "/parametres", cle: "parametres" },
  { to: "/a-propos", cle: "aPropos" },
  { to: "/transparence", cle: "transparence" },
] as const;

const liensMenuMobile = [
  { to: "/", cle: "accueil" },
  ...liensPrincipaux,
  { to: "/profil", cle: "profil" },
  ...liensSecondaires,
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const chemin = useRouterState({ select: (s) => s.location.pathname });
  const { utilisateur } = useSession();
  useAlertesTempsReel(!!utilisateur, utilisateur?.id);
  const notifs = useNotifsLive();
  const nonLues = compterNonLues(notifs);
  const nbPanier = useStore((st) => compterPanier(st.panier));
  const [logoAbsent, setLogoAbsent] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);

  useEffect(() => {
    if (utilisateur?.id) chargerNotificationsBd(utilisateur.id).catch(() => undefined);
  }, [utilisateur?.id]);

  useEffect(() => {
    chargerEtatLocal();
  }, []);

  useEffect(() => {
    setMenuOuvert(false);
  }, [chemin]);

  const t = useT();
  const langue = useLangue();
  const theme = useTheme();
  const sombre =
    theme === "sombre" ||
    (theme === "auto" &&
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"));

  const estActif = (to: string) =>
    to === "/" ? chemin === "/" : chemin === to || chemin.startsWith(`${to}/`);
  const secondaireActif = liensSecondaires.some((l) => estActif(l.to));
  const basculerTheme = () => definirTheme(sombre ? "clair" : "sombre");

  const nomCompte =
    (
      utilisateur?.user_metadata as
        { full_name?: string; name?: string; username?: string } | undefined
    )?.full_name ||
    (utilisateur?.user_metadata as { name?: string; username?: string } | undefined)?.name ||
    (utilisateur?.user_metadata as { username?: string } | undefined)?.username ||
    utilisateur?.email ||
    "P";
  const initiale = nomCompte.trim().charAt(0).toUpperCase() || "P";

  const lienNavigation =
    "inline-flex min-h-11 items-center rounded-md px-2 py-1.5 text-sm transition-colors duration-150 whitespace-nowrap";
  const lienActif = "font-semibold text-primary";
  const lienInactif = "font-medium text-muted-foreground hover:text-foreground";
  const actionHeader =
    "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 w-full max-w-full border-b border-border bg-card [padding-left:env(safe-area-inset-left)] [padding-right:env(safe-area-inset-right)] [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 items-center gap-1.5 px-3 py-2 sm:px-4 md:gap-3 md:py-3">
          <Link
            to="/"
            className="flex min-w-0 shrink items-center gap-2 overflow-hidden md:shrink-0"
            aria-label="Arija Connect"
          >
            {!logoAbsent && (
              <img
                src="/logo-true.jpeg"
                alt=""
                className="size-8 shrink-0 rounded-md object-cover sm:size-9"
                onError={() => setLogoAbsent(true)}
              />
            )}
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-bold text-primary sm:text-[15px]">
                Arija Connect
              </span>
              <span className="hidden truncate text-[11px] leading-tight text-muted-foreground lg:block">
                {t("sousTitre")}
              </span>
            </span>
          </Link>

          <nav
            aria-label={t("menu")}
            className="ml-2 hidden min-w-0 shrink-0 items-center gap-0.5 md:flex lg:ml-4 lg:gap-1"
          >
            {liensPrincipaux.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(lienNavigation, estActif(l.to) ? lienActif : lienInactif)}
              >
                {t(l.cle)}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    lienNavigation,
                    "gap-0.5",
                    secondaireActif ? lienActif : lienInactif,
                  )}
                >
                  {t("plus")}
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {liensSecondaires.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link
                      to={l.to}
                      className={cn(
                        "flex min-h-11 w-full cursor-pointer items-center rounded-sm px-2 text-sm",
                        estActif(l.to) ? "font-semibold text-primary" : "text-foreground",
                      )}
                    >
                      {t(l.cle)}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    basculerTheme();
                  }}
                  className="min-h-11 gap-2"
                >
                  {sombre ? (
                    <Sun className="size-4" aria-hidden />
                  ) : (
                    <Moon className="size-4" aria-hidden />
                  )}
                  {sombre ? t("themeClair") : t("themeSombre")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-1 md:gap-2">
            <select
              aria-label={t("langue")}
              value={langue}
              onChange={(e) => definirLangue(e.target.value as Langue)}
              className="hidden min-h-11 rounded-md border border-border bg-card px-1.5 text-xs font-semibold text-foreground md:block"
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
                "relative",
                actionHeader,
                estActif("/notifications") ? "text-primary" : "text-muted-foreground",
              )}
              aria-label={
                nonLues > 0
                  ? `${t("notifications")} (${nonLues > 99 ? "99+" : nonLues})`
                  : t("notifications")
              }
              title={t("notifications")}
            >
              <Bell className="size-5" aria-hidden />
              {nonLues > 0 && (
                <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] leading-4 text-primary-foreground">
                  {nonLues > 99 ? "99+" : nonLues}
                </span>
              )}
            </Link>

            <Link
              to="/panier"
              className={cn(
                "relative",
                actionHeader,
                estActif("/panier") ? "text-primary" : "text-foreground",
              )}
              aria-label={
                nbPanier > 0 ? `${t("panier")} (${nbPanier > 99 ? "99+" : nbPanier})` : t("panier")
              }
              title={t("panier")}
            >
              <ShoppingCart className="size-5" aria-hidden />
              {nbPanier > 0 && (
                <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.6rem] leading-4 text-primary-foreground">
                  {nbPanier > 99 ? "99+" : nbPanier}
                </span>
              )}
            </Link>

            {utilisateur ? (
              <Link
                to="/profil"
                className={cn(
                  actionHeader,
                  estActif("/profil") ? "text-primary" : "text-foreground",
                )}
                aria-label={t("profil")}
                title={t("profil")}
              >
                <span className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initiale}
                </span>
              </Link>
            ) : (
              <Link
                to="/connexion"
                className={cn(actionHeader, "text-primary")}
                aria-label={t("seConnecterPi")}
                title={t("seConnecter")}
              >
                <LogIn className="size-5" aria-hidden />
              </Link>
            )}

            <Sheet open={menuOuvert} onOpenChange={setMenuOuvert}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(actionHeader, "md:hidden")}
                  aria-label={menuOuvert ? t("fermerMenu") : t("ouvrirMenu")}
                >
                  <Menu className="size-5" aria-hidden />
                  <span className="sr-only">{menuOuvert ? t("fermerMenu") : t("ouvrirMenu")}</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(22rem,100vw)] max-w-full overflow-y-auto pb-[env(safe-area-inset-bottom)] [&>button]:grid [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:place-items-center"
              >
                <SheetHeader className="text-left">
                  <SheetTitle>{t("menu")}</SheetTitle>
                  <SheetDescription className="sr-only">{t("sousTitre")}</SheetDescription>
                </SheetHeader>

                <nav aria-label={t("menu")} className="mt-4 flex flex-col gap-1">
                  {liensMenuMobile.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setMenuOuvert(false)}
                      className={cn(
                        "flex min-h-11 items-center rounded-md px-3 text-sm transition-colors",
                        estActif(l.to)
                          ? "bg-accent font-semibold text-primary"
                          : "font-medium text-foreground hover:bg-accent",
                      )}
                    >
                      {t(l.cle)}
                    </Link>
                  ))}
                </nav>

                <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="langue-menu-mobile"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      {t("langue")}
                    </label>
                    <select
                      id="langue-menu-mobile"
                      value={langue}
                      onChange={(e) => definirLangue(e.target.value as Langue)}
                      className="min-h-11 w-full rounded-md border border-border bg-card px-2 text-sm font-semibold text-foreground"
                    >
                      {langues.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nom} ({l.code.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={basculerTheme}
                    className="flex min-h-11 w-full items-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    {sombre ? (
                      <Sun className="size-4" aria-hidden />
                    ) : (
                      <Moon className="size-4" aria-hidden />
                    )}
                    {sombre ? t("themeClair") : t("themeSombre")}
                  </button>

                  {utilisateur ? (
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuOuvert(false);
                        await seDeconnecter();
                        toast.success("Vous êtes déconnecté.");
                      }}
                      className="flex min-h-11 w-full items-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {t("seDeconnecter")}
                    </button>
                  ) : (
                    <Link
                      to="/connexion"
                      onClick={() => setMenuOuvert(false)}
                      className="flex min-h-11 w-full items-center rounded-md border border-border px-3 text-sm font-semibold text-primary transition-colors hover:bg-accent"
                    >
                      {t("seConnecter")}
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
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
          <Link to="/support" className="hover:text-primary">
            {t("support")}
          </Link>
        </nav>
        <p className="mx-auto mt-4 max-w-3xl leading-relaxed">{t("initiativeOng")}</p>
        <p className="mt-1">{t("sousTitre")}</p>
        <p className="mx-auto mt-3 max-w-3xl text-xs text-muted-foreground">
          {t("mentionIndependante")}
        </p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
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
