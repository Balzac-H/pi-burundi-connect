import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, Selection, Saisie } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { roleResponsable, type Responsable } from "@/lib/annonces";
import { useT, type Cle } from "@/lib/i18n";
import {
  apercuDonnees,
  exporterTableDonnees,
  lireTableDonnees,
  type ApercuDonnees,
  type PageDonnees,
  type TableDonnees,
} from "@/lib/donnees.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/donnees")({
  head: () => ({
    meta: [
      { title: "Données — Arija Connect" },
      {
        name: "description",
        content: "Espace données administrateur, en lecture seule.",
      },
    ],
  }),
  component: Donnees,
});

const TABLES: TableDonnees[] = [
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
];

type Vue = "ensemble" | "table" | "coherence";

function Donnees() {
  const t = useT();
  const { utilisateur, chargement } = useSession();
  const [role, setRole] = useState<Responsable>(null);
  const [vue, setVue] = useState<Vue>("ensemble");
  const [apercu, setApercu] = useState<ApercuDonnees | null>(null);
  const [table, setTable] = useState<TableDonnees>("profils");
  const [page, setPage] = useState(1);
  const [recherche, setRecherche] = useState("");
  const [rechercheAppliquee, setRechercheAppliquee] = useState("");
  const [tri, setTri] = useState<string | undefined>(undefined);
  const [ordre, setOrdre] = useState<"asc" | "desc">("asc");
  const [sensibles, setSensibles] = useState(false);
  const [donnees, setDonnees] = useState<PageDonnees | null>(null);
  const [enChargement, setEnChargement] = useState(false);

  useEffect(() => {
    if (!utilisateur) return;
    roleResponsable(utilisateur.id).then(setRole);
  }, [utilisateur]);

  useEffect(() => {
    if (role !== "admin") return;
    apercuDonnees()
      .then(setApercu)
      .catch(() => toast.error("Chargement impossible."));
  }, [role]);

  const chargerTable = useCallback(
    async (cible: number) => {
      setEnChargement(true);
      try {
        const res = await lireTableDonnees({
          data: {
            table,
            page: cible,
            recherche: rechercheAppliquee,
            tri,
            ordre,
            sensibles,
          },
        });
        setDonnees(res);
        setPage(res.page);
      } catch {
        toast.error("Chargement impossible.");
      } finally {
        setEnChargement(false);
      }
    },
    [table, rechercheAppliquee, tri, ordre, sensibles],
  );

  useEffect(() => {
    if (role !== "admin" || vue !== "table") return;
    void chargerTable(1);
  }, [role, vue, chargerTable]);

  if (chargement) return null;
  if (!utilisateur)
    return (
      <Carte>
        Connectez-vous.{" "}
        <Link to="/connexion" className="font-semibold text-primary">
          Se connecter
        </Link>
      </Carte>
    );
  if (role === null) return <Carte>Vérification…</Carte>;
  if (role !== "admin") return <Carte>{t("adminSeul")}</Carte>;

  const exporter = async () => {
    try {
      const res = await exporterTableDonnees({
        data: { table, recherche: rechercheAppliquee, sensibles },
      });
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${table}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      if (res.tronque) toast.warning(t("donneesTropDeLignes"));
      else toast.success(`${res.lignes} ${t("lignes")}`);
    } catch {
      toast.error("Export impossible.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t("espaceDonnees")}</h1>
        <Link to="/admin" className="text-xs font-semibold text-primary">
          ← {t("espaceResponsable")}
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">{t("donneesLectureSeule")}</p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ensemble", t("donneesVueEnsemble")],
            ["table", t("donneesTables")],
            ["coherence", t("donneesCoherence")],
          ] as [Vue, string][]
        ).map(([code, libelle]) => (
          <Bouton
            key={code}
            taille="sm"
            variante={vue === code ? "primaire" : "contour"}
            onClick={() => setVue(code)}
          >
            {libelle}
          </Bouton>
        ))}
      </div>

      {vue === "ensemble" && apercu && (
        <Carte className="space-y-2 text-sm">
          <h2 className="font-semibold">{t("donneesVueEnsemble")}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {apercu.totaux.map((x) => (
              <div key={x.table} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{x.table}</span>
                <span className="font-semibold text-foreground">{x.nombre}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("donneesAssistant")} : {apercu.assistantActif ? "oui" : "non"}
          </p>
        </Carte>
      )}

      {vue === "coherence" && apercu && (
        <Carte className="space-y-2 text-sm">
          <h2 className="font-semibold">{t("donneesCoherence")}</h2>
          {apercu.problemes.length === 0 && (
            <p className="text-muted-foreground">{t("donneesAucunProbleme")}</p>
          )}
          {apercu.problemes.map((p) => (
            <div key={p.code} className="flex items-start justify-between gap-2">
              <span className="text-muted-foreground">{t(p.code as Cle)}</span>
              <Etiquette ton="attente">{p.nombre}</Etiquette>
            </div>
          ))}
        </Carte>
      )}

      {vue === "table" && (
        <>
          <Carte className="space-y-3 text-sm">
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("donneesTables")}</span>
                <Selection
                  value={table}
                  onChange={(e) => {
                    setTable(e.target.value as TableDonnees);
                    setTri(undefined);
                  }}
                >
                  {TABLES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </Selection>
              </label>
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-xs text-muted-foreground">{t("donneesRecherche")}</span>
                <div className="flex gap-2">
                  <Saisie
                    value={recherche}
                    onChange={(e) => setRecherche(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setRechercheAppliquee(recherche);
                    }}
                    placeholder={t("donneesRecherche")}
                  />
                  <Bouton taille="sm" onClick={() => setRechercheAppliquee(recherche)}>
                    {t("rechercher")}
                  </Bouton>
                </div>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={sensibles}
                  onChange={(e) => setSensibles(e.target.checked)}
                />
                {t("donneesAfficherSensible")}
              </label>
              <Bouton taille="sm" variante="contour" onClick={() => void chargerTable(page)}>
                {t("donneesRafraichir")}
              </Bouton>
              <Bouton taille="sm" variante="contour" onClick={() => void exporter()}>
                {t("donneesExporterCsv")}
              </Bouton>
            </div>
          </Carte>

          <Carte className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {t("donneesTotal")} : {donnees?.total ?? 0} · {t("lignes")} {page}/
                {donnees?.pages ?? 1}
              </span>
              <div className="flex gap-2">
                <Bouton
                  taille="sm"
                  variante="contour"
                  disabled={page <= 1 || enChargement}
                  onClick={() => void chargerTable(page - 1)}
                >
                  {t("donneesPrecedent")}
                </Bouton>
                <Bouton
                  taille="sm"
                  variante="contour"
                  disabled={enChargement || page >= (donnees?.pages ?? 1)}
                  onClick={() => void chargerTable(page + 1)}
                >
                  {t("donneesSuivant")}
                </Bouton>
              </div>
            </div>

            {enChargement && (
              <p className="text-sm text-muted-foreground">{t("donneesChargement")}</p>
            )}
            {!enChargement && donnees && donnees.lignes.length === 0 && (
              <p className="text-sm text-muted-foreground">{t("donneesAucun")}</p>
            )}

            {!enChargement && donnees && donnees.lignes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      {donnees.colonnes.map((c) => (
                        <th
                          key={c}
                          onClick={() => {
                            setTri(c);
                            setOrdre((o) => (tri === c && o === "asc" ? "desc" : "asc"));
                          }}
                          className="cursor-pointer whitespace-nowrap border-b border-border px-2 py-1 text-left font-semibold text-foreground"
                        >
                          {c}
                          {tri === c ? (ordre === "asc" ? " ▲" : " ▼") : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {donnees.lignes.map((ligne, i) => (
                      <tr key={i} className="odd:bg-muted/40">
                        {donnees.colonnes.map((c) => (
                          <td
                            key={c}
                            className="max-w-[20rem] truncate whitespace-nowrap border-b border-border px-2 py-1 text-muted-foreground"
                            title={cellule(ligne[c])}
                          >
                            {cellule(ligne[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}

function cellule(valeur: unknown): string {
  if (valeur == null) return "";
  if (typeof valeur === "object") return JSON.stringify(valeur);
  return String(valeur);
}
