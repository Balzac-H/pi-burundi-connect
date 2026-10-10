import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Bouton,
  Carte,
  Champ,
  Saisie,
  Selection,
  Zone,
  LienBouton,
  BandeauPi,
} from "@/components/ui-kit";
import { categoriesMarket } from "@/lib/data";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/auth";
import {
  chargerProfil,
  creerProduit,
  listerMesProduits,
  modifierProduit,
  televerserPhoto,
  type ProduitDb,
} from "@/lib/comptes";
import { useT } from "@/lib/i18n";

type Recherche = { id?: string };

export const Route = createFileRoute("/market/vendre")({
  validateSearch: (search: Record<string, unknown>): Recherche => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Vendre un produit — Arija Connect" },
      {
        name: "description",
        content:
          "Publiez votre annonce avec photos en quelques minutes et vendez vos produits en Pi partout au Burundi.",
      },
      { property: "og:title", content: "Vendre un produit — Arija Connect" },
      {
        property: "og:description",
        content: "Publiez une annonce avec photo et recevez vos paiements en Pi.",
      },
    ],
  }),
  component: Vendre,
});

function Vendre() {
  const navigate = useNavigate();
  const t = useT();
  const { utilisateur, chargement } = useSession();
  const { id } = Route.useSearch();
  const [photo, setPhoto] = useState<string | null>(null);
  const [existant, setExistant] = useState<ProduitDb | null>(null);
  const [chargementAnnonce, setChargementAnnonce] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) {
      setExistant(null);
      setPhoto(null);
      return;
    }
    let vivant = true;
    setChargementAnnonce(true);
    listerMesProduits(utilisateur?.id ?? "")
      .then((liste) => {
        if (!vivant) return;
        const p = liste.find((x) => x.id === id) ?? null;
        setExistant(p);
        setPhoto(p?.photo_url ?? null);
      })
      .catch(() => toast.error("Annonce introuvable."))
      .finally(() => {
        if (vivant) setChargementAnnonce(false);
      });
    return () => {
      vivant = false;
    };
  }, [id, utilisateur?.id]);

  if (chargement)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold text-foreground">Vendre un produit</h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour publier vos produits avec photos.
        </p>
        <LienBouton to="/connexion">Se connecter</LienBouton>
      </Carte>
    );
  }

  if (id && chargementAnnonce)
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">Chargement de l'annonce…</p>
    );
  if (id && !existant) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <p className="font-semibold">Annonce introuvable.</p>
        <LienBouton to="/market/boutique" taille="sm">
          Retour à ma boutique
        </LienBouton>
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
    const prix = Number(f.get("prix") ?? 0);
    if (!(prix > 0)) {
      toast.error("Indiquez un prix en Pi supérieur à 0.");
      return;
    }
    const valeurs = {
      titre: String(f.get("titre") ?? ""),
      description: String(f.get("description") ?? ""),
      categorie: String(f.get("categorie") ?? "Autre"),
      prix,
      unite: String(f.get("unite") ?? "unité"),
      stock: Number(f.get("stock") ?? 1),
      quantite_min: Math.max(1, Number(f.get("quantite_min") ?? 1)),
      lieu: String(f.get("lieu") ?? ""),
      livraison: String(f.get("livraison") ?? ""),
      photo_url: photo,
      vendeur_id: utilisateur.id,
      publie: f.get("publie") === "on",
    };
    setEnregistrement(true);
    try {
      // Publication = nouvel enregistrement ou transition false -> true.
      if (valeurs.publie && (!existant || !existant.publie)) {
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
      if (existant) {
        await modifierProduit(existant.id, valeurs);
        toast.success("Annonce mise à jour !");
      } else {
        await creerProduit(valeurs);
        toast.success("Annonce publiée !");
      }
      navigate({ to: "/market/boutique" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={soumettre}>
      <h1 className="text-2xl font-semibold text-foreground">
        {existant ? "Modifier l'annonce" : "Vendre un produit"}
      </h1>

      <Carte className="space-y-4">
        <Champ label="Photo du produit" aide="JPG ou PNG, une photo claire attire plus d'acheteurs">
          <div className="flex items-center gap-3">
            {photo ? (
              <img
                src={photo}
                alt="Aperçu du produit"
                className="size-20 rounded-lg object-cover"
              />
            ) : (
              <span className="grid size-20 place-items-center rounded-lg bg-primary-soft text-xs font-semibold text-primary">
                Photo
              </span>
            )}
            <input
              ref={fichierRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && choisirPhoto(e.target.files[0])}
            />
            <Bouton
              type="button"
              variante="contour"
              taille="sm"
              disabled={envoi}
              onClick={() => fichierRef.current?.click()}
            >
              {envoi ? "Envoi…" : photo ? "Changer la photo" : "Ajouter une photo"}
            </Bouton>
          </div>
        </Champ>

        <Champ label="Titre de l'annonce" obligatoire>
          <Saisie
            name="titre"
            required
            maxLength={120}
            defaultValue={existant?.titre ?? ""}
            key={`t${existant?.id ?? ""}`}
            placeholder="Ex. Tomates fraîches du jour (50 kg)"
          />
        </Champ>
        <Champ label="Catégorie" obligatoire>
          <Selection
            name="categorie"
            required
            defaultValue={existant?.categorie ?? categoriesMarket[0]}
            key={`c${existant?.id ?? ""}`}
          >
            {categoriesMarket.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Selection>
        </Champ>
        <Champ label="Description">
          <Zone
            name="description"
            maxLength={600}
            defaultValue={existant?.description ?? ""}
            key={`d${existant?.id ?? ""}`}
            placeholder="Détaillez la qualité, la quantité, les conditions…"
          />
        </Champ>
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Prix (π)" obligatoire aide="Ex. 0,055 π">
            <Saisie
              name="prix"
              required
              type="number"
              min={0.001}
              step="0.001"
              defaultValue={existant ? String(existant.prix) : ""}
              key={`p${existant?.id ?? ""}`}
              placeholder="0.055"
            />
          </Champ>
          <Champ label="Unité">
            <Saisie
              name="unite"
              defaultValue={existant?.unite ?? "unité"}
              key={`u${existant?.id ?? ""}`}
              maxLength={40}
            />
          </Champ>
          <Champ label="Stock disponible">
            <Saisie
              name="stock"
              type="number"
              min={0}
              defaultValue={existant?.stock ?? 1}
              key={`s${existant?.id ?? ""}`}
            />
          </Champ>
          <Champ label="Quantité minimum d'achat">
            <Saisie
              name="quantite_min"
              type="number"
              min={1}
              defaultValue={existant?.quantite_min ?? 1}
              key={`q${existant?.id ?? ""}`}
            />
          </Champ>
          <Champ label="Lieu">
            <Saisie
              name="lieu"
              maxLength={120}
              defaultValue={existant?.lieu ?? ""}
              key={`l${existant?.id ?? ""}`}
              placeholder="Kinama, Bujumbura"
            />
          </Champ>
          <Champ label="Livraison">
            <Saisie
              name="livraison"
              maxLength={120}
              defaultValue={existant?.livraison ?? ""}
              key={`lv${existant?.id ?? ""}`}
              placeholder="Gratuite (5 km) · 0,02 π au-delà"
            />
          </Champ>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="publie"
            defaultChecked={existant ? existant.publie : true}
            className="size-4 accent-[oklch(0.36_0.062_159)]"
          />
          Annonce visible dans le Market
        </label>

        <BandeauPi texte="Vos paiements sont reçus en Pi" />
      </Carte>

      <div className="flex gap-2">
        <Bouton type="submit" disabled={enregistrement}>
          {enregistrement ? "Enregistrement…" : existant ? "Enregistrer" : "Publier l'annonce"}
        </Bouton>
        <Bouton
          type="button"
          variante="contour"
          onClick={() => navigate({ to: "/market/boutique" })}
        >
          Annuler
        </Bouton>
      </div>
    </form>
  );
}
