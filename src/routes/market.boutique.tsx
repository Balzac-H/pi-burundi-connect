import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, LienBouton, TitreSection } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { listerProduits, supprimerProduit, type ProduitDb } from "@/lib/comptes";
import { formatPi } from "@/lib/store";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/market/boutique")({
  head: () => ({
    meta: [
      { title: "Ma boutique — WICO" },
      { name: "description", content: "Gérez vos annonces, vos photos de produits et votre stock sur le Market en Pi." },
      { property: "og:title", content: "Ma boutique — WICO" },
      { property: "og:description", content: "Vos produits en vente sur WICO." },
    ],
  }),
  component: Boutique,
});

function Boutique() {
  const { utilisateur, chargement } = useSession();
  const [produits, setProduits] = useState<ProduitDb[]>([]);

  const recharger = useCallback(() => {
    if (utilisateur) listerProduits(utilisateur.id).then(setProduits);
  }, [utilisateur]);

  useEffect(recharger, [recharger]);

  if (chargement) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-extrabold text-primary">Ma boutique</h1>
        <p className="text-sm text-muted-foreground">Connectez-vous pour gérer vos produits.</p>
        <LienBouton to="/connexion">SE CONNECTER</LienBouton>
      </Carte>
    );
  }

  return (
    <div className="space-y-4">
      <TitreSection action={<LienBouton to="/market/vendre" taille="sm" variante="secondaire">+ Nouvelle annonce</LienBouton>}>
        Ma boutique 🏪
      </TitreSection>

      <Carte className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold text-primary">{produits.length}</p>
          <p className="text-xs text-muted-foreground">Annonces</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-primary">{produits.reduce((s, p) => s + p.stock, 0)}</p>
          <p className="text-xs text-muted-foreground">Articles en stock</p>
        </div>
        <div>
          <p className="text-lg font-extrabold text-accent">
            {formatPi(produits.reduce((s, p) => s + Number(p.prix) * p.stock, 0))}
          </p>
          <p className="text-xs text-muted-foreground">Valeur du stock</p>
        </div>
      </Carte>

      {produits.length === 0 ? (
        <Carte className="text-sm text-muted-foreground">Aucune annonce pour le moment. Publiez votre premier produit !</Carte>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((p) => (
            <Carte key={p.id} className="space-y-2">
              {p.photo_url ? (
                <img src={p.photo_url} alt={p.titre} className="h-32 w-full rounded-lg object-cover" />
              ) : (
                <div className="grid h-32 place-items-center rounded-lg bg-primary-soft text-5xl">🛍️</div>
              )}
              <h2 className="font-bold leading-snug">{p.titre}</h2>
              <div className="flex flex-wrap gap-2">
                <Etiquette ton="pi">{formatPi(Number(p.prix))}</Etiquette>
                <Etiquette ton="succes">Stock : {p.stock}</Etiquette>
                <Etiquette>{p.categorie}</Etiquette>
              </div>
              <Bouton
                variante="danger"
                taille="sm"
                onClick={async () => {
                  try {
                    await supprimerProduit(p.id);
                    toast.success("Annonce supprimée.");
                    recharger();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Suppression impossible.");
                  }
                }}
              >
                <Trash2 className="size-4" /> SUPPRIMER
              </Bouton>
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}
