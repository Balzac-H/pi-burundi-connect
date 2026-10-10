import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

/**
 * Espace données (admin, LECTURE SEULE).
 *
 * Aucune écriture de données métier n'est possible depuis ce module. Les seules
 * écritures sont les entrées du journal d'audit (`ecrire_audit`) lorsqu'un
 * administrateur révèle des colonnes sensibles ou exporte une table.
 */

const TABLES = [
  "profils",
  "produits",
  "orders",
  "order_items",
  "payments",
  "litiges",
  "signalements",
  "jobs",
  "messages",
  "notifications",
  "follows",
  "reviews",
  "user_roles",
  "audit_log",
  "reglages",
] as const;

export type TableDonnees = (typeof TABLES)[number];

/** Colonnes masquées par défaut (révélées seulement à la demande, avec audit). */
const SENSIBLES: Partial<Record<TableDonnees, string[]>> = {
  profils: ["pi_uid", "pi_username", "telephone", "whatsapp"],
};

const CAP = 2000;
const EXPORT_MAX = 5000;
const PAR_PAGE = 50;
const MASQUE = "•••";

type Ligne = Record<string, Json>;

type Reponse = {
  data: unknown;
  count?: number | null;
  error: { message: string } | null;
};

type Requete = PromiseLike<Reponse> & { limit: (n: number) => Requete };

type ClientSouple = {
  from: (table: string) => {
    select: (colonnes: string, options?: { count?: "exact"; head?: boolean }) => Requete;
  };
};

async function client(): Promise<ClientSouple> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as ClientSouple;
}

async function exigerAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (data !== true) throw new Error("AdminSeul");
}

async function charger(table: TableDonnees): Promise<Ligne[]> {
  const supabaseAdmin = await client();
  const { data, error } = await supabaseAdmin.from(table).select("*").limit(CAP);
  if (error) throw new Error("Lecture impossible.");
  return (data ?? []) as Ligne[];
}

async function auditer(acteur: string, action: string, detail: Json) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.rpc("ecrire_audit", {
    _acteur: acteur,
    _action: action,
    _cible: String((detail as { table?: string }).table ?? ""),
    _detail: detail,
  });
}

async function compter(table: TableDonnees): Promise<number> {
  const supabaseAdmin = await client();
  const { count, error } = await supabaseAdmin
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error("Lecture impossible.");
  return count ?? 0;
}

function masquer(table: TableDonnees, lignes: Ligne[], sensibles: boolean): Ligne[] {
  const colonnes = SENSIBLES[table];
  if (!colonnes || sensibles) return lignes;
  return lignes.map((ligne) => {
    const copie = { ...ligne };
    for (const c of colonnes) if (c in copie) copie[c] = MASQUE;
    return copie;
  });
}

function colonnesDe(lignes: Ligne[]): string[] {
  const vues = new Set<string>();
  for (const ligne of lignes) for (const cle of Object.keys(ligne)) vues.add(cle);
  return [...vues];
}

function filtrer(lignes: Ligne[], recherche: string): Ligne[] {
  const q = recherche.trim().toLowerCase();
  if (!q) return lignes;
  return lignes.filter((l) => JSON.stringify(l).toLowerCase().includes(q));
}

function trier(lignes: Ligne[], tri: string | undefined, ordre: "asc" | "desc"): Ligne[] {
  if (!tri) return lignes;
  return [...lignes].sort((a, b) => {
    const va = a[tri];
    const vb = b[tri];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    const r = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return ordre === "asc" ? r : -r;
  });
}

/* ------------------------------------------------------------------ */
/* Vue d'ensemble                                                      */
/* ------------------------------------------------------------------ */

export type ApercuDonnees = {
  totaux: { table: TableDonnees; nombre: number }[];
  problemes: { code: string; nombre: number }[];
  assistantActif: boolean;
};

