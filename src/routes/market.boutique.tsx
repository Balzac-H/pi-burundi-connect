import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, LienBouton, TitreSection } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import {
  chargerProfil,
  listerMesProduits,
  modifierProduit,
  supprimerProduit,
  type ProduitDb,
} from "@/lib/comptes";
import { useT } from "@/lib/i18n";
import { formatPi } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/market/boutique")({
  head: () => ({
    meta: [
      { title: "Ma boutique — Arija Connect" },
      {
        name: "description",
        content: "Gérez vos annonces, vos photos de produits et votre stock sur le Market en Pi.",
      },
      { property: "og:title", content: "Ma boutique — Arija Connect" },
      { property: "og:description", content: "Vos produits en vente sur Arija Connect." },
    ],
  }),
  component: Boutique,
});

function Boutique() {
  const t = useT();
  const { utilisateur, chargement } = useSession();
  const [produits, setProduits] = useState<ProduitDb[]>([]);

  const recharger = useCallback(() => {
    if (utilisateur) listerMesProduits(utilisateur.id).then(setProduits);
  }, [utilisateur]);

  useEffect(recharger, [recharger]);

  if (chargement)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold text-foreground">Ma boutique</h1>
        <p className="text-sm text-muted-foreground">Connectez-vous pour gérer vos produits.</p>
        <LienBouton to="/connexion">Se connecter</LienBouton>
      </Carte>
    );
  }

  return (
    <div className="space-y-4">
      <TitreSection
        action={
          <LienBouton to="/market/vendre" taille="sm" variante="secondaire">
            + Nouvelle annonce
          </LienBouton>
        }
      >
        Ma boutique
      </TitreSection>

      <Carte className="grid grid-cols-2 gap-3 text-center sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-primary">{produits.length}</p>
          <p className="text-xs text-muted-foreground">Annonces</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-primary">
            {produits.reduce((s, p) => s + p.stock, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Articles en stock</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-primary">
            {formatPi(produits.reduce((s, p) => s + Number(p.prix) * p.stock, 0))}
          </p>
          <p className="text-xs text-muted-foreground">Valeur du stock</p>
        </div>
      </Carte>

      {produits.length === 0 ? (
        <Carte className="text-sm text-muted-foreground">
          Aucune annonce pour le moment. Publiez votre premier produit !
        </Carte>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((p) => (
            <Carte key={p.id} className="space-y-2">
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={p.titre}
                  className="h-32 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="grid h-32 place-items-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                  Aucune photo
                </div>
              )}
              <h2 className="font-semibold leading-snug">{p.titre}</h2>
              <div className="flex flex-wrap gap-2">
                <Etiquette ton="pi">{formatPi(Number(p.prix))}</Etiquette>
                <Etiquette ton="succes">Stock : {p.stock}</Etiquette>
                <Etiquette>{p.categorie}</Etiquette>
                <Etiquette ton={p.publie ? "succes" : "neutre"}>
                  {p.publie ? "Visible" : "Masquée"}
                </Etiquette>
              </div>
              <div className="flex flex-wrap gap-2">
                <LienBouton
                  to="/market/vendre"
                  search={{ id: p.id }}
                  variante="contour"
                  taille="sm"
                >
                  Modifier
                </LienBouton>
                <Bouton
                  variante="secondaire"
                  taille="sm"
                  onClick={async () => {
                    try {
                      if (!p.publie) {
                        const profil = await chargerProfil(utilisateur.id);
                        if (!profil?.pi_uid) {
                          toast.error(t("piRequisPourVendre"));
                          return;
                        }
                        if (!profil.vendeur_actif) {
                          toast.error(t("activerPourPublier"));
                          return;
                        }
                      }
                      await modifierProduit(p.id, { publie: !p.publie });
                      toast.success(
                        p.publie ? "Annonce masquée du Market." : "Annonce visible dans le Market.",
                      );
                      recharger();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Modification impossible.");
                    }
                  }}
                >
                  {p.publie ? "Masquer" : "Publier"}
                </Bouton>
              </div>
              <Bouton
                variante="danger"
                taille="sm"
                className="w-full"
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
                Supprimer
              </Bouton>
            </Carte>
          ))}
        </div>
      )}
    </div>
  );
}
