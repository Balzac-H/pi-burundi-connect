import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { listerProduits, lienWhatsApp, type ProduitDb } from "@/lib/comptes";
import { Bouton, Carte, TitreSection, Etiquette, Note, Distance, Avatar, LienBouton } from "@/components/ui-kit";
import { utilisateurs, jobs, produits, activiteRecente, parUtilisateur, categoriesMarket } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import { Heart, Eye, Share2, Search } from "lucide-react";
import { toast } from "sonner";
import catMode from "@/assets/cat-mode.jpg";
import catLegumes from "@/assets/cat-legumes.jpg";
import catElectronique from "@/assets/cat-electronique.jpg";
import catServices from "@/assets/cat-services.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accueil — WICO" },
      {
        name: "description",
        content: "Recherchez produits, services et emplois près de chez vous au Burundi. Paiements en Pi, contact WhatsApp direct.",
      },
      { property: "og:title", content: "Accueil — WICO" },
      { property: "og:description", content: "Recherchez produits, services et emplois près de chez vous au Burundi. Paiements en Pi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Accueil,
});

const vitrines = [
  { image: catMode, titre: "Mode", categorie: "Vêtements" },
  { image: catLegumes, titre: "Alimentation", categorie: "Alimentation" },
  { image: catElectronique, titre: "Électronique", categorie: "Électronique" },
  { image: catServices, titre: "Services", categorie: "Services" },
];

