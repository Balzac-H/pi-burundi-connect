import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, Bouton, Carte, Etiquette, LienBouton, TitreSection } from "@/components/ui-kit";
import { useSession, seDeconnecter } from "@/lib/auth";
import { chargerProfil, listerProduits, lienWhatsApp, numeroValide, normaliserNumero, type Profil, type ProduitDb } from "@/lib/comptes";
import { formatPi } from "@/lib/store";
import { toast } from "sonner";
import { LogOut, Pencil, Share2, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/profil/")({
  head: () => ({
    meta: [
      { title: "Mon profil — BURUNDI PI CONNECT" },
      { name: "description", content: "Gérez votre photo, vos informations, votre numéro WhatsApp et vos produits en vente sur Burundi Pi Connect." },
      { property: "og:title", content: "Mon profil — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Votre compte, vos produits et vos contacts sur la plateforme." },
    ],
  }),
  component: MonProfil,
});

function MonProfil() {
  const { utilisateur, chargement } = useSession();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [produits, setProduits] = useState<ProduitDb[]>([]);

  useEffect(() => {
    if (!utilisateur) return;
    chargerProfil(utilisateur.id).then(setProfil);
    listerProduits(utilisateur.id).then(setProduits);
  }, [utilisateur]);

  if (chargement) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-extrabold text-primary">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          Créez votre compte pour ajouter votre photo, publier vos produits et être contacté sur WhatsApp.
        </p>
        <LienBouton to="/connexion">SE CONNECTER / S'INSCRIRE</LienBouton>
      </Carte>
    );
  }

  return (
    <div className="space-y-5">
      <Carte className="space-y-4">
        <div className="flex gap-4">
          {profil?.photo_url ? (
            <img src={profil.photo_url} alt={`Photo de ${profil.nom}`} className="size-20 shrink-0 rounded-full object-cover" />
          ) : (
            <Avatar emoji="🧑🏿" taille="lg" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold sm:text-2xl">{profil?.nom || "Mon compte"}</h1>
            <p className="text-sm text-muted-foreground">{utilisateur.email}</p>
            {profil?.ville && <p className="mt-1 text-sm text-muted-foreground">📍 {profil.ville}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(profil?.competences ?? []).map((c) => (
                <Etiquette key={c}>🏷️ {c}</Etiquette>
              ))}
            </div>
          </div>
        </div>
        {profil?.bio && <p className="text-sm italic text-muted-foreground">« {profil.bio} »</p>}
        {profil?.prix_horaire ? (
          <p className="text-sm font-semibold text-primary">Prix horaire : {formatPi(Number(profil.prix_horaire))} / h</p>
        ) : null}
        {[profil?.whatsapp, profil?.telephone]
          .filter((n): n is string => !!n && numeroValide(n))
          .filter((n, i, liste) => liste.findIndex((a) => normaliserNumero(a) === normaliserNumero(n)) === i)
          .map((n) => (
            <a
              key={n}
              href={lienWhatsApp(n, "Bonjour 👋")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-success underline underline-offset-2"
            >
              <MessageCircle className="size-4" /> +{normaliserNumero(n)} — Discuter sur WhatsApp
            </a>
          ))}


        <div className="flex flex-wrap gap-2">
          <LienBouton to="/profil/modifier" taille="sm"><Pencil className="size-4" /> MODIFIER</LienBouton>
          <LienBouton to="/portefeuille" variante="pi" taille="sm">π MON WALLET</LienBouton>
          <Bouton variante="contour" taille="sm" onClick={() => toast.success("Lien du profil copié !")}>
            <Share2 className="size-4" /> PARTAGER
          </Bouton>
          <Bouton
            variante="danger"
            taille="sm"
            onClick={async () => {
              await seDeconnecter();
              toast.success("Vous êtes déconnecté.");
            }}
          >
            <LogOut className="size-4" /> SE DÉCONNECTER
          </Bouton>
        </div>
      </Carte>

      <section>
        <TitreSection action={<LienBouton to="/market/vendre" taille="sm" variante="secondaire">+ Ajouter</LienBouton>}>
          Mes produits ({produits.length})
        </TitreSection>
        {produits.length === 0 ? (
          <Carte className="text-sm text-muted-foreground">Vous n'avez pas encore publié de produit.</Carte>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {produits.map((p) => (
              <Carte key={p.id} className="space-y-2">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.titre} className="h-32 w-full rounded-lg object-cover" />
                ) : (
                  <div className="grid h-32 place-items-center rounded-lg bg-primary-soft text-5xl">🛍️</div>
                )}
                <h3 className="font-bold leading-snug">{p.titre}</h3>
                <p className="text-sm font-extrabold text-primary">{formatPi(Number(p.prix))}</p>
              </Carte>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <LienBouton to="/market/boutique" variante="contour" taille="sm">Ma boutique</LienBouton>
          <LienBouton to="/jobs/postulations" variante="contour" taille="sm">Mes postulations</LienBouton>
          <LienBouton to="/vendeurs" variante="contour" taille="sm">Rechercher des vendeurs</LienBouton>
        </div>
      </section>
    </div>
  );
}
