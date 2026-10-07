import { cn } from "@/lib/utils";
import { Link, createLink, useRouter } from "@tanstack/react-router";
import { forwardRef, type ReactNode } from "react";

import { useEffect, useState } from "react";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { suivre, nePlusSuivre } from "@/lib/social";
import { supabase } from "@/integrations/supabase/client";

/* ---------------- Boutons ---------------- */

type Variante = "primaire" | "secondaire" | "contour" | "doux" | "pi" | "danger" | "fantome";

const variantes: Record<Variante, string> = {
  primaire: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondaire: "border border-border bg-card text-foreground hover:bg-muted",
  contour: "border border-primary/40 text-primary hover:bg-primary-soft",
  doux: "bg-primary-soft text-primary hover:bg-primary-soft/70",
  pi: "bg-primary text-primary-foreground hover:bg-primary/90",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  fantome: "text-muted-foreground hover:bg-muted",
};

const baseBouton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors duration-150 disabled:opacity-50";

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
        baseBouton,
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
      baseBouton,
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
      <h2 className="text-lg font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

/* ---------------- Étiquette d'état ---------------- */

type Ton = "neutre" | "urgent" | "succes" | "pi" | "attente";

const tonsEtiquette: Record<Ton, string> = {
  neutre: "bg-muted text-muted-foreground",
  urgent: "bg-destructive/10 text-destructive",
  succes: "bg-success/12 text-success",
  pi: "text-primary",
  attente: "bg-attente-bg text-attente",
};

export function Etiquette({ children, ton = "neutre" }: { children: ReactNode; ton?: Ton }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
        tonsEtiquette[ton],
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Avatar & mini profil ---------------- */

const taillesAvatar = {
  sm: { boite: "size-9", texte: "text-lg" },
  md: { boite: "size-12", texte: "text-2xl" },
  lg: { boite: "size-20", texte: "text-4xl" },
};

function initiales(nom?: string) {
  const mots = (nom ?? "").trim().split(/\s+/).filter(Boolean);
  if (!mots.length) return "";
  return mots
    .slice(0, 2)
    .map((m) => m[0])
    .join("")
    .toUpperCase();
}

export function Avatar({
  emoji,
  nom,
  taille = "md",
}: {
  emoji?: string;
  nom?: string;
  taille?: "sm" | "md" | "lg";
}) {
  const t = taillesAvatar[taille];
  const lettres = initiales(nom);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary",
        t.boite,
        emoji ? t.texte : "text-sm font-semibold",
      )}
    >
      {/* {emoji ? <span className="leading-none">{emoji}</span> : lettres} */}
    </span>
  );
}

export function LigneUtilisateur({ id, sousTitre }: { id: string; sousTitre?: string }) {
  const [u, setU] = useState<Profil | null>(null);
  useEffect(() => {
    let vivant = true;
    chargerProfilCache(id).then((p) => {
      if (vivant) setU(p);
    });
    return () => {
      vivant = false;
    };
  }, [id]);
  return (
    <Link to="/profil/$id" params={{ id }} className="flex items-center gap-2">
      <Avatar emoji={u?.photo_url ?? undefined} nom={u?.nom} taille="sm" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{u?.nom ?? "…"}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {u?.ville && <span>{u.ville}</span>}
          {u?.type_compte && <span>{u.type_compte}</span>}
        </span>
        {sousTitre && <span className="block text-xs text-muted-foreground">{sousTitre}</span>}
      </span>
    </Link>
  );
}

/* ---------------- Follow ---------------- */

export function BoutonSuivre({ id, taille = "sm" }: { id: string; taille?: "sm" | "md" }) {
  const [suivi, setSuivi] = useState<boolean | null>(null);
  const routeur = useRouter();

  useEffect(() => {
    let vivant = true;
    supabase.auth.getUser().then(({ data }) => {
      const moi = data.user?.id;
      if (!moi || moi === id) {
        if (vivant) setSuivi(false);
        return;
      }
      supabase
        .from("follows")
        .select("suiveur_id")
        .eq("suiveur_id", moi)
        .eq("suivi_id", id)
        .maybeSingle()
        .then(({ data: ligne }) => {
          if (vivant) setSuivi(!!ligne);
        });
    });
    return () => {
      vivant = false;
    };
  }, [id]);

  async function basculer(e: React.MouseEvent) {
    e.preventDefault();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      routeur.navigate({ to: "/connexion" });
      return;
    }
    const moi = data.user.id;
    if (suivi) {
      await nePlusSuivre(moi, id);
      setSuivi(false);
    } else {
      await suivre(moi, id);
      setSuivi(true);
    }
  }

  if (suivi === null) return null;
  return (
    <Bouton taille={taille} variante={suivi ? "contour" : "primaire"} onClick={basculer}>
      {suivi ? "Suivi" : "Suivre"}
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
        {label} {obligatoire && <span className="text-destructive">*</span>}
      </span>
      {children}
      {aide && <span className="block text-xs text-muted-foreground">{aide}</span>}
    </label>
  );
}

const baseChamp =
  "w-full min-h-11 rounded-md border border-input bg-card px-3 text-sm outline-none transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-ring/20";

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
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
        π
      </span>
      {texte}
    </div>
  );
}

/* ---------------- Bouton retour ---------------- */

export function BoutonRetour({
  label = "Retour",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const routeur = useRouter();
  return (
    <button
      type="button"
      onClick={() => routeur.history.back()}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors duration-150 hover:bg-muted",
        className,
      )}
    >
      {label}
    </button>
  );
}
