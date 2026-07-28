import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listerProduits, lienWhatsApp, chargerProfil, type ProduitDb, type Profil } from "@/lib/comptes";
import { Bouton, Carte, Etiquette, Saisie, Selection, LienBouton, Note, Distance } from "@/components/ui-kit";
import { produits, parUtilisateur, categoriesMarket } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { toast } from "sonner";
import { Heart, Eye } from "lucide-react";

export const Route = createFileRoute("/market/")({
  head: () => ({
    meta: [
      { title: "Market — Acheter et vendre en Pi au Burundi" },
      { name: "description", content: "Produits frais, vêtements, électronique et services près de chez vous. Achetez et vendez en Pi." },
      { property: "og:title", content: "Market — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Le marché peer-to-peer du Burundi, paiements en Pi." },
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-primary">MARKET 🛍️</h1>
        <div className="flex gap-2">
          <LienBouton to="/market/boutique" variante="contour" taille="sm">Ma boutique</LienBouton>
          <LienBouton to="/market/vendre" variante="secondaire" taille="sm">Vendre</LienBouton>
        </div>
      </div>

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

      <Carte className="grid gap-2 sm:grid-cols-3">
        <Selection value={tri} onChange={(e) => setTri(e.target.value)}>
          <option value="recent">Trier : plus récents</option>
          <option value="prix-asc">Prix croissant</option>
          <option value="prix-desc">Prix décroissant</option>
        </Selection>
        <Bouton variante={suivisSeulement ? "primaire" : "contour"} onClick={() => setSuivisSeulement((v) => !v)}>
          Vendeurs suivis
        </Bouton>
        <Saisie placeholder="Rechercher un produit…" value={recherche} onChange={(e) => setRecherche(e.target.value)} maxLength={80} />
      </Carte>

      <ProduitsCommunaute recherche={recherche} categorie={categorie} />

      <h2 className="text-lg font-bold text-primary">Produits en vedette</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((p) => {
          const v = parUtilisateur(p.vendeurId);
          return (
            <Carte key={p.id} className="space-y-2">
              <div className="grid h-32 place-items-center rounded-lg bg-primary-soft text-6xl">{p.emoji}</div>
              <h2 className="font-bold leading-snug">{p.titre}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/profil/$id" params={{ id: v.id }} className="text-xs font-semibold">{v.nom}</Link>
                <Note note={v.note} />
                <Distance km={v.distanceKm} />
              </div>
              <div className="flex items-center gap-2">
                <Etiquette ton="pi">{formatPi(p.prix)}</Etiquette>
                <Etiquette ton="succes">✅ Stock : {p.stock}</Etiquette>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <button onClick={() => store.basculerFavori(p.id)} className="inline-flex items-center gap-1" aria-label="Favori">
                  <Heart className={favoris.includes(p.id) ? "size-4 fill-destructive text-destructive" : "size-4"} /> {p.favoris}
                </button>
                <span className="inline-flex items-center gap-1"><Eye className="size-4" /> {p.vues}</span>
              </div>
              <div className="flex gap-2">
                <LienBouton to="/market/$id" params={{ id: p.id }} taille="sm" className="flex-1">ACHETER</LienBouton>
                <Bouton
                  variante="contour"
                  taille="sm"
                  onClick={() => {
                    store.ajouterAuPanier(p.id);
                    toast.success("Ajouté au panier");
                  }}
                >
                  PANIER
                </Bouton>
              </div>
            </Carte>
          );
        })}
        {liste.length === 0 && <Carte className="text-sm text-muted-foreground">Aucun produit trouvé.</Carte>}
      </div>
    </div>
  );
}
