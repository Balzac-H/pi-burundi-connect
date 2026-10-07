import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Avatar,
  Bouton,
  Carte,
  Etiquette,
  TitreSection,
  BoutonSuivre,
  LienBouton,
} from "@/components/ui-kit";
import { BoutonSignaler } from "@/components/Confiance";
import {
  chargerProfil,
  lienWhatsApp,
  listerMesProduits,
  type ProduitDb,
  type Profil,
} from "@/lib/comptes";
import { avisDeVendeur, statsProfil, type AvisDb, type StatsProfil } from "@/lib/social";
import { listerJobs, nomTypeCompte, type JobDb } from "@/lib/annonces";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { formatPi } from "@/lib/store";
import { toast } from "sonner";

export function ProfilComplet({ id }: { id: string }) {
  const t = useT();
  const { utilisateur } = useSession();
  const monProfil = utilisateur?.id === id;

  const [u, setU] = useState<Profil | null | undefined>(undefined);
  const [stats, setStats] = useState<StatsProfil | null>(null);
  const [avis, setAvis] = useState<AvisDb[]>([]);
  const [annonces, setAnnonces] = useState<ProduitDb[]>([]);
  const [emplois, setEmplois] = useState<JobDb[]>([]);

  useEffect(() => {
    let vivant = true;
    chargerProfil(id)
      .then(async (p) => {
        if (!vivant) return;
        setU(p);
        const [s, a] = await Promise.all([statsProfil(id), avisDeVendeur(id)]);
        if (!vivant) return;
        setStats(s);
        setAvis(a);
        if (p?.type_compte === "employeur" || p?.type_compte === "vendeur") {
          const [prods, jobs] = await Promise.all([listerMesProduits(id), listerJobs(id)]);
          if (!vivant) return;
          setAnnonces(prods.filter((x) => x.publie));
          setEmplois(jobs);
        }
      })
      .catch(() => {
        if (vivant) setU(null);
      });
    return () => {
      vivant = false;
    };
  }, [id]);

  if (u === undefined)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  if (!u) {
    return (
      <Carte className="text-center">
        <p className="font-semibold">Profil introuvable.</p>
        <LienBouton to="/" taille="sm" className="mt-3">
          {t("accueil")}
        </LienBouton>
      </Carte>
    );
  }

  return (
    <div className="space-y-5">
      <Carte className="space-y-4">
        <div className="flex gap-4">
          {u.photo_url ? (
            <img
              src={u.photo_url}
              alt={"Photo de " + u.nom}
              className="size-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <Avatar nom={u.nom} taille="lg" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold sm:text-2xl">{u.nom}</h1>
            <p className="text-sm text-muted-foreground">{nomTypeCompte(u.type_compte)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{u.ville ?? "Burundi"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(u.competences ?? []).map((c) => (
                <Etiquette key={c}>{c}</Etiquette>
              ))}
            </div>
          </div>
        </div>
        {u.bio && <p className="text-sm italic text-muted-foreground">« {u.bio} »</p>}
        {u.prix_horaire != null && (
          <p className="text-sm font-semibold text-primary">
            Prix horaire : {formatPi(Number(u.prix_horaire))} / h
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {monProfil ? (
            <>
              <LienBouton to="/profil/modifier" taille="sm">
                Modifier
              </LienBouton>
              <LienBouton to="/portefeuille" variante="pi" taille="sm">
                {t("mesCommandes")}
              </LienBouton>
            </>
          ) : (
            <>
              <BoutonSuivre id={u.id} taille="md" />
              <LienBouton
                to="/messages/$id"
                params={{ id: u.id }}
                variante="secondaire"
                taille="sm"
              >
                {t("chat")}
              </LienBouton>
              {u.whatsapp && (
                <a
                  href={lienWhatsApp(u.whatsapp, `Bonjour ${u.nom}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-success/15 px-3 text-xs font-semibold text-success"
                >
                  {t("contactWhatsapp")}
                </a>
              )}
            </>
          )}
          <Bouton
            variante="contour"
            taille="sm"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href).then(
                () => toast.success("Lien du profil copié !"),
                () => toast("Copiez l'adresse depuis la barre d'URL."),
              );
            }}
          >
            Partager
          </Bouton>
          {!monProfil && <BoutonSignaler cibleType="profil" cibleId={u.id} utilisateurId={u.id} />}
        </div>
      </Carte>

      <section>
        <TitreSection>{t("statistiques")}</TitreSection>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat valeur={(stats?.followers ?? 0).toLocaleString("fr-FR")} label={t("abonnes")} />
          <Stat valeur={String(stats?.following ?? 0)} label={t("abonnementsCourt")} />
          <Stat valeur={String(stats?.offres ?? 0)} label={t("offresPubliees")} />
          <Stat valeur={String(stats?.ventes ?? 0)} label={t("ventesConfirmees")} />
        </div>
        <Carte className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold">{t("avis")}</span>
          <span className="text-lg font-semibold text-primary">
            {stats?.note ? `${stats.note.toFixed(1)} / 5` : "—"} ({stats?.nbAvis ?? 0})
          </span>
        </Carte>
      </section>

      {annonces.length > 0 && (
        <section>
          <TitreSection
            action={
              <Link
                to="/market"
                className="inline-flex min-h-11 items-center text-xs font-semibold text-primary"
              >
                {t("voirTout")}
              </Link>
            }
          >
            {t("market")}
          </TitreSection>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {annonces.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                to="/market/$id"
                params={{ id: p.id }}
                className="space-y-1 rounded-xl border border-border bg-card p-2"
              >
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt={p.titre}
                    loading="lazy"
                    className="h-24 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="grid h-24 place-items-center rounded-md bg-primary-soft text-xs text-muted-foreground">
                    Pas de photo
                  </div>
                )}
                <p className="line-clamp-1 text-xs font-semibold">{p.titre}</p>
                <p className="text-sm font-semibold text-primary">{formatPi(Number(p.prix))}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {emplois.length > 0 && (
        <section>
          <TitreSection
            action={
              <Link
                to="/jobs"
                className="inline-flex min-h-11 items-center text-xs font-semibold text-primary"
              >
                {t("voirTout")}
              </Link>
            }
          >
            {t("jobs")}
          </TitreSection>
          <div className="space-y-2">
            {emplois.slice(0, 5).map((j) => (
              <Carte key={j.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{j.titre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {j.localisation} {j.salaire != null ? `· ${formatPi(Number(j.salaire))}` : ""}
                  </p>
                </div>
                <LienBouton to="/jobs/$id" params={{ id: j.id }} variante="contour" taille="sm">
                  Voir
                </LienBouton>
              </Carte>
            ))}
          </div>
        </section>
      )}

      <section>
        <TitreSection>
          {t("avis")} ({avis.length})
        </TitreSection>
        <div className="space-y-3">
          {avis.map((a) => (
            <Carte key={a.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold" aria-label={`Note : ${a.note} sur 5`}>
                  {a.note} / 5
                </h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
              {a.commentaire && (
                <p className="text-sm italic text-muted-foreground">« {a.commentaire} »</p>
              )}
            </Carte>
          ))}
          {avis.length === 0 && (
            <Carte className="text-sm text-muted-foreground">{t("aucunAvis")}</Carte>
          )}
        </div>
        {monProfil && (
          <div className="mt-3 flex flex-wrap gap-2">
            <LienBouton to="/jobs/postulations" variante="contour" taille="sm">
              Mes postulations
            </LienBouton>
            <LienBouton to="/market/boutique" variante="contour" taille="sm">
              {t("maBoutique")}
            </LienBouton>
            <Link
              to="/parametres"
              className="inline-flex min-h-11 items-center text-xs font-semibold text-primary"
            >
              {t("parametres")}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ valeur, label }: { valeur: string; label: string }) {
  return (
    <Carte className="text-center">
      <p className="text-lg font-semibold text-primary">{valeur}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Carte>
  );
}
