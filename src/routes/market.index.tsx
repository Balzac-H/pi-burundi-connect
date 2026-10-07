import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  listerProduits,
  lienWhatsApp,
  chargerProfilCache,
  type ProduitDb,
  type Profil,
} from "@/lib/comptes";
import { Bouton, Carte, Saisie, Selection, LienBouton, TitreSection } from "@/components/ui-kit";
import { categoriesMarket } from "@/lib/data";
import { useT } from "@/lib/i18n";
import { chargerSuivis } from "@/lib/social";
import { store, useStore, formatPi } from "@/lib/store";
import { imageProduit } from "@/lib/produits-visuels";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/market/")({
  head: () => ({
    meta: [
      { title: "Market — Acheter et vendre en Pi au Burundi" },
      {
        name: "description",
        content:
          "Produits frais, vêtements, électronique et services près de chez vous. Achetez et vendez en Pi.",
      },
      { property: "og:title", content: "Market — Arija" },
      {
        property: "og:description",
        content: "Le marché peer-to-peer du Burundi, paiements en Pi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Market,
});

function Market() {
  const t = useT();
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [tri, setTri] = useState("recent");
  const [suivisSeulement, setSuivisSeulement] = useState(false);
  const favoris = useStore((s) => s.favoris);

  const [annonces, setAnnonces] = useState<ProduitDb[]>([]);
  const [suivis, setSuivis] = useState<string[]>([]);

  useEffect(() => {
    let vivant = true;
    listerProduits()
      .then((p) => {
        if (vivant) setAnnonces(p);
      })
      .catch(() => undefined);
    supabase.auth.getUser().then(({ data }) => {
      const moi = data.user?.id;
      if (moi && vivant)
        chargerSuivis(moi)
          .then(setSuivis)
          .catch(() => undefined);
    });
    return () => {
      vivant = false;
    };
  }, []);

  const liste = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return annonces
      .filter(
        (p) =>
          (!categorie || p.categorie === categorie) &&
          (!suivisSeulement || suivis.includes(p.vendeur_id)) &&
          (!q || (p.titre + (p.description ?? "") + p.categorie).toLowerCase().includes(q)),
      )
      .sort((a, b) =>
        tri === "prix-asc"
          ? Number(a.prix) - Number(b.prix)
          : tri === "prix-desc"
            ? Number(b.prix) - Number(a.prix)
            : a.created_at < b.created_at
              ? 1
              : -1,
      );
  }, [annonces, categorie, suivisSeulement, suivis, recherche, tri]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold text-foreground">Market Arija</h1>
          <p className="text-sm text-muted-foreground">Achetez près de chez vous, payez en Pi.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <LienBouton to="/market/boutique" variante="contour" taille="sm">
            {t("maBoutique")}
          </LienBouton>
          <LienBouton to="/market/vendre" variante="secondaire" taille="sm">
            {t("vendre")}
          </LienBouton>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">{t("rechercher")}</span>
        <Saisie
          placeholder={t("rechercherPlaceholder")}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          maxLength={80}
          className="min-h-13 rounded-md bg-card px-4 text-base"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Bouton
          taille="sm"
          variante={categorie === "" ? "primaire" : "contour"}
          onClick={() => setCategorie("")}
        >
          {t("tout")}
        </Bouton>
        {categoriesMarket.map((c) => (
          <Bouton
            key={c}
            taille="sm"
            variante={categorie === c ? "primaire" : "contour"}
            onClick={() => setCategorie(c)}
            className="whitespace-nowrap"
          >
            {c}
          </Bouton>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:max-w-xl">
        <Selection value={tri} onChange={(e) => setTri(e.target.value)}>
          <option value="recent">Trier : plus récents</option>
          <option value="prix-asc">Prix croissant</option>
          <option value="prix-desc">Prix décroissant</option>
        </Selection>
        <Bouton
          variante={suivisSeulement ? "primaire" : "contour"}
          onClick={() => setSuivisSeulement((v) => !v)}
          className="whitespace-nowrap"
        >
          {suivisSeulement ? "Suivis" : t("abonnements")}
        </Bouton>
      </div>

      <section className="space-y-3">
        <TitreSection>{t("produitsCommunaute")}</TitreSection>
        {liste.length === 0 ? (
          <Carte className="text-sm text-muted-foreground">{t("aucuneAnnonce")}</Carte>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {liste.map((p) => (
              <CarteAnnonce key={p.id} p={p} favori={favoris.includes(p.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CarteAnnonce({ p, favori }: { p: ProduitDb; favori: boolean }) {
  const t = useT();
  const [v, setV] = useState<Profil | null>(null);
  useEffect(() => {
    chargerProfilCache(p.vendeur_id)
      .then(setV)
      .catch(() => undefined);
  }, [p.vendeur_id]);

  return (
    <article className="min-w-0 space-y-2">
      <Link
        to="/market/$id"
        params={{ id: p.id }}
        className="group relative block aspect-square overflow-hidden rounded-lg bg-muted"
      >
        {p.photo_url ? (
          <img src={p.photo_url} alt={p.titre} className="size-full object-cover" loading="lazy" />
        ) : (
          <img
            src={imageProduit(p.id, p.categorie)}
            alt={p.titre}
            className="size-full object-cover"
            loading="lazy"
          />
        )}
      </Link>
      <Link
        to="/market/$id"
        params={{ id: p.id }}
        className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 hover:text-primary sm:text-base"
      >
        {p.titre}
      </Link>
      <p className="text-xl font-semibold text-primary">{formatPi(Number(p.prix))}</p>
      {v && (
        <p className="truncate text-xs text-muted-foreground">
          {v.nom}
          {v.ville ? ` · ${v.ville}` : ""}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <button
          onClick={() => store.basculerFavori(p.id)}
          className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary"
        >
          {favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        </button>
        <span>Stock : {p.stock}</span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <LienBouton
          to="/market/$id"
          params={{ id: p.id }}
          variante="contour"
          taille="sm"
          className="min-w-0"
        >
          Voir les options
        </LienBouton>
        <Bouton
          variante="secondaire"
          taille="sm"
          aria-label={`Ajouter ${p.titre} au panier`}
          onClick={() => {
            store.ajouterAuPanier(p.id, 1, p.titre);
            toast.success(t("ajouteAuPanier"));
          }}
        >
          Panier
        </Bouton>
      </div>
      <LienBouton
        to="/messages/$id"
        params={{ id: p.vendeur_id }}
        taille="sm"
        className="w-full justify-center"
      >
        {t("chat")}
      </LienBouton>
      {v?.whatsapp && (
        <a
          href={lienWhatsApp(v.whatsapp, `Bonjour, je suis intéressé par « ${p.titre} »`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary/40 px-2 text-center text-xs font-semibold text-primary hover:bg-primary-soft"
        >
          {t("contactWhatsapp")}
        </a>
      )}
    </article>
  );
}
