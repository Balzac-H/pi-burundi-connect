import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Cle } from "@/lib/i18n";
import type { Json } from "@/integrations/supabase/types";

/** Code lisible côté client : le message est traduit dans les 4 langues. */
export const CONFLIT_INTERET = "WICO:CONFLIT_INTERET";
export const SEUIL_DOUBLE_VALIDATION = "WICO:SEUIL_DOUBLE_VALIDATION";
export const DEJA_PREMIER_VALIDATEUR = "WICO:DEJA_PREMIER_VALIDATEUR";

/** Les exceptions SQL de `refuser_conflit_interet` portent un message unique. */
export function normaliserErreurServeur(message: string): string {
  if (message.includes("Conflit d'intérêt")) return CONFLIT_INTERET;
  return message;
}

const TRADUCTIONS: Partial<Record<string, Cle>> = {
  [CONFLIT_INTERET]: "conflitInteret",
  [SEUIL_DOUBLE_VALIDATION]: "validationEnAttente",
  [DEJA_PREMIER_VALIDATEUR]: "validationDejaPremier",
  AdminSeul: "adminSeul",
  AccesRestreint: "accesRestreint",
};

/** Les codes renvoyés par les fonctions serveur sont traduits en 4 langues. */
export function messageErreurServeur(e: unknown, t: (cle: Cle) => string): string {
  const message = e instanceof Error ? e.message : String(e);
  const cle = TRADUCTIONS[message];
  return cle ? t(cle) : message;
}

async function exigerRole(userId: string, role: "admin" | "moderator") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: role });
  if (data !== true) throw new Error(role === "admin" ? "AdminSeul" : "AccesRestreint");
}

async function exigerAdmin(userId: string) {
  await exigerRole(userId, "admin");
}

/* ------------------------------------------------------------------ */
/* Litiges : admin ou moderator, hors conflit d'intérêt                */
/* ------------------------------------------------------------------ */

export const traiterLitige = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        litigeId: z.string().uuid(),
        statut: z.enum(["ouvert", "resolu", "rejete"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("traiter_litige", {
      _litige: data.litigeId,
      _statut: data.statut,
    });
    if (error) throw new Error(normaliserErreurServeur(error.message));
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Rôles (admin uniquement)                                            */
/* ------------------------------------------------------------------ */

export type Role = "admin" | "moderator" | "user";

export const gererRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "moderator"]),
        actif: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await exigerAdmin(context.userId);
    if (data.userId === context.userId && !data.actif)
      throw new Error("Impossible de retirer votre propre rôle d'administrateur.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.actif) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && error.code !== "23505") throw new Error("Enregistrement impossible.");
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error("Retrait impossible.");
    }

    await supabaseAdmin.rpc("ecrire_audit", {
      _acteur: context.userId,
      _action: data.actif ? "role_ajoute" : "role_retire",
      _cible: data.userId,
      _detail: { role: data.role },
    });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Membres (admin uniquement)                                          */
/* ------------------------------------------------------------------ */

export type MembreAdmin = {
  id: string;
  nom: string;
  pi_username: string | null;
  vendeur_actif: boolean;
  roles: Role[];
};

export const listerMembres = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigerAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profils }, { data: roles }] = await Promise.all([
      supabaseAdmin
        .from("profils")
        .select("id, nom, pi_username, vendeur_actif")
        .order("nom")
        .limit(500),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    const parUser = new Map<string, Role[]>();
    for (const r of roles ?? []) {
      const l = parUser.get(r.user_id) ?? [];
      l.push(r.role as Role);
      parUser.set(r.user_id, l);
    }
    return (
      (profils ?? []) as {
        id: string;
        nom: string;
        pi_username: string | null;
        vendeur_actif: boolean;
      }[]
    ).map((p) => ({ ...p, roles: parUser.get(p.id) ?? (["user"] as Role[]) })) as MembreAdmin[];
  });

/* ------------------------------------------------------------------ */
/* Réglages (admin uniquement)                                         */
/* ------------------------------------------------------------------ */

export const modifierReglage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        cle: z.enum(["seuil_double_validation"]),
        valeur: z.number().min(0).max(1_000_000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await exigerAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("reglages")
      .update({ valeur: data.valeur })
      .eq("cle", data.cle);
    if (error) throw new Error("Enregistrement impossible.");
    await supabaseAdmin.rpc("ecrire_audit", {
      _acteur: context.userId,
      _action: "reglage_modifie",
      _cible: data.cle,
      _detail: { valeur: data.valeur },
    });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Journal d'audit et validations en attente (admin uniquement)        */
/* ------------------------------------------------------------------ */

export type LigneAudit = {
  id: string;
  acteur: string | null;
  action: string;
  cible: string | null;
  detail: Json;
  date: string;
};

export const listerJournalAudit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigerAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("audit_log")
      .select("id, acteur, action, cible, detail, date")
      .order("date", { ascending: false })
      .limit(100);
    return (data as LigneAudit[] | null) ?? [];
  });

export type LiberationEnAttente = {
  id: string;
  payment_id: string;
  premier_admin: string;
  second_admin: string | null;
  montant: number;
  statut: string;
  created_at: string;
};

export const listerLiberationsEnAttente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await exigerAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("liberations_en_attente")
      .select("*")
      .eq("statut", "en_attente")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data as LiberationEnAttente[] | null) ?? [];
  });
