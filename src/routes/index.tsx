import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  chercherProfils,
  chargerProfilCache,
  listerProduits,
  lienWhatsApp,
  type ProduitDb,
  type Profil,
} from "@/lib/comptes";
import { Bouton, Carte, TitreSection, Etiquette, Avatar, LienBouton } from "@/components/ui-kit";
import { listerJobs, type JobDb } from "@/lib/annonces";
import { formatPi } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accueil — Arija" },
      {
        name: "description",
        content:
          "Recherchez produits, services et emplois près de chez vous au Burundi. Paiements en Pi, contact WhatsApp direct.",
      },
      { property: "og:title", content: "Accueil — Arija" },
      {
        property: "og:description",
        content:
          "Recherchez produits, services et emplois près de chez vous au Burundi. Paiements en Pi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const t = useT();
  const { utilisateur } = useSession();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");

  const [annonces, setAnnonces] = useState<ProduitDb[]>([]);
  const [emplois, setEmplois] = useState<JobDb[]>([]);
  const [vendeurs, setVendeurs] = useState<Profil[]>([]);

  useEffect(() => {
    let vivant = true;
    listerProduits()
      .then((p) => {
        if (vivant) setAnnonces(p);
      })
      .catch(() => undefined);
    listerJobs()
      .then((j) => {
        if (vivant) setEmplois(j.slice(0, 4));
      })
      .catch(() => undefined);
    chercherProfils("")
      .then((v) => {
        if (vivant) setVendeurs(v.slice(0, 3));
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, []);

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return annonces
      .filter((p) => (p.titre + (p.description ?? "") + p.categorie).toLowerCase().includes(q))
      .slice(0, 6);
  }, [recherche, annonces]);

  return (
    <div className="space-y-6">
      <section className="card-surface p-5">
        <p className="text-sm text-muted-foreground">
          {t("bonjour")},{" "}
          <span className="font-semibold text-foreground">
            {utilisateur?.email?.split("@")[0] ?? t("invite")}
          </span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Arija</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t("sousTitre")}</p>

        <form
          className="mt-4 flex items-center gap-2 rounded-md border border-border bg-background p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!recherche.trim()) navigate({ to: "/market" });
          }}
        >
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            maxLength={80}
            placeholder={t("rechercherPlaceholder")}
            aria-label={t("rechercher")}
            className="min-h-9 w-full bg-transparent px-1 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Bouton type="submit" taille="sm">
            {t("rechercher")}
          </Bouton>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <LienBouton to="/jobs" variante="secondaire" taille="sm">
            {t("jobs")}
          </LienBouton>
          <LienBouton to="/vendeurs" variante="contour" taille="sm">
            {t("trouverVendeur")}
          </LienBouton>
          <LienBouton to="/portefeuille" variante="pi" taille="sm">
            {t("mesCommandes")}
          </LienBouton>
        </div>
      </section>

      {recherche.trim() && (
        <section>
          <TitreSection>
            {t("rechercher")} : « {recherche} »
          </TitreSection>
          {resultats.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucunResultat")}</Carte>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultats.map((p) => (
                <Carte key={p.id} className="space-y-2">
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.titre}
                      loading="lazy"
                      className="h-24 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="grid h-24 place-items-center rounded-md bg-muted text-xs text-muted-foreground">
                      Pas de photo
                    </div>
                  )}
                  <h3 className="font-semibold leading-snug">{p.titre}</h3>
                  <p className="text-sm font-semibold text-primary">{formatPi(Number(p.prix))}</p>
                  <LienBouton to="/market/$id" params={{ id: p.id }} taille="sm" className="w-full">
                    {t("acheter")}
                  </LienBouton>
                </Carte>
              ))}
            </div>
          )}
        </section>
      )}

      {!recherche.trim() && (
        <section>
          <TitreSection
            action={
              <Link to="/market" className="text-xs font-semibold text-primary">
                {t("voirTout")}
              </Link>
            }
          >
            {t("nouvellesAnnonces")}
          </TitreSection>
          {annonces.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucuneAnnonce")}</Carte>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {annonces.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  to="/market/$id"
                  params={{ id: p.id }}
                  className="card-surface space-y-1.5 p-2"
                >
                  {p.photo_url ? (
                    <img
                      src={p.photo_url}
                      alt={p.titre}
                      loading="lazy"
                      className="h-28 w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="grid h-28 place-items-center rounded-md bg-muted text-xs text-muted-foreground">
                      Pas de photo
                    </div>
                  )}
                  <p className="line-clamp-2 text-xs font-semibold leading-snug">{p.titre}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.lieu ?? "Burundi"}</p>
                  <p className="text-sm font-semibold text-primary">{formatPi(Number(p.prix))}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {!recherche.trim() && (
        <section>
          <TitreSection
            action={
              <Link to="/jobs" className="text-xs font-semibold text-primary">
                {t("voirTout")}
              </Link>
            }
          >
            {t("jobs")}
          </TitreSection>
          {emplois.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucuneOffre")}</Carte>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {emplois.map((j) => (
                <CarteJob key={j.id} job={j} />
              ))}
            </div>
          )}
        </section>
      )}

      {!recherche.trim() && vendeurs.length > 0 && (
        <section>
          <TitreSection
            action={
              <Link to="/vendeurs" className="text-xs font-semibold text-primary">
                {t("voirTout")}
              </Link>
            }
          >
            {t("vendeurs")}
          </TitreSection>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vendeurs.map((u) => (
              <Carte key={u.id} className="flex items-center gap-3">
                <Avatar emoji={u.photo_url ?? undefined} nom={u.nom} />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/profil/$id"
                    params={{ id: u.id }}
                    className="block truncate font-semibold"
                  >
                    {u.nom}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.ville ?? u.bio ?? "—"}
                  </p>
                  {u.type_compte && (
                    <p className="truncate text-xs font-medium text-muted-foreground">
                      {u.type_compte}
                    </p>
                  )}
                </div>
                {u.whatsapp ? (
                  <a
                    href={lienWhatsApp(u.whatsapp, `Bonjour ${u.nom}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-md bg-success/15 px-3 text-xs font-semibold text-success"
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    —
                  </span>
                )}
              </Carte>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CarteJob({ job }: { job: JobDb }) {
  const t = useT();
  const [emp, setEmp] = useState<Profil | null>(null);
  useEffect(() => {
    chargerProfilCache(job.employeur_id)
      .then(setEmp)
      .catch(() => undefined);
  }, [job.employeur_id]);

  return (
    <Carte className="space-y-2">
      <p className="text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{emp?.nom ?? "…"}</span>
      </p>
      <h3 className="font-semibold">{job.titre}</h3>
      <div className="flex flex-wrap items-center gap-2">
        {job.salaire && <Etiquette ton="pi">{formatPi(job.salaire)}</Etiquette>}
        {job.urgent && <Etiquette ton="urgent">Urgent</Etiquette>}
        <Etiquette>{job.localisation}</Etiquette>
        {job.duree && <Etiquette>{job.duree}</Etiquette>}
      </div>
      <LienBouton to="/jobs/$id" params={{ id: job.id }} taille="sm">
        Voir
      </LienBouton>
      <span className="sr-only">{t("jobs")}</span>
    </Carte>
  );
}
