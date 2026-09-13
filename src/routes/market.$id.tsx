import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Carte, Etiquette, Avatar, Note, BoutonSuivre, LienBouton, BandeauPi, Selection } from "@/components/ui-kit";
import { parProduit, parUtilisateur, avisProduit } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { lienWhatsApp } from "@/lib/comptes";
import { bientotDisponible } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Heart, Share2, Flag } from "lucide-react";

export const Route = createFileRoute("/market/$id")({
  head: ({ params }) => {
    const p = parProduit(params.id);
    return {
      meta: [
        { title: p ? `${p.titre} — ${p.prix} π` : "Produit introuvable" },
        { name: "description", content: p ? p.description.slice(0, 155) : "Ce produit n'est plus disponible." },
        { property: "og:title", content: p ? `${p.titre} — BURUNDI PI CONNECT` : "Produit introuvable" },
        { property: "og:description", content: p ? `${p.prix} π · ${p.lieu}` : "Produit indisponible." },
      ],
    };
  },
  component: DetailProduit,
});

function DetailProduit() {
  const { id } = Route.useParams();
  const produit = parProduit(id);
  const navigate = useNavigate();
  const [quantite, setQuantite] = useState(1);
  const favori = useStore((s) => s.favoris.includes(id));

  if (!produit) {
    return (
      <Carte className="text-center">
        <p className="font-semibold">Produit introuvable.</p>
        <LienBouton to="/market" taille="sm" className="mt-3">Retour au marché</LienBouton>
      </Carte>
    );
  }

  const v = parUtilisateur(produit.vendeurId);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate({ to: "/market" })} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground">
          <ArrowLeft className="size-4" /> RETOUR
        </button>
        <div className="flex gap-2">
          <Bouton variante="contour" taille="sm" onClick={() => store.basculerFavori(produit.id)}>
            <Heart className={favori ? "size-4 fill-destructive text-destructive" : "size-4"} /> Favoris
          </Bouton>
          <Bouton variante="contour" taille="sm" onClick={() => bientotDisponible("Le partage de produit")}>
            <Share2 className="size-4" /> Partager
          </Bouton>
        </div>
      </div>

      <Carte className="space-y-3">
        <div className="grid h-56 place-items-center rounded-lg bg-primary-soft text-8xl">{produit.emoji}</div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid size-16 place-items-center rounded-lg bg-muted text-2xl">{produit.emoji}</div>
          ))}
        </div>

        <h1 className="text-2xl font-extrabold text-primary">{produit.titre}</h1>
        <p className="text-xl font-bold">{formatPi(produit.prix)} <span className="text-sm font-normal text-muted-foreground">/ {produit.unite}</span></p>
        <Note note={produit.note} avis={produit.avis} />
        <div className="flex flex-wrap gap-2">
          <Etiquette ton="succes">✅ En stock : {produit.stock}</Etiquette>
          <Etiquette>📍 {produit.lieu}</Etiquette>
          <Etiquette>🚚 {produit.livraison}</Etiquette>
          <Etiquette>📅 {produit.disponible}</Etiquette>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Description</h2>
          <p className="mt-1 text-sm">{produit.description}</p>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Vendeur</h2>
        <div className="flex items-center gap-3">
          <Avatar emoji={v.emoji} />
          <div className="min-w-0 flex-1">
            <Link to="/profil/$id" params={{ id: v.id }} className="font-semibold">{v.nom}</Link>
            <p className="text-xs italic text-muted-foreground">« {v.bio} »</p>
            <p className="text-xs text-muted-foreground">
              👥 {v.followers.toLocaleString("fr-FR")} followers · Membre depuis {v.membreDepuis} · {v.satisfaction} % satisfaction
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <LienBouton to="/profil/$id" params={{ id: v.id }} variante="contour" taille="sm">PROFIL VENDEUR</LienBouton>
          <BoutonSuivre id={v.id} />
          <LienBouton to="/messages" variante="secondaire" taille="sm">CHAT DIRECT</LienBouton>
          <a
            href={lienWhatsApp(v.whatsapp, `Bonjour ${v.nom}, je suis intéressé par « ${produit.titre} » (${formatPi(produit.prix)})`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-success/15 px-3 text-xs font-semibold text-success transition hover:bg-success/25"
          >
            💬 CONTACT WHATSAPP
          </a>
        </div>
      </Carte>

      <Carte className="space-y-3">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">Avis clients</h2>
        {avisProduit.map((a) => (
          <div key={a.auteur} className="border-b border-border/60 pb-2 last:border-0 last:pb-0">
            <p className="text-sm">{"⭐".repeat(a.note)} <span className="italic">« {a.texte} »</span></p>
            <p className="text-xs text-muted-foreground">{a.auteur} · {a.date}</p>
          </div>
        ))}
        <Bouton variante="fantome" taille="sm" onClick={() => bientotDisponible("Tous les avis")}>
          VOIR TOUS LES AVIS ({produit.avis})
        </Bouton>
      </Carte>

      <BandeauPi />

      <Carte className="sticky bottom-20 space-y-2 lg:bottom-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Quantité :</span>
          <Selection className="max-w-28" value={quantite} onChange={(e) => setQuantite(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Selection>
          <span className="ml-auto font-bold text-primary">{formatPi(produit.prix * quantite)}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Bouton
            variante="contour"
            taille="sm"
            onClick={() => {
              store.ajouterAuPanier(produit.id, quantite);
              toast.success("Ajouté au panier");
            }}
          >
            AJOUTER AU PANIER
          </Bouton>
          <Bouton
            className="flex-1"
            onClick={() => {
              store.ajouterAuPanier(produit.id, quantite);
              navigate({ to: "/paiement" });
            }}
          >
            ACHETER MAINTENANT
          </Bouton>
          <Bouton variante="danger" taille="sm" onClick={() => bientotDisponible("Le signalement")}>
            <Flag className="size-4" /> SIGNALER
          </Bouton>
        </div>
      </Carte>
    </div>
  );
}
