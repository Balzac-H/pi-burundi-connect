import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Briefcase, ShoppingBag, MessageCircle, User, Bell, Wallet, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { ReactNode } from "react";

const onglets = [
  { to: "/", label: "Accueil", icone: Home },
  { to: "/jobs", label: "Jobs", icone: Briefcase },
  { to: "/market", label: "Market", icone: ShoppingBag },
  { to: "/messages", label: "Chat", icone: MessageCircle },
  { to: "/profil", label: "Profil", icone: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const chemin = useRouterState({ select: (s) => s.location.pathname });
  const nonLues = useStore((s) => s.notificationsNonLues);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl gradient-primary text-lg font-bold text-primary-foreground">
              π
            </span>
            <span className="text-sm font-bold leading-tight text-primary sm:text-base">
              BURUNDI
              <span className="block text-[0.65rem] font-semibold tracking-widest text-secondary sm:text-xs">
                PI CONNECT
              </span>
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {[
              { to: "/jobs", label: "Jobs" },
              { to: "/market", label: "Market" },
              { to: "/messages", label: "Messages" },
              { to: "/portefeuille", label: "Wallet" },
              { to: "/favoris", label: "Favoris" },
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
            <Link to="/portefeuille" className="hidden rounded-lg p-2 text-primary hover:bg-muted sm:block" aria-label="Portefeuille Pi">
              <Wallet className="size-5" />
            </Link>
            <Link to="/favoris" className="hidden rounded-lg p-2 text-primary hover:bg-muted sm:block" aria-label="Favoris">
              <Heart className="size-5" />
            </Link>
            <Link to="/notifications" className="relative rounded-lg p-2 text-primary hover:bg-muted" aria-label="Notifications">
              <Bell className="size-5" />
              {nonLues > 0 && (
                <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-secondary text-[0.6rem] font-bold text-secondary-foreground">
                  {nonLues}
                </span>
              )}
            </Link>
            <Link to="/parametres" className="rounded-lg p-2 text-primary hover:bg-muted" aria-label="Paramètres">
              <Settings className="size-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 lg:pb-10">{children}</main>

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
                {o.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
