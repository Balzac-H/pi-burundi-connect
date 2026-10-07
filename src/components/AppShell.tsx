import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Briefcase,
  ShoppingBag,
  MessageCircle,
  User,
  Bell,
  Wallet,
  Heart,
  Settings,
  LogIn,
  LogOut,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, seDeconnecter } from "@/lib/auth";
import { chargerEtatLocal, compterPanier, useStore } from "@/lib/store";
import {
  useAlertesTempsReel,
  useNotifsLive,
  compterNonLues,
  chargerNotificationsBd,
} from "@/lib/notifications";
import { useEffect } from "react";
import { useT, useLangue, definirLangue, langues, type Langue } from "@/lib/i18n";
import { BoutonRetour } from "@/components/ui-kit";
import { toast } from "sonner";
import type { ReactNode } from "react";

const onglets = [
  { to: "/", cle: "accueil", icone: Home },
  { to: "/jobs", cle: "jobs", icone: Briefcase },
  { to: "/market", cle: "market", icone: ShoppingBag },
  { to: "/messages", cle: "chat", icone: MessageCircle },
  { to: "/profil", cle: "profil", icone: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const chemin = useRouterState({ select: (s) => s.location.pathname });
  const { utilisateur } = useSession();
  useAlertesTempsReel(!!utilisateur, utilisateur?.id);
  const notifs = useNotifsLive();
  const nonLues = compterNonLues(notifs);
  const nbPanier = useStore((st) => compterPanier(st.panier));

  useEffect(() => {
    if (utilisateur?.id) chargerNotificationsBd(utilisateur.id).catch(() => undefined);
  }, [utilisateur?.id]);

  useEffect(() => {
    chargerEtatLocal();
  }, []);
  const t = useT();
  const langue = useLangue();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl gradient-primary text-lg font-bold text-primary-foreground">
              π
            </span>
            <span className="text-base font-extrabold leading-tight tracking-wide text-primary sm:text-lg">
              WICO
              <span className="block text-[0.6rem] font-semibold tracking-widest text-secondary sm:text-[0.65rem]">
                WISDOM CONNECT
              </span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {[
              { to: "/jobs", label: t("jobs") },
              { to: "/market", label: t("market") },
              { to: "/messages", label: t("chat") },
              { to: "/portefeuille", label: t("mesCommandes") },
              { to: "/activite", label: t("monActivite") },
              { to: "/vendeurs", label: t("vendeurs") },
              { to: "/favoris", label: t("favoris") },
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted",
                  chemin.startsWith(l.to) && "bg-primary-soft text-primary",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <select
              aria-label={t("langue")}
              value={langue}
              onChange={(e) => definirLangue(e.target.value as Langue)}
              className="min-h-9 rounded-lg border border-border bg-card px-1.5 text-xs font-semibold text-foreground"
            >
              {langues.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.drapeau} {l.code.toUpperCase()}
                </option>
              ))}
            </select>
            <Link
              to="/panier"
              className="relative rounded-lg p-2 text-primary hover:bg-muted"
              aria-label={t("panier")}
              title={t("panier")}
            >
              <ShoppingCart className="size-5" />
              {nbPanier > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-secondary px-1 text-[0.6rem] font-bold leading-4 text-secondary-foreground">
                  {nbPanier > 99 ? "99+" : nbPanier}
                </span>
              )}
            </Link>
            <Link
              to="/portefeuille"
              className="hidden rounded-lg p-2 text-primary hover:bg-muted sm:block"
              aria-label="Portefeuille Pi"
            >
              <Wallet className="size-5" />
            </Link>
            <Link
              to="/favoris"
              className="hidden rounded-lg p-2 text-primary hover:bg-muted sm:block"
              aria-label="Favoris"
            >
              <Heart className="size-5" />
            </Link>
            <Link
              to="/notifications"
              className="relative rounded-lg p-2 text-primary hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              {nonLues > 0 && (
                <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-secondary text-[0.6rem] font-bold text-secondary-foreground">
                  {nonLues}
                </span>
              )}
            </Link>
            <Link
              to="/parametres"
              className="rounded-lg p-2 text-primary hover:bg-muted"
              aria-label="Paramètres"
            >
              <Settings className="size-5" />
            </Link>
            {utilisateur ? (
              <button
                className="rounded-lg p-2 text-primary hover:bg-muted"
                aria-label={t("seDeconnecter")}
                onClick={async () => {
                  await seDeconnecter();
                  toast.success("Vous êtes déconnecté.");
                }}
              >
                <LogOut className="size-5" />
              </button>
            ) : (
              <Link
                to="/connexion"
                className="rounded-lg p-2 text-primary hover:bg-muted"
                aria-label={t("seConnecter")}
              >
                <LogIn className="size-5" />
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

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 lg:pb-10">{children}</main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 text-center text-xs text-muted-foreground lg:pb-8">
        <div className="flex flex-wrap justify-center gap-4 font-semibold">
          <Link to="/conditions" className="hover:text-primary">
            {t("conditions")}
          </Link>
          <Link to="/confidentialite" className="hover:text-primary">
            {t("confidentialite")}
          </Link>
          <Link to="/portefeuille" className="hover:text-primary">
            {t("mesCommandes")}
          </Link>
        </div>
        <p className="mt-2">WICO · WISDOM CONNECT — {t("sloganAccueil")}</p>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch">
          {onglets.map((o) => {
            const actif = o.to === "/" ? chemin === "/" : chemin.startsWith(o.to);
            const Icone = o.icone;
            return (
              <Link
                key={o.to}
                to={o.to}
                className={cn(
                  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[0.65rem] font-semibold",
                  actif ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icone className={cn("size-5", actif && "text-accent")} />
                {t(o.cle)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
