import { createFileRoute } from "@tanstack/react-router";
import { Bouton, Carte, Etiquette, Avatar, Note, LienBouton, TitreSection, BoutonSuivre } from "@/components/ui-kit";
import { produits, parUtilisateur } from "@/lib/data";
import { formatPi } from "@/lib/store";
import { toast } from "sonner";
import { Eye, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/market/boutique")({
  head: () => ({
    meta: [
      { title: "Ma boutique — BURUNDI PI CONNECT" },
      { name: "description", content: "Gérez vos annonces, suivez vos statistiques de ventes et vos revenus en Pi." },
      { property: "og:title", content: "Ma boutique — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Tableau de bord vendeur : annonces, revenus, followers." },
    ],
  }),
  component: Boutique,
});

function Boutique() {
  const v = parUtilisateur("u-marie");
  const mesProduits = produits.filter((p) => p.vendeurId === v.id);

  return (
    <div className="space-y-5">
      <Carte className="space-y-3">
        <div className="h-24 rounded-lg gradient-primary" />
        <div className="flex items-center gap-3">
          <Avatar emoji={v.emoji} taille="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold">{v.nom}</h1>
            <Note note={v.note} avis={v.avis} />
            <p className="text-xs text-muted-foreground">📍 {v.ville} · 👥 {v.followers.toLocaleString("fr-FR")} followers</p>
          </div>
        </div>
        <p className="text-sm italic text-muted-foreground">« {v.bio} »</p>
        <div className="flex flex-wrap gap-2">
          <BoutonSuivre id={v.id} />
          <Bouton variante="contour" taille="sm" onClick={() => toast.success("Lien de la boutique copié !")}>PARTAGER BOUTIQUE</Bouton>
          <LienBouton to="/profil/modifier" variante="fantome" taille="sm">Éditer profil</LienBouton>
        </div>
      </Carte>

      <section>
        <TitreSection>Statistiques</TitreSection>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Carte className="text-center"><p className="text-lg font-extrabold text-primary">{mesProduits.length}</p><p className="text-xs text-muted-foreground">📊 Annonces actives</p></Carte>
          <Carte className="text-center"><p className="text-lg font-extrabold text-primary">{formatPi(2345)}</p><p className="text-xs text-muted-foreground">💰 Revenus / mois</p></Carte>
          <Carte className="text-center"><p className="text-lg font-extrabold text-accent">{v.satisfaction} %</p><p className="text-xs text-muted-foreground">⭐ Satisfaction</p></Carte>
          <Carte className="text-center"><p className="text-lg font-extrabold text-secondary">12</p><p className="text-xs text-muted-foreground">💬 Messages non lus</p></Carte>
        </div>
      </section>

      <section>
        <TitreSection action={<LienBouton to="/market/vendre" taille="sm">CRÉER UNE ANNONCE</LienBouton>}>
          Mes annonces actives
        </TitreSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mesProduits.map((p) => (
            <Carte key={p.id} className="space-y-2">
              <div className="grid h-24 place-items-center rounded-lg bg-primary-soft text-5xl">{p.emoji}</div>
              <h3 className="font-semibold leading-snug">{p.titre}</h3>
              <div className="flex gap-2">
                <Etiquette ton="pi">{formatPi(p.prix)}</Etiquette>
                <Etiquette ton="succes">✅ {p.stock} en stock</Etiquette>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Eye className="size-4" /> {p.vues}</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="size-4" /> 8</span>
              </div>
              <div className="flex gap-2">
                <Bouton taille="sm" variante="contour" onClick={() => toast("Édition de l'annonce.")}>ÉDITER</Bouton>
                <Bouton taille="sm" variante="fantome" onClick={() => toast.success("Annonce archivée.")}>ARCHIVER</Bouton>
              </div>
            </Carte>
          ))}
        </div>
      </section>
    </div>
  );
}