function Accueil() {
  const t = useT();
  const favoris = useStore((s) => s.favoris);
  const { utilisateur } = useSession();
  const navigate = useNavigate();
  const [recherche, setRecherche] = useState("");

  const [produitsDb, setProduitsDb] = useState<ProduitDb[]>([]);

  useEffect(() => {
    listerProduits().then(setProduitsDb).catch(() => setProduitsDb([]));
  }, []);

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return produits.filter((p) => (p.titre + p.description + p.categorie).toLowerCase().includes(q)).slice(0, 6);
  }, [recherche]);

  const resultatsDb = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return produitsDb
      .filter((p) => (p.titre + (p.description ?? "") + p.categorie).toLowerCase().includes(q))
      .slice(0, 6);
  }, [recherche, produitsDb]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl gradient-primary p-5 text-primary-foreground shadow-[var(--shadow-float)]">
        <p className="text-sm opacity-90">
          {t("bonjour")}, <span className="font-bold">{utilisateur?.email?.split("@")[0] ?? t("invite")}</span> 👋
        </p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">WICO</h1>
        <p className="mt-1 max-w-xl text-sm opacity-90">{t("sloganAccueil")}</p>

        <form
          className="mt-4 flex items-center gap-2 rounded-xl bg-card p-2 shadow-[var(--shadow-card)]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!recherche.trim()) navigate({ to: "/market" });
          }}
        >
          <Search className="ml-1 size-4 shrink-0 text-muted-foreground" />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            maxLength={80}
            placeholder={t("rechercherPlaceholder")}
            aria-label={t("rechercher")}
            className="min-h-9 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <Bouton type="submit" taille="sm">{t("rechercher")}</Bouton>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <LienBouton to="/jobs" variante="secondaire" taille="sm">{t("jobs")}</LienBouton>
          <LienBouton to="/vendeurs" variante="contour" taille="sm">{t("trouverVendeur")}</LienBouton>
          <LienBouton to="/portefeuille" variante="pi" taille="sm">{t("wallet")}</LienBouton>
        </div>
      </section>

      {recherche.trim() && (
        <section>
          <TitreSection>🔎 {t("rechercher")} : « {recherche} »</TitreSection>
          {resultats.length === 0 && resultatsDb.length === 0 ? (
            <Carte className="text-sm text-muted-foreground">{t("aucunResultat")}</Carte>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultatsDb.map((p) => (
                <Carte key={p.id} className="space-y-2">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.titre} loading="lazy" className="h-24 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="grid h-24 place-items-center rounded-lg bg-primary-soft text-4xl">🛍️</div>
                  )}
                  <h3 className="font-semibold leading-snug">{p.titre}</h3>
                  <p className="text-sm font-bold text-primary">{formatPi(Number(p.prix))}</p>
                  <LienBouton to="/market" taille="sm" className="w-full">{t("voirTout")}</LienBouton>
                </Carte>
              ))}
              {resultats.map((p) => (
                <Carte key={p.id} className="space-y-2">
                  <div className="grid h-24 place-items-center rounded-lg bg-primary-soft text-4xl">{p.emoji}</div>
                  <h3 className="font-semibold leading-snug">{p.titre}</h3>
                  <p className="text-sm font-bold text-primary">{formatPi(p.prix)}</p>
                  <LienBouton to="/market/$id" params={{ id: p.id }} taille="sm" className="w-full">
                    {t("acheter")}
                  </LienBouton>
                </Carte>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <TitreSection action={<Link to="/market" className="text-xs font-semibold text-accent">{t("voirTout")}</Link>}>
          ✨ {t("selectionRecommandee")}
        </TitreSection>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {vitrines.map((v) => (
            <Link
              key={v.titre}
              to="/market"
              className="group relative overflow-hidden rounded-2xl shadow-[var(--shadow-card)]"
            >
              <img
                src={v.image}
                alt={`Catégorie ${v.titre}`}
                width={800}
                height={800}
                loading="lazy"
                className="h-36 w-full object-cover transition duration-300 group-hover:scale-105 sm:h-44"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/85 to-transparent" />
              <span className="absolute bottom-2 left-3 text-sm font-extrabold text-primary-foreground">{v.titre}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <TitreSection action={<Link to="/market" className="text-xs font-semibold text-accent">{t("voirTout")}</Link>}>
          🆕 {t("nouvellesAnnonces")}
        </TitreSection>
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {produitsDb.map((p) => (
            <Link
              key={p.id}
              to="/market"
              className="w-40 shrink-0 snap-start space-y-1.5 rounded-xl border border-border/60 bg-card p-2"
            >
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.titre} loading="lazy" className="h-28 w-full rounded-lg object-cover" />
              ) : (
                <div className="grid h-28 place-items-center rounded-lg bg-primary-soft text-5xl">🛍️</div>
              )}
              <p className="line-clamp-2 text-xs font-semibold leading-snug">{p.titre}</p>
              <p className="truncate text-[0.65rem] text-muted-foreground">📍 {p.lieu ?? "Burundi"}</p>
              <p className="text-sm font-extrabold text-primary">{formatPi(Number(p.prix))}</p>
              <p className="truncate text-[0.65rem] text-muted-foreground">Annonce de la communauté</p>
            </Link>
          ))}
          {produits.map((p) => {
            const v = parUtilisateur(p.vendeurId);
            return (
              <Link
                key={p.id}
                to="/market/$id"
                params={{ id: p.id }}
                className="w-40 shrink-0 snap-start space-y-1.5 rounded-xl border border-border/60 bg-card p-2"
              >
                <div className="grid h-28 place-items-center rounded-lg bg-primary-soft text-5xl">{p.emoji}</div>
                <p className="line-clamp-2 text-xs font-semibold leading-snug">{p.titre}</p>
                <p className="truncate text-[0.65rem] text-muted-foreground">📍 {p.lieu}</p>
                <p className="text-sm font-extrabold text-primary">{formatPi(p.prix)}</p>
                <p className="truncate text-[0.65rem] text-muted-foreground">{v.nom}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <TitreSection>🏷️ {t("categories")}</TitreSection>
        <div className="flex flex-wrap gap-2">
          {categoriesMarket.map((c) => (
            <LienBouton key={c} to="/market" variante="contour" taille="sm">{c}</LienBouton>
          ))}
        </div>
      </section>

      <section>
        <TitreSection>👥 {t("abonnements")}</TitreSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {utilisateurs
            .filter((u) => u.id !== "u-moi")
            .slice(0, 3)
            .map((u) => (
              <Carte key={u.id} className="flex items-center gap-3">
                <Avatar emoji={u.emoji} />
                <div className="min-w-0 flex-1">
                  <Link to="/profil/$id" params={{ id: u.id }} className="block truncate font-semibold">
                    {u.nom}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{u.metier}</p>
                  <Note note={u.note} />
                </div>
                {u.whatsapp ? (
                  <a
                    href={lienWhatsApp(u.whatsapp, `Bonjour ${u.nom} 👋`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-success/15 px-2 py-1 text-xs font-semibold text-success"
                  >
                    💬
                  </a>
                ) : (
                  <span className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                    Non vérifié
                  </span>
                )}
              </Carte>
            ))}
        </div>
      </section>

      <section>
        <TitreSection action={<Link to="/jobs" className="text-xs font-semibold text-accent">{t("voirTout")}</Link>}>
          💼 {t("jobs")}
        </TitreSection>
        <div className="grid gap-3 lg:grid-cols-2">
          {jobs.slice(0, 2).map((j) => {
            const emp = parUtilisateur(j.employeurId);
            return (
              <Carte key={j.id} className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {emp.emoji} <span className="font-semibold text-foreground">{emp.nom}</span>
                </p>
                <h3 className="font-bold">{j.titre}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Etiquette ton="pi">{formatPi(j.salairePi)}</Etiquette>
                  {j.urgent && <Etiquette ton="urgent">⚡ Urgent</Etiquette>}
                  <Distance km={emp.distanceKm} />
                </div>
                <div className="flex gap-2">
                  <LienBouton to="/jobs/$id" params={{ id: j.id }} taille="sm">VOIR</LienBouton>
                  <Bouton taille="sm" variante="contour" onClick={() => toast.success("Lien de l'offre copié !")}>
                    <Share2 className="size-4" /> PARTAGER
                  </Bouton>
                </div>
              </Carte>
            );
          })}
        </div>
      </section>

      <section>
        <TitreSection>🔥 {t("tendances")}</TitreSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {produits.slice(0, 3).map((p) => (
            <Carte key={p.id} className="space-y-2">
              <div className="grid h-28 place-items-center rounded-lg bg-primary-soft text-5xl">{p.emoji}</div>
              <h3 className="font-semibold leading-snug">{p.titre}</h3>
              <p className="text-sm font-bold text-primary">{formatPi(p.prix)}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <button
                  onClick={() => store.basculerFavori(p.id)}
                  className="inline-flex items-center gap-1"
                  aria-label="Ajouter aux favoris"
                >
                  <Heart className={favoris.includes(p.id) ? "size-4 fill-destructive text-destructive" : "size-4"} />
                  {p.favoris}
                </button>
                <span className="inline-flex items-center gap-1"><Eye className="size-4" /> {p.vues}</span>
              </div>
              <LienBouton to="/market/$id" params={{ id: p.id }} taille="sm" className="w-full">{t("acheter")}</LienBouton>
            </Carte>
          ))}
        </div>
      </section>

      <section>
        <TitreSection>✨ Activité récente</TitreSection>
        <Carte className="space-y-3">
          {activiteRecente.map((a) => (
            <div key={a.texte} className="flex gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
              <span className="text-lg">{a.icone}</span>
              <div>
                <p className="text-sm font-semibold">{a.texte}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
            </div>
          ))}
        </Carte>
      </section>
    </div>
  );
}