export const apercuDonnees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ApercuDonnees> => {
    await exigerAdmin(context.userId);

    const tables: TableDonnees[] = [
      "profils",
      "produits",
      "orders",
      "order_items",
      "payments",
      "litiges",
      "signalements",
      "jobs",
      "messages",
      "notifications",
    ];
    const totaux: ApercuDonnees["totaux"] = [];
    for (const table of tables) totaux.push({ table, nombre: await compter(table) });

    const [orders, payments, produits, litiges, reglages] = await Promise.all([
      charger("orders"),
      charger("payments"),
      charger("produits"),
      charger("litiges"),
      charger("reglages"),
    ]);

    const problemes: ApercuDonnees["problemes"] = [];
    const push = (code: string, nombre: number) => {
      if (nombre > 0) problemes.push({ code, nombre });
    };

    push(
      "cohPaidHeldSansDate",
      payments.filter((p) => p.statut === "paid_held" && !p.paid_held_at).length,
    );
    push(
      "cohRembourseIncoherent",
      payments.filter((p) => p.a_rembourser === true && p.statut === "refunded").length,
    );
    push("cohStockNegatif", produits.filter((p) => Number(p.stock) < 0).length);

    const parOrder = new Map(payments.map((p) => [String(p.order_id), p]));
    push(
      "cohPayeeSansPaiement",
      orders.filter((o) => {
        if (o.statut !== "payee") return false;
        const p = parOrder.get(String(o.id));
        return !p || p.statut !== "paid_held";
      }).length,
    );
    const ordersLitige = new Set(litiges.map((l) => String(l.order_id)));
    push(
      "cohLitigeSansLitige",
      orders.filter((o) => o.statut === "litige" && !ordersLitige.has(String(o.id))).length,
    );

    const reglageAssistant = reglages.find((r) => r.cle === "assistant_actif");
    const valeur = reglageAssistant?.valeur;
    const assistantActif = !(valeur === false || valeur === "false");

    return { totaux, problemes, assistantActif };
  });

/* ------------------------------------------------------------------ */
/* Lecture d'une table (paginée)                                       */
/* ------------------------------------------------------------------ */

export type PageDonnees = {
  table: TableDonnees;
  colonnes: string[];
  lignes: Ligne[];
  total: number;
  page: number;
  pages: number;
};

export const lireTableDonnees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        table: z.enum(TABLES),
        page: z.number().int().min(1).max(1000).default(1),
        recherche: z.string().max(200).default(""),
        tri: z.string().max(60).optional(),
        ordre: z.enum(["asc", "desc"]).default("asc"),
        sensibles: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<PageDonnees> => {
    await exigerAdmin(context.userId);

    if (data.sensibles && SENSIBLES[data.table]) {
      await auditer(context.userId, "donnees_sensibles_consultees", { table: data.table });
    }

    const brut = await charger(data.table);
    const filtrees = trier(filtrer(brut, data.recherche), data.tri, data.ordre);
    const total = filtrees.length;
    const pages = Math.max(1, Math.ceil(total / PAR_PAGE));
    const page = Math.min(data.page, pages);
    const lignes = masquer(
      data.table,
      filtrees.slice((page - 1) * PAR_PAGE, page * PAR_PAGE),
      data.sensibles,
    );
    return { table: data.table, colonnes: colonnesDe(brut), lignes, total, page, pages };
  });

/* ------------------------------------------------------------------ */
/* Export CSV (≤ 5000 lignes, audité)                                  */
/* ------------------------------------------------------------------ */

function versCsv(colonnes: string[], lignes: Ligne[]): string {
  const echapper = (v: unknown) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    colonnes.join(","),
    ...lignes.map((l) => colonnes.map((c) => echapper(l[c])).join(",")),
  ].join("\n");
}

export const exporterTableDonnees = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        table: z.enum(TABLES),
        recherche: z.string().max(200).default(""),
        sensibles: z.boolean().default(false),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await exigerAdmin(context.userId);
    const brut = await charger(data.table);
    const filtrees = filtrer(brut, data.recherche);
    const tronque = filtrees.length > EXPORT_MAX;
    const lignes = masquer(data.table, filtrees.slice(0, EXPORT_MAX), data.sensibles);
    const colonnes = colonnesDe(brut);
    await auditer(context.userId, "donnees_exportees", {
      table: data.table,
      lignes: lignes.length,
      sensibles: data.sensibles,
    });
    return {
      csv: versCsv(colonnes, lignes),
      lignes: lignes.length,
      tronque,
    };
  });
