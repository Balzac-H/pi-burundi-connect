import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Carte, BandeauPi, LienBouton } from "@/components/ui-kit";
import { parProduit, parUtilisateur } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { bientotDisponible } from "@/lib/utils";
import { toast } from "sonner";
import { BesoinCompte } from "@/components/BesoinCompte";

export const Route = createFileRoute("/paiement")({
  head: () => ({
    meta: [
      { title: "Confirmer l'achat — WICO" },
      { name: "description", content: "Récapitulatif de commande et paiement sécurisé en Pi via Pi Network." },
      { property: "og:title", content: "Confirmer l'achat — WICO" },
      { property: "og:description", content: "Paiement sécurisé en Pi, livraison au Burundi." },
    ],
  }),
  component: PaiementProtege,
});

const FRAIS_LIVRAISON = 0.02;

function Paiement() {
  const panier = useStore((s) => s.panier);
  const solde = useStore((s) => s.soldePi);
  const [reference, setReference] = useState<string | null>(null);

  const lignes = panier
    .map((l) => ({ produit: parProduit(l.produitId), quantite: l.quantite }))
    .filter((l) => l.produit);
  const sousTotal = lignes.reduce((s, l) => s + l.produit!.prix * l.quantite, 0);
  const total = sousTotal + (lignes.length ? FRAIS_LIVRAISON : 0);

  if (reference) {
    return (
      <Carte className="mx-auto max-w-lg space-y-3 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="text-2xl font-extrabold text-accent">Paiement réussi !</h1>
        <p className="text-sm">Montant : <strong>{formatPi(total)}</strong></p>
        <p className="text-sm text-muted-foreground">Référence : {reference}</p>
        <p className="text-sm text-muted-foreground">Transaction sur la blockchain Pi : confirmée ✅</p>
        <p className="text-sm font-semibold">Nouveau solde : {formatPi(solde)}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <LienBouton to="/market" taille="sm">CONTINUER LES ACHATS</LienBouton>
          <LienBouton to="/profil" variante="contour" taille="sm">VOIR MA COMMANDE</LienBouton>
          <LienBouton to="/messages" variante="secondaire" taille="sm">CHAT VENDEUR</LienBouton>
        </div>
      </Carte>
    );
  }

  if (lignes.length === 0) {
    return (
      <Carte className="mx-auto max-w-lg space-y-3 text-center">
        <p className="font-semibold">Votre panier est vide.</p>
        <LienBouton to="/market" taille="sm">Découvrir le marché</LienBouton>
      </Carte>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Confirmer l'achat</h1>

      <Carte className="space-y-2">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Récapitulatif</h2>
        {lignes.map((l) => (
          <div key={l.produit!.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{l.produit!.emoji} {l.produit!.titre} × {l.quantite}</span>
            <span className="font-semibold">{formatPi(l.produit!.prix * l.quantite)}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm">
          <span>Livraison</span>
          <span className="font-semibold">{formatPi(FRAIS_LIVRAISON)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-primary">
          <span>TOTAL</span>
          <span>{formatPi(total)}</span>
        </div>
      </Carte>

      <Carte className="space-y-1 text-sm">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Paiement</h2>
        <p>
          Solde du compte : <strong>{formatPi(solde)}</strong>{" "}
          {solde >= total ? <span className="text-accent">✅ Suffisant</span> : <span className="text-destructive">❌ Insuffisant</span>}
        </p>
        <p className="text-xs text-muted-foreground">Vendeur : {parUtilisateur(lignes[0].produit!.vendeurId).nom}</p>
      </Carte>

      <Carte className="space-y-2 text-sm">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Adresse de livraison</h2>
        <p>Quartier Rohero, Bujumbura, Burundi</p>
        <Bouton variante="contour" taille="sm" onClick={() => bientotDisponible("La modification d'adresse")}>MODIFIER</Bouton>
      </Carte>

      <BandeauPi />

      <div className="flex gap-2">
        <Bouton
          className="flex-1"
          disabled={solde < total}
          onClick={() => {
            store.debiter(total);
            store.viderPanier();
            setReference("#BPC" + Date.now().toString().slice(-11));
            toast.success("Paiement confirmé sur la blockchain Pi !");
          }}
        >
          CONFIRMER LE PAIEMENT
        </Bouton>
        <Bouton variante="contour" onClick={() => store.viderPanier()}>ANNULER</Bouton>
      </div>
    </div>
  );
}

function PaiementProtege() {
  return (
    <BesoinCompte titre="Paiement en Pi">
      <Paiement />
    </BesoinCompte>
  );
}
