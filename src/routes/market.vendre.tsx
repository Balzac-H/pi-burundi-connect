import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bouton, Carte, Champ, Saisie, Selection, Zone, LienBouton, BandeauPi } from "@/components/ui-kit";
import { categoriesMarket } from "@/lib/data";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useSession } from "@/lib/auth";
import { creerProduit, televerserPhoto } from "@/lib/comptes";

export const Route = createFileRoute("/market/vendre")({
  head: () => ({
    meta: [
      { title: "Vendre un produit — WICO" },
      { name: "description", content: "Publiez votre annonce avec photos en quelques minutes et vendez vos produits en Pi partout au Burundi." },
      { property: "og:title", content: "Vendre un produit — WICO" },
      { property: "og:description", content: "Publiez une annonce avec photo et recevez vos paiements en Pi." },
    ],
  }),
  component: Vendre,
});

function Vendre() {
  const navigate = useNavigate();
  const { utilisateur, chargement } = useSession();
  const [photo, setPhoto] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  if (chargement) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-extrabold text-primary">Vendre un produit</h1>
        <p className="text-sm text-muted-foreground">Connectez-vous pour publier vos produits avec photos.</p>
        <LienBouton to="/connexion">SE CONNECTER</LienBouton>
      </Carte>
    );
  }

  async function choisirPhoto(fichier: File) {
    if (!utilisateur) return;
    setEnvoi(true);
    try {
      setPhoto(await televerserPhoto("produits", utilisateur.id, fichier));
      toast.success("Photo ajoutée.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement.");
    } finally {
      setEnvoi(false);
    }
  }

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!utilisateur) return;
    const f = new FormData(e.currentTarget);
    setEnregistrement(true);
    try {
      await creerProduit({
        vendeur_id: utilisateur.id,
        titre: String(f.get("titre") ?? ""),
        description: String(f.get("description") ?? ""),
        categorie: String(f.get("categorie") ?? "Autre"),
        prix: Number(f.get("prix") ?? 0),
        unite: String(f.get("unite") ?? "unité"),
        stock: Number(f.get("stock") ?? 1),
        lieu: String(f.get("lieu") ?? ""),
        livraison: String(f.get("livraison") ?? ""),
        photo_url: photo,
        updated_at: new Date().toISOString(),
      } as never);
      toast.success("Annonce publiée !");
      navigate({ to: "/market/boutique" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la publication.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={soumettre}>
      <h1 className="text-2xl font-extrabold text-primary">Vendre un produit 🛍️</h1>

      <Carte className="space-y-4">
        <Champ label="Photo du produit" aide="JPG ou PNG, une photo claire attire plus d'acheteurs">
          <div className="flex items-center gap-3">
            {photo ? (
              <img src={photo} alt="Aperçu du produit" className="size-20 rounded-lg object-cover" />
            ) : (
              <span className="grid size-20 place-items-center rounded-lg bg-primary-soft text-3xl">📷</span>
            )}
            <input
              ref={fichierRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && choisirPhoto(e.target.files[0])}
            />
            <Bouton type="button" variante="contour" taille="sm" disabled={envoi} onClick={() => fichierRef.current?.click()}>
              {envoi ? "Envoi…" : photo ? "Changer la photo" : "Ajouter une photo"}
            </Bouton>
          </div>
        </Champ>

        <Champ label="Titre de l'annonce" obligatoire>
          <Saisie name="titre" required maxLength={120} placeholder="Ex. Tomates fraîches du jour (50 kg)" />
        </Champ>
        <Champ label="Catégorie" obligatoire>
          <Selection name="categorie" required defaultValue={categoriesMarket[0]}>
            {categoriesMarket.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Selection>
        </Champ>
        <Champ label="Description">
          <Zone name="description" maxLength={600} placeholder="Détaillez la qualité, la quantité, les conditions…" />
        </Champ>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Prix (π)" obligatoire aide="Entre 0,001 et 1 π — ex. 0,055">
            <Saisie name="prix" required type="number" min={0.001} max={1} step="0.001" placeholder="0.055" />
          </Champ>
          <Champ label="Unité">
            <Saisie name="unite" defaultValue="unité" maxLength={40} />
          </Champ>
          <Champ label="Stock disponible">
            <Saisie name="stock" type="number" min={0} defaultValue={1} />
          </Champ>
          <Champ label="Lieu">
            <Saisie name="lieu" maxLength={120} placeholder="Kinama, Bujumbura" />
          </Champ>
        </div>
        <Champ label="Livraison">
          <Saisie name="livraison" maxLength={120} placeholder="Gratuite (5 km) · 0,02 π au-delà" />
        </Champ>

        <BandeauPi texte="Vos paiements sont reçus en Pi" />
      </Carte>

      <div className="flex gap-2">
        <Bouton type="submit" disabled={enregistrement}>{enregistrement ? "Publication…" : "PUBLIER L'ANNONCE"}</Bouton>
        <Bouton type="button" variante="contour" onClick={() => navigate({ to: "/market" })}>ANNULER</Bouton>
      </div>
    </form>
  );
}
