import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bouton,
  Carte,
  Etiquette,
  Avatar,
  LienBouton,
  BandeauPi,
  Saisie,
} from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import {
  chargerProfil,
  chargerProfilCache,
  lienWhatsApp,
  type ProduitDb,
  type Profil,
} from "@/lib/comptes";
import { store, useStore, formatPi } from "@/lib/store";
import { imageProduit } from "@/lib/produits-visuels";
import { piDisponible } from "@/lib/pi";
import { lienConnexion } from "@/lib/retour";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";
import { BoutonSignaler } from "@/components/Confiance";
import { useT } from "@/lib/i18n";

type Produit = ProduitDb & { quantite_min: number };

export const Route = createFileRoute("/market/$id")({
  head: () => ({
    meta: [
      { title: "Annonce — Market Arija" },
      { name: "description", content: "Détail d'une annonce du Market Arija, payable en Pi." },
      { property: "og:title", content: "Annonce — Market Arija" },
      { property: "og:description", content: "Achetez près de chez vous, payez en Pi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetailProduit,
});

function DetailProduit() {
  const { id } = Route.useParams();
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const { utilisateur } = useSession();
  const [produit, setProduit] = useState<Produit | null | undefined>(undefined);
  const [vendeur, setVendeur] = useState<Profil | null>(null);
  const [moi, setMoi] = useState<Profil | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [pi, setPi] = useState(true);
  const favori = useStore((s) => s.favoris.includes(id));

  useEffect(() => {
    setPi(piDisponible());
    if (utilisateur?.id)
      chargerProfilCache(utilisateur.id)
        .then(setMoi)
        .catch(() => undefined);
  }, [utilisateur?.id]);

  useEffect(() => {
    setPi(piDisponible());
    supabase
      .from("produits")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        const p = (data as Produit | null) ?? null;
        setProduit(p);
        if (p) {
          setQuantite(Math.max(1, p.quantite_min ?? 1));
          chargerProfil(p.vendeur_id).then(setVendeur);
        }
      });
  }, [id]);

  if (produit === undefined)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  if (!produit) {
    return (
      <Carte className="text-center">
        <p className="font-semibold">Annonce introuvable.</p>
        <LienBouton to="/market" taille="sm" className="mt-3">
          Retour au marché
        </LienBouton>
      </Carte>
    );
  }

  const min = Math.max(1, produit.quantite_min ?? 1);
  const epuise = produit.stock < min;
  const qValide = quantite >= min && quantite <= produit.stock;
  const monAnnonce = !!utilisateur && produit.vendeur_id === utilisateur.id;
  const connectePi = !!utilisateur && !!moi?.pi_uid;
  const fiche = produit;

  /** Connexion Pi obligatoire : on ne montre aucune erreur rouge, on redirige. */
  function versConnexion() {
    router.history.push(lienConnexion(`/market/${fiche.id}`));
  }

  function ajouterAuPanier() {
    store.ajouterAuPanier(fiche.id, quantite, fiche.titre);
    toast.success(t("ajouteAuPanier"));
  }

  /** « Acheter maintenant » : au panier, puis /paiement avec cet article seul. */
  function acheter() {
    if (monAnnonce || epuise || !qValide) return;
    if (!connectePi) {
      versConnexion();
      return;
    }
    store.ajouterAuPanier(fiche.id, quantite, fiche.titre);
    if (!pi) toast.info(t("piBrowserRequis"));
    navigate({ to: "/paiement", search: { produits: fiche.id } });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/market" })}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground"
        >
          Retour
        </button>
        <Bouton variante="contour" taille="sm" onClick={() => store.basculerFavori(produit.id)}>
          {favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        </Bouton>
      </div>

      <Carte className="space-y-3 p-0 pb-4">
        <img
          src={produit.photo_url || imageProduit(produit.id, produit.categorie)}
          alt={produit.titre}
          className="aspect-square max-h-[34rem] w-full rounded-t-lg bg-muted object-cover"
        />
        <h1 className="px-4 text-2xl font-semibold text-foreground">{produit.titre}</h1>
        <p className="px-4 text-2xl font-semibold text-primary">
          {formatPi(produit.prix)}{" "}
          <span className="text-sm font-normal text-muted-foreground">/ {produit.unite}</span>
        </p>
        <div className="flex flex-wrap gap-2 px-4">
          <Etiquette ton={epuise ? "urgent" : "succes"}>
            {epuise ? "Épuisé" : `En stock : ${produit.stock} ${produit.unite}`}
          </Etiquette>
          {min > 1 && (
            <Etiquette>
              Minimum : {min} {produit.unite}
            </Etiquette>
          )}
          {produit.lieu && <Etiquette>{produit.lieu}</Etiquette>}
          {produit.livraison && <Etiquette>{produit.livraison}</Etiquette>}
        </div>
        {produit.description && <p className="px-4 text-sm">{produit.description}</p>}
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Vendeur</h2>
        <div className="flex items-center gap-3">
          {vendeur?.photo_url ? (
            <img src={vendeur.photo_url} alt="" className="size-12 rounded-full object-cover" />
          ) : (
            <Avatar nom={vendeur?.nom} />
          )}
          <Link to="/profil/$id" params={{ id: produit.vendeur_id }} className="font-semibold">
            {vendeur?.nom || "Membre"}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {!monAnnonce && (
            <LienBouton to="/messages/$id" params={{ id: produit.vendeur_id }}>
              {t("chat")}
            </LienBouton>
          )}
          {!monAnnonce && vendeur?.whatsapp && (
            <a
              href={lienWhatsApp(
                vendeur.whatsapp,
                `Bonjour ${vendeur.nom}, je suis intéressé par « ${produit.titre} »`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center rounded-md border border-primary/40 px-3 text-xs font-semibold text-primary hover:bg-primary-soft"
            >
              WhatsApp
            </a>
          )}
          <BoutonSignaler
            cibleType="produit"
            cibleId={produit.id}
            utilisateurId={produit.vendeur_id}
          />
        </div>
      </Carte>

      {!pi && <Carte className="text-sm font-semibold text-primary">{t("piBrowserRequis")}</Carte>}
      {monAnnonce && (
        <Carte className="text-sm font-semibold text-primary">{t("votreAnnonce")}</Carte>
      )}
      <BandeauPi />

      <Carte className="sticky bottom-20 space-y-2 lg:bottom-4">
        <div className="flex items-center gap-2">
          <label htmlFor="qte" className="text-sm font-semibold">
            Quantité ({produit.unite}) :
          </label>
          <Saisie
            id="qte"
            type="number"
            className="max-w-24"
            min={min}
            max={produit.stock}
            value={quantite}
            onChange={(e) => setQuantite(Math.floor(Number(e.target.value) || 0))}
          />
          <span className="ml-auto font-semibold text-primary">
            {formatPi(produit.prix * quantite)}
          </span>
        </div>
        {!qValide && !epuise && (
          <p className="text-xs text-destructive">
            Entre {min} et {produit.stock} {produit.unite}.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Bouton
            variante="contour"
            taille="sm"
            disabled={epuise || !qValide || monAnnonce}
            onClick={ajouterAuPanier}
          >
            {t("ajouterPanier")}
          </Bouton>
          <Bouton className="flex-1" disabled={epuise || !qValide || monAnnonce} onClick={acheter}>
            {t("acheterMaintenant")}
          </Bouton>
        </div>
      </Carte>
    </div>
  );
}
