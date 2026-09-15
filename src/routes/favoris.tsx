import { createFileRoute } from "@tanstack/react-router";
import { Bouton, Carte, Etiquette, LienBouton, Avatar, Note } from "@/components/ui-kit";
import { produits, utilisateurs, parUtilisateur } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favoris")({
  head: () => ({
    meta: [
      { title: "Mes favoris — WICO" },
      { name: "description", content: "Retrouvez les produits sauvegardés et les vendeurs que vous suivez sur WICO." },
      { property: "og:title", content: "Mes favoris — WICO" },
      { property: "og:description", content: "Produits sauvegardés et profils suivis." },
    ],
  }),
  component: Favoris,
});

function Favoris() {
  const favoris = useStore((s) => s.favoris);
  const suivis = useStore((s) => s.suivis);
  const produitsFav = produits.filter((p) => favoris.includes(p.id));
  const profilsSuivis = utilisateurs.filter((u) => suivis.includes(u.id));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold text-primary">Mes favoris ❤️</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Produits sauvegardés ({produitsFav.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {produitsFav.map((p) => (
            <Carte key={p.id} className="space-y-2">
              <div className="grid h-24 place-items-center rounded-lg bg-primary-soft text-5xl">{p.emoji}</div>
              <h3 className="font-semibold leading-snug">{p.titre}</h3>
              <Etiquette ton="pi">{formatPi(p.prix)}</Etiquette>
              <p className="text-xs text-muted-foreground">Vendeur : {parUtilisateur(p.vendeurId).nom}</p>
              <div className="flex gap-2">
                <LienBouton to="/market/$id" params={{ id: p.id }} taille="sm" className="flex-1">VOIR</LienBouton>
                <Bouton variante="contour" taille="sm" onClick={() => store.basculerFavori(p.id)}>
                  <Heart className="size-4 fill-destructive text-destructive" />
                </Bouton>
              </div>
            </Carte>
          ))}
          {produitsFav.length === 0 && <Carte className="text-sm text-muted-foreground">Aucun produit favori pour l'instant.</Carte>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Profils suivis ({profilsSuivis.length})</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {profilsSuivis.map((u) => (
            <Carte key={u.id} className="flex items-center gap-3">
              <Avatar emoji={u.emoji} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.nom}</p>
                <p className="truncate text-xs text-muted-foreground">{u.metier}</p>
                <Note note={u.note} />
              </div>
              <LienBouton to="/profil/$id" params={{ id: u.id }} variante="contour" taille="sm">PROFIL</LienBouton>
            </Carte>
          ))}
          {profilsSuivis.length === 0 && <Carte className="text-sm text-muted-foreground">Vous ne suivez encore personne.</Carte>}
        </div>
      </section>
    </div>
  );
}
