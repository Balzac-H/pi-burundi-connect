import { cn } from "@/lib/utils";
import { Link, createLink } from "@tanstack/react-router";
import { forwardRef, type ReactNode } from "react";

import { Star, MapPin } from "lucide-react";
import { useStore, store } from "@/lib/store";
import { parUtilisateur } from "@/lib/data";

/* ---------------- Boutons ---------------- */

type Variante = "primaire" | "secondaire" | "contour" | "doux" | "pi" | "danger" | "fantome";

const variantes: Record<Variante, string> = {
  primaire: "gradient-primary text-primary-foreground shadow-[var(--shadow-card)] hover:opacity-90",
  secondaire: "bg-secondary text-secondary-foreground hover:opacity-90",
  contour: "border border-border bg-card text-foreground hover:bg-muted",
  doux: "bg-primary-soft text-primary hover:bg-primary-soft/70",
  pi: "gradient-pi text-primary-foreground hover:opacity-90",
  danger: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  fantome: "text-muted-foreground hover:bg-muted",
};

export function Bouton({
  variante = "primaire",
  className,
  taille = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; taille?: "sm" | "md" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50",
        taille === "sm" && "min-h-9 px-3 text-xs",
        variantes[variante],
        className,
      )}
    />
  );
}

const AncreStylisee = forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { variante?: Variante; taille?: "sm" | "md" }
>(({ variante = "primaire", taille = "md", className, ...props }, ref) => (
  <a
    ref={ref}
    {...props}
    className={cn(
      "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-all active:scale-[0.98]",
      taille === "sm" && "min-h-9 px-3 text-xs",
      variantes[variante],
      className,
    )}
  />
));
AncreStylisee.displayName = "AncreStylisee";

export const LienBouton = createLink(AncreStylisee);


/* ---------------- Carte ---------------- */

export function Carte({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("card-surface p-4", className)} />;
}

export function TitreSection({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-primary sm:text-xl">{children}</h2>
      {action}
    </div>
  );
}

export function Etiquette({
  children,
  ton = "neutre",
}: {
  children: ReactNode;
  ton?: "neutre" | "urgent" | "succes" | "pi";
}) {
  const tons = {
    neutre: "bg-muted text-muted-foreground",
    urgent: "bg-secondary/20 text-secondary-foreground",
    succes: "bg-success/15 text-success",
    pi: "gradient-pi text-primary-foreground",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tons[ton])}>
      {children}
    </span>
  );
}

export function Note({ note, avis }: { note: number; avis?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
      <Star className="size-3.5 fill-secondary text-secondary" />
      {note.toFixed(1)}
      {avis !== undefined && <span className="font-normal text-muted-foreground">({avis} avis)</span>}
    </span>
  );
}

export function Distance({ km }: { km: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MapPin className="size-3.5" /> {km} km
    </span>
  );
}

/* ---------------- Avatar & mini profil ---------------- */

export function Avatar({ emoji, taille = "md" }: { emoji: string; taille?: "sm" | "md" | "lg" }) {
  const tailles = { sm: "size-9 text-lg", md: "size-12 text-2xl", lg: "size-20 text-4xl" };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft",
        tailles[taille],
      )}
    >
      {emoji}
    </span>
  );
}

export function LigneUtilisateur({ id, sousTitre }: { id: string; sousTitre?: string }) {
  const u = parUtilisateur(id);
  return (
    <Link to="/profil/$id" params={{ id }} className="flex items-center gap-2">
      <Avatar emoji={u.emoji} taille="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{u.nom}</span>
        <span className="flex items-center gap-2">
          <Note note={u.note} />
          <Distance km={u.distanceKm} />
        </span>
        {sousTitre && <span className="block text-xs text-muted-foreground">{sousTitre}</span>}
      </span>
    </Link>
  );
}

/* ---------------- Follow ---------------- */

export function BoutonSuivre({ id, taille = "sm" }: { id: string; taille?: "sm" | "md" }) {
  const suivi = useStore((s) => s.suivis.includes(id));
  return (
    <Bouton
      taille={taille}
      variante={suivi ? "contour" : "doux"}
      onClick={(e) => {
        e.preventDefault();
        store.basculerSuivi(id);
      }}
    >
      {suivi ? "SUIVI ✓" : "FOLLOW"}
    </Bouton>
  );
}

/* ---------------- Champs de formulaire ---------------- */

export function Champ({
  label,
  obligatoire,
  children,
  aide,
}: {
  label: string;
  obligatoire?: boolean;
  children: ReactNode;
  aide?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold">
        {label} {obligatoire && <span className="text-secondary">*</span>}
      </span>
      {children}
      {aide && <span className="block text-xs text-muted-foreground">{aide}</span>}
    </label>
  );
}

const baseChamp =
  "w-full min-h-11 rounded-lg border border-input bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20";

export function Saisie(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseChamp, props.className)} />;
}

export function Zone(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(baseChamp, "min-h-24 py-2", props.className)} />;
}

export function Selection(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(baseChamp, props.className)} />;
}

/* ---------------- Bandeau Pi ---------------- */

export function BandeauPi({ texte = "Paiement sécurisé via Pi Network" }: { texte?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-pi-gold/40 bg-pi-gold/10 px-3 py-2 text-xs font-semibold text-foreground">
      <span className="grid size-6 place-items-center rounded-full gradient-pi text-primary-foreground">π</span>
      🔒 {texte}
    </div>
  );
}
