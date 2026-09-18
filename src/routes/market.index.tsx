import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listerProduits, lienWhatsApp, chargerProfil, type ProduitDb, type Profil } from "@/lib/comptes";
import { Bouton, Carte, Etiquette, Saisie, Selection, LienBouton, Note, Distance } from "@/components/ui-kit";
import { produits, parUtilisateur, categoriesMarket } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { imageProduit } from "@/lib/produits-visuels";
import { toast } from "sonner";
import { Heart, Eye, Search, ShoppingCart, Store } from "lucide-react";

export const Route = createFileRoute("/market/")({
  head: () => ({
    meta: [
      { title: "Market — Acheter et vendre en Pi au Burundi" },
      { name: "description", content: "Produits frais, vêtements, électronique et services près de chez vous. Achetez et vendez en Pi." },
      { property: "og:title", content: "Market — WICO" },
      { property: "og:description", content: "Le marché peer-to-peer du Burundi, paiements en Pi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Market,
});

function Market() {
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("");
  const [tri, setTri] = useState("recent");
  const [suivisSeulement, setSuivisSeulement] = useState(false);
  const favoris = useStore((s) => s.favoris);
  const suivis = useStore((s) => s.suivis);

  const liste = produits
    .filter(
      (p) =>
        (!categorie || p.categorie === categorie) &&
        (!suivisSeulement || suivis.includes(p.vendeurId)) &&
        (p.titre + p.description).toLowerCase().includes(recherche.toLowerCase()),
    )
    .sort((a, b) => (tri === "prix-asc" ? a.prix - b.prix : tri === "prix-desc" ? b.prix - a.prix : 0));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-primary">Market WICO</h1>
          <p className="text-sm text-muted-foreground">Achetez près de chez vous, payez en Pi.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <LienBouton to="/market/boutique" variante="contour" taille="sm" aria-label="Ma boutique"><Store className="size-4" /><span className="hidden sm:inline">Ma boutique</span></LienBouton>
          <LienBouton to="/market/vendre" variante="secondaire" taille="sm">Vendre</LienBouton>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">Rechercher un produit</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Saisie
          placeholder="Que recherchez-vous ?"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          maxLength={80}
          className="min-h-13 rounded-xl bg-card pl-12 pr-4 text-base shadow-[var(--shadow-card)]"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Bouton taille="sm" variante={categorie === "" ? "primaire" : "contour"} onClick={() => setCategorie("")}>
          Tout
        </Bouton>
        {categoriesMarket.map((c) => (
          <Bouton key={c} taille="sm" variante={categorie === c ? "primaire" : "contour"} onClick={() => setCategorie(c)} className="whitespace-nowrap">
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
        <Bouton variante={suivisSeulement ? "primaire" : "contour"} onClick={() => setSuivisSeulement((v) => !v)} className="whitespace-nowrap">
          {suivisSeulement ? "Suivis ✓" : "Vendeurs suivis"}
        </Bouton>
      </div>

      <ProduitsCommunaute recherche={recherche} categorie={categorie} />

      <h2 className="text-lg font-bold text-primary">Produits en vedette</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {liste.map((p) => {
          const v = parUtilisateur(p.vendeurId);
          return (
            <article key={p.id} className="min-w-0 space-y-2">
              <Link to="/market/$id" params={{ id: p.id }} className="group relative block aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={imageProduit(p.id, p.categorie)} alt={p.titre} className="size-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
                <span className="absolute bottom-2 left-2 grid size-9 place-items-center rounded-full border border-border bg-card text-foreground shadow-[var(--shadow-card)]" aria-hidden="true"><Eye className="size-4" /></span>
              </Link>
              <Link to="/market/$id" params={{ id: p.id }} className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 hover:text-primary sm:text-base">{p.titre}</Link>
              <div className="flex min-w-0 items-center gap-1.5 text-xs"><Note note={p.note} /><span className="truncate text-muted-foreground">({p.avis})</span></div>
              <p className="text-xl font-extrabold text-foreground">{formatPi(p.prix)}</p>
              <p className="truncate text-xs text-muted-foreground">{v.nom} · {v.distanceKm} km</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <button onClick={() => store.basculerFavori(p.id)} className="inline-flex items-center gap-1" aria-label="Favori">
                  <Heart className={favoris.includes(p.id) ? "size-4 fill-destructive text-destructive" : "size-4"} /> {p.favoris}
                </button>
                <span className="inline-flex items-center gap-1"><Eye className="size-4" /> {p.vues}</span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <LienBouton to="/market/$id" params={{ id: p.id }} variante="contour" taille="sm" className="min-w-0">Voir les options</LienBouton>
                <Bouton
                  variante="secondaire"
                  taille="sm"
                  aria-label={`Ajouter ${p.titre} au panier`}
                  className="w-9 px-0"
                  onClick={() => {
                    store.ajouterAuPanier(p.id);
                    toast.success("Ajouté au panier");
                  }}
                >
                  <ShoppingCart className="size-4" />
                </Bouton>
              </div>
            </article>
          );
        })}
        {liste.length === 0 && <Carte className="text-sm text-muted-foreground">Aucun produit trouvé.</Carte>}
      </div>
    </div>
  );
}

function ProduitsCommunaute({ recherche, categorie }: { recherche: string; categorie: string }) {
  const [items, setItems] = useState<ProduitDb[]>([]);
  const [vendeurs, setVendeurs] = useState<Record<string, Profil | null>>({});

  useEffect(() => {
    listerProduits().then(async (p) => {
      setItems(p);
      const ids = [...new Set(p.map((x) => x.vendeur_id))];
      const profils = await Promise.all(ids.map((id) => chargerProfil(id)));
      setVendeurs(Object.fromEntries(ids.map((id, i) => [id, profils[i]])));
    });
  }, []);

  const liste = items.filter(
    (p) =>
      (!categorie || p.categorie === categorie) &&
      (p.titre + (p.description ?? "")).toLowerCase().includes(recherche.toLowerCase()),
  );

  if (liste.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-primary">Produits de la communauté</h2>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
        {liste.map((p) => {
          const v = vendeurs[p.vendeur_id];
          return (
            <article key={p.id} className="min-w-0 space-y-2">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.titre} className="aspect-square w-full rounded-lg bg-muted object-cover" loading="lazy" />
              ) : (
                <div className="grid aspect-square w-full place-items-center rounded-lg bg-primary-soft text-5xl">🛍️</div>
              )}
              <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 sm:text-base">{p.titre}</h3>
              <p className="text-xl font-extrabold">{formatPi(Number(p.prix))}</p>
              {v && <p className="truncate text-xs text-muted-foreground">{v.nom} {v.ville ? `· ${v.ville}` : ""}</p>}
              {p.description && <p className="line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
              {v?.whatsapp && (
                <a
                  href={lienWhatsApp(v.whatsapp, `Bonjour, je suis intéressé par « ${p.titre} »`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-2 text-center text-xs font-semibold text-success"
                >
                  💬 CONTACTER SUR WHATSAPP
                </a>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
