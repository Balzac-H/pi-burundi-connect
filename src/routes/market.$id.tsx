import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, Avatar, LienBouton, BandeauPi, Saisie } from "@/components/ui-kit";
import { supabase } from "@/integrations/supabase/client";
import { chargerProfil, lienWhatsApp, type ProduitDb, type Profil } from "@/lib/comptes";
import { store, useStore, formatPi } from "@/lib/store";
import { imageProduit } from "@/lib/produits-visuels";
import { acheterAvecPi } from "@/lib/achat";
import { piDisponible } from "@/lib/pi";
import { toast } from "sonner";
import { ArrowLeft, Heart } from "lucide-react";
import { BoutonSignaler } from "@/components/Confiance";

type Produit = ProduitDb & { quantite_min: number };

export const Route = createFileRoute("/market/$id")({
  head: () => ({
    meta: [
      { title: "Annonce — Market WICO" },
      { name: "description", content: "Détail d'une annonce du Market WICO, payable en Pi." },
      { property: "og:title", content: "Annonce — Market WICO" },
      { property: "og:description", content: "Achetez près de chez vous, payez en Pi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetailProduit,
});

function DetailProduit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [produit, setProduit] = useState<Produit | null | undefined>(undefined);
  const [vendeur, setVendeur] = useState<Profil | null>(null);
  const [quantite, setQuantite] = useState(1);
  const [enCours, setEnCours] = useState(false);
  const [confirme, setConfirme] = useState<string | null>(null);
  const [pi, setPi] = useState(true);
  const favori = useStore((s) => s.favoris.includes(id));

  useEffect(() => {
    setPi(piDisponible());
    supabase.from("produits").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      const p = (data as Produit | null) ?? null;
      setProduit(p);
      if (p) {
        setQuantite(Math.max(1, p.quantite_min ?? 1));
        chargerProfil(p.vendeur_id).then(setVendeur);
      }
    });
  }, [id]);

  if (produit === undefined) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  if (!produit) {
    return (
      <Carte className="text-center">
        <p className="font-semibold">Annonce introuvable.</p>
        <LienBouton to="/market" taille="sm" className="mt-3">Retour au marché</LienBouton>
      </Carte>
    );
  }

  const min = Math.max(1, produit.quantite_min ?? 1);
  const epuise = produit.stock < min;
  const qValide = quantite >= min && quantite <= produit.stock;

  async function acheter() {
    if (!produit || enCours) return;
    setEnCours(true);
    try {
      const r = await acheterAvecPi(produit, quantite);
      if (r.ok) setConfirme(r.orderId);
      else if (r.annule) toast(r.erreur);
      else toast.error(r.erreur);
    } catch (e) {
      toast.error((e as Error).message === "PI_ABSENT" ? "Ouvrez WICO dans le Pi Browser pour payer en Pi." : "Paiement impossible.");
    } finally {
      setEnCours(false);
    }
  }

  if (confirme) {
    return (
      <Carte className="mx-auto max-w-lg space-y-3 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="text-2xl font-extrabold text-primary">Paiement confirmé</h1>
        <p className="text-sm">{produit.titre} × {quantite} {produit.unite} — <strong>{formatPi(produit.prix * quantite)}</strong></p>
        <p className="text-sm text-muted-foreground">Les fonds sont retenus jusqu'à la confirmation de réception.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <LienBouton to="/portefeuille" taille="sm">Mes commandes</LienBouton>
          <LienBouton to="/market" variante="contour" taille="sm">Continuer</LienBouton>
        </div>
      </Carte>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate({ to: "/market" })} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <ArrowLeft className="size-4" /> Retour
        </button>
        <Bouton variante="contour" taille="sm" onClick={() => store.basculerFavori(produit.id)}>
          <Heart className={favori ? "size-4 fill-destructive text-destructive" : "size-4"} /> Favoris
        </Bouton>
      </div>

      <Carte className="space-y-3 p-0 pb-4">
        <img src={produit.photo_url || imageProduit(produit.id, produit.categorie)} alt={produit.titre} className="aspect-square max-h-[34rem] w-full rounded-t-lg bg-muted object-cover" />
        <h1 className="px-4 text-2xl font-extrabold text-foreground">{produit.titre}</h1>
        <p className="px-4 text-3xl font-extrabold text-primary">{formatPi(produit.prix)} <span className="text-sm font-normal text-muted-foreground">/ {produit.unite}</span></p>
        <div className="flex flex-wrap gap-2 px-4">
          <Etiquette ton={epuise ? "urgent" : "succes"}>{epuise ? "Épuisé" : `En stock : ${produit.stock} ${produit.unite}`}</Etiquette>
          {min > 1 && <Etiquette>Minimum : {min} {produit.unite}</Etiquette>}
          {produit.lieu && <Etiquette>📍 {produit.lieu}</Etiquette>}
          {produit.livraison && <Etiquette>🚚 {produit.livraison}</Etiquette>}
        </div>
        {produit.description && <p className="px-4 text-sm">{produit.description}</p>}
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground">Vendeur</h2>
        <div className="flex items-center gap-3">
          {vendeur?.photo_url ? <img src={vendeur.photo_url} alt="" className="size-12 rounded-full object-cover" /> : <Avatar emoji="👤" />}
          <Link to="/profil/$id" params={{ id: produit.vendeur_id }} className="font-semibold">{vendeur?.nom || "Membre"}</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {vendeur?.whatsapp ? (
            <a href={lienWhatsApp(vendeur.whatsapp, `Bonjour ${vendeur.nom}, je suis intéressé par « ${produit.titre} »`)} target="_blank" rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-success/15 px-3 text-xs font-semibold text-success">💬 WhatsApp</a>
          ) : <Etiquette>📵 Numéro non vérifié</Etiquette>}
          <BoutonSignaler cibleType="produit" cibleId={produit.id} utilisateurId={produit.vendeur_id} />
        </div>
      </Carte>

      {!pi && <Carte className="text-sm font-semibold text-accent">Ouvrez WICO dans le Pi Browser pour payer en Pi.</Carte>}
      <BandeauPi />

      <Carte className="sticky bottom-20 space-y-2 lg:bottom-4">
        <div className="flex items-center gap-2">
          <label htmlFor="qte" className="text-sm font-semibold">Quantité ({produit.unite}) :</label>
          <Saisie id="qte" type="number" className="max-w-24" min={min} max={produit.stock} value={quantite}
            onChange={(e) => setQuantite(Math.floor(Number(e.target.value) || 0))} />
          <span className="ml-auto font-bold text-primary">{formatPi(produit.prix * quantite)}</span>
        </div>
        {!qValide && !epuise && <p className="text-xs text-destructive">Entre {min} et {produit.stock} {produit.unite}.</p>}
        <div className="flex flex-wrap gap-2">
          <Bouton variante="contour" taille="sm" disabled={epuise || !qValide || !pi}
            onClick={() => { store.ajouterAuPanier(produit.id, quantite); toast.success("Ajouté au panier"); }}>
            Ajouter au panier
          </Bouton>
          <Bouton className="flex-1" disabled={epuise || !qValide || enCours || !pi} onClick={acheter}>
            {enCours ? "Paiement en cours…" : "Acheter maintenant"}
          </Bouton>
        </div>
      </Carte>
    </div>
  );
}
