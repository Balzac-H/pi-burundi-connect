import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, Bouton, Carte, Etiquette, LienBouton, TitreSection } from "@/components/ui-kit";
import { useSession, seDeconnecter } from "@/lib/auth";
import {
  chargerProfil,
  listerMesProduits,
  lienWhatsApp,
  numeroValide,
  normaliserNumero,
  type Profil,
  type ProduitDb,
} from "@/lib/comptes";
import { formatPi } from "@/lib/store";
import { toast } from "sonner";

import { BoutonTheme } from "@/components/Confiance";
import { useT } from "@/lib/i18n";
import { activerEspaceVendeur } from "@/lib/activite";

export const Route = createFileRoute("/profil/")({
  head: () => ({
    meta: [
      { title: "Mon profil — Arija" },
      {
        name: "description",
        content:
          "Gérez votre photo, vos informations, votre numéro WhatsApp et vos produits en vente sur Arija.",
      },
      { property: "og:title", content: "Mon profil — Arija" },
      {
        property: "og:description",
        content: "Votre compte, vos produits et vos contacts sur la plateforme.",
      },
    ],
  }),
  component: MonProfil,
});

function MonProfil() {
  const t = useT();
  const { utilisateur, chargement } = useSession();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [produits, setProduits] = useState<ProduitDb[]>([]);

  useEffect(() => {
    if (!utilisateur) return;
    chargerProfil(utilisateur.id).then(setProfil);
    listerMesProduits(utilisateur.id).then(setProduits);
  }, [utilisateur]);

  if (chargement)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  if (!utilisateur) {
    return (
      <Carte className="mx-auto max-w-md space-y-3 text-center">
        <h1 className="text-xl font-semibold text-primary">Mon profil</h1>
        <p className="text-sm text-muted-foreground">
          Créez votre compte pour ajouter votre photo, publier vos produits et être contacté sur
          WhatsApp.
        </p>
        <LienBouton to="/connexion">Se connecter</LienBouton>
      </Carte>
    );
  }

  return (
    <div className="space-y-5">
      <Carte className="space-y-4">
        <div className="flex gap-4">
          {profil?.photo_url ? (
            <img
              src={profil.photo_url}
              alt={`Photo de ${profil.nom}`}
              className="size-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <Avatar nom={profil?.nom} taille="lg" />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold sm:text-2xl">{profil?.nom || "Mon compte"}</h1>
            <p className="text-sm text-muted-foreground">{utilisateur.email}</p>
            {profil?.ville && <p className="mt-1 text-sm text-muted-foreground">{profil.ville}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(profil?.competences ?? []).map((c) => (
                <Etiquette key={c}>{c}</Etiquette>
              ))}
              {profil?.vendeur_actif && (
                <Etiquette ton="succes">{t("espaceVendeurActif")}</Etiquette>
              )}
            </div>
          </div>
        </div>
        {profil?.bio && <p className="text-sm italic text-muted-foreground">« {profil.bio} »</p>}
        {profil?.prix_horaire ? (
          <p className="text-sm font-semibold text-primary">
            Prix horaire : {formatPi(Number(profil.prix_horaire))} / h
          </p>
        ) : null}
        {[profil?.whatsapp, profil?.telephone]
          .filter((n): n is string => !!n && numeroValide(n))
          .filter(
            (n, i, liste) =>
              liste.findIndex((a) => normaliserNumero(a) === normaliserNumero(n)) === i,
          )
          .map((n) => (
            <a
              key={n}
              href={lienWhatsApp(n, "Bonjour")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-success underline underline-offset-2"
            >
              +{normaliserNumero(n)} — Discuter sur WhatsApp
            </a>
          ))}

        <div className="flex flex-wrap gap-2">
          <LienBouton to="/profil/modifier" taille="sm">
            Modifier
          </LienBouton>
          <LienBouton to="/portefeuille" variante="pi" taille="sm">
            Mon portefeuille
          </LienBouton>
          <LienBouton to="/activite" variante="secondaire" taille="sm">
            {t("monActivite")}
          </LienBouton>
          {profil?.vendeur_actif ? (
            <Etiquette ton="succes">{t("espaceVendeurActif")}</Etiquette>
          ) : (
            <Bouton
              variante="secondaire"
              taille="sm"
              onClick={async () => {
                try {
                  await activerEspaceVendeur(utilisateur.id);
                  setProfil((p) => (p ? { ...p, vendeur_actif: true } : p));
                  toast.success(t("espaceVendeurActive"));
                } catch (e) {
                  toast.error(
                    e instanceof Error && e.message.includes("Pi")
                      ? t("piRequisPourVendre")
                      : e instanceof Error
                        ? e.message
                        : "Action impossible.",
                  );
                }
              }}
            >
              {t("activerEspaceVendeur")}
            </Bouton>
          )}
          <BoutonTheme />
          <Bouton
            variante="contour"
            taille="sm"
            onClick={() =>
              navigator.clipboard?.writeText(window.location.href).then(
                () => toast.success("Lien du profil copié !"),
                () => toast("Copiez l'adresse depuis la barre d'URL."),
              )
            }
          >
            Partager
          </Bouton>
          <Bouton
            variante="danger"
            taille="sm"
            onClick={async () => {
              await seDeconnecter();
              toast.success("Vous êtes déconnecté.");
            }}
          >
            Se déconnecter
          </Bouton>
        </div>
      </Carte>

      <section>
        <TitreSection
          action={
            <LienBouton to="/market/vendre" taille="sm" variante="secondaire">
              + Ajouter
            </LienBouton>
          }
        >
          Mes produits ({produits.length})
        </TitreSection>
        {produits.length === 0 ? (
          <Carte className="text-sm text-muted-foreground">
            Vous n'avez pas encore publié de produit.
          </Carte>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {produits.map((p) => (
              <Carte key={p.id} className="space-y-2">
                {p.photo_url ? (
                  <img
                    src={p.photo_url}
                    alt={p.titre}
                    className="h-32 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="grid h-32 place-items-center rounded-md bg-primary-soft text-base text-muted-foreground">
                    Pas de photo
                  </div>
                )}
                <h3 className="font-semibold leading-snug">{p.titre}</h3>
                <p className="text-sm font-semibold text-primary">{formatPi(Number(p.prix))}</p>
              </Carte>
            ))}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <LienBouton to="/market/boutique" variante="contour" taille="sm">
            Ma boutique
          </LienBouton>
          <LienBouton to="/jobs/postulations" variante="contour" taille="sm">
            Mes postulations
          </LienBouton>
          <LienBouton to="/vendeurs" variante="contour" taille="sm">
            Rechercher des vendeurs
          </LienBouton>
        </div>
      </section>
    </div>
  );
}
