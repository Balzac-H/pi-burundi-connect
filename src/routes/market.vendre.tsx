import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bouton, Carte, Champ, Saisie, Selection, Zone } from "@/components/ui-kit";
import { categoriesMarket } from "@/lib/data";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/market/vendre")({
  head: () => ({
    meta: [
      { title: "Vendre un produit — BURUNDI PI CONNECT" },
      { name: "description", content: "Créez votre annonce en quelques minutes et vendez vos produits en Pi partout au Burundi." },
      { property: "og:title", content: "Vendre un produit — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Publiez une annonce et recevez vos paiements en Pi." },
    ],
  }),
  component: Vendre,
});

function Vendre() {
  const navigate = useNavigate();
  const [livraison, setLivraison] = useState(true);

  return (
    <form
      className="mx-auto max-w-2xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        toast.success("Annonce publiée !");
        navigate({ to: "/market" });
      }}
    >
      <h1 className="text-2xl font-extrabold text-primary">Créer une annonce</h1>

      <Carte className="space-y-4">
        <Champ label="Photos du produit" obligatoire aide="Minimum 3, maximum 10 photos">
          <div className="grid h-32 place-items-center rounded-lg border-2 border-dashed border-border bg-muted text-center text-sm text-muted-foreground">
            📷 Glissez-déposez vos photos ici
            <br />
            <span className="text-xs">ou cliquez pour parcourir</span>
          </div>
        </Champ>
        <Champ label="Titre du produit" obligatoire>
          <Saisie required maxLength={100} placeholder="Ex. Tomates fraîches du jour (50 kg)" />
        </Champ>
        <Champ label="Catégorie" obligatoire>
          <Selection required defaultValue="">
            <option value="" disabled>Choisir une catégorie</option>
            {categoriesMarket.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Selection>
        </Champ>
        <Champ label="Description détaillée" obligatoire aide="Max 1000 caractères">
          <Zone required maxLength={1000} placeholder="Origine, qualité, conditions de vente…" />
        </Champ>
        <div className="grid gap-4 sm:grid-cols-3">
          <Champ label="Prix (Pi)" obligatoire>
            <Saisie required type="number" min={1} placeholder="2500" />
          </Champ>
          <Champ label="Quantité" obligatoire>
            <Saisie required type="number" min={1} placeholder="20" />
          </Champ>
          <Champ label="Unité" obligatoire>
            <Selection required defaultValue="kg">
              <option value="kg">kg</option>
              <option value="unite">unité</option>
              <option value="lot">lot</option>
              <option value="litre">litre</option>
            </Selection>
          </Champ>
        </div>
        <Champ label="Localisation" obligatoire>
          <Saisie required maxLength={150} placeholder="Quartier Kinama, Bujumbura" />
        </Champ>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={livraison} onChange={(e) => setLivraison(e.target.checked)} className="size-4 accent-[oklch(0.36_0.062_159)]" />
          Livraison disponible
        </label>
        {livraison && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Rayon de livraison gratuite (km)">
              <Saisie type="number" min={0} defaultValue={5} />
            </Champ>
            <Champ label="Prix de livraison au-delà (Pi)">
              <Saisie type="number" min={0} defaultValue={200} />
            </Champ>
          </div>
        )}

        <Champ label="Date limite de disponibilité">
          <Saisie type="date" />
        </Champ>
        <Champ label="Tags / Mots-clés" aide="Séparés par des virgules">
          <Saisie maxLength={200} placeholder="bio, local, frais" />
        </Champ>
      </Carte>

      <div className="flex flex-wrap gap-2">
        <Bouton type="submit">PUBLIER L'ANNONCE</Bouton>
        <Bouton type="button" variante="contour" onClick={() => toast("Aperçu généré.")}>APERÇU</Bouton>
        <Bouton type="button" variante="fantome" onClick={() => toast.success("Brouillon enregistré.")}>BROUILLON</Bouton>
      </div>
    </form>
  );
}
