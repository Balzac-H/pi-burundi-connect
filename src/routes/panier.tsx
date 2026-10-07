import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bouton, Carte, Etiquette, LienBouton, TitreSection, Avatar } from "@/components/ui-kit";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { store, useStore, formatPi7 } from "@/lib/store";
import { chargerProduitsParIds, construireEtatPanier, type LignePanier } from "@/lib/panier";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/auth";
import { lienConnexion } from "@/lib/retour";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Panier — Market WICO" },
      {
        name: "description",
        content: "Votre panier WICO, réglé vendeur par vendeur, un paiement Pi par vendeur.",
      },
      { property: "og:title", content: "Panier — WICO" },
    ],
  }),
  component: PanierPage,
});

function PanierPage() {
  const t = useT();
  const navigate = useNavigate();
  const router = useRouter();
  const { utilisateur, chargement } = useSession();
  const panier = useStore((s) => s.panier);

  const [produits, setProduits] = useState<Awaited<ReturnType<typeof chargerProduitsParIds>>>([]);
  const [vendeurs, setVendeurs] = useState<Record<string, Profil>>({});
  const [moi, setMoi] = useState<Profil | null>(null);
  const [chargementProduits, setChargementProduits] = useState(true);

  const ids = useMemo(() => panier.map((l) => l.produitId), [panier]);

  useEffect(() => {
    let vivant = true;
    setChargementProduits(true);
    chargerProduitsParIds(ids)
      .then((p) => {
        if (vivant) setProduits(p);
      })
      .catch(() => undefined)
      .finally(() => {
        if (vivant) setChargementProduits(false);
      });
    return () => {
      vivant = false;
    };
  }, [ids]);

  useEffect(() => {
    if (!utilisateur?.id) return;
    chargerProfilCache(utilisateur.id)
      .then((p) => setMoi(p))
      .catch(() => undefined);
  }, [utilisateur?.id]);

  const moiId = utilisateur?.id ?? null;
  const etat = useMemo(
    () => construireEtatPanier(panier, produits, moiId),
    [panier, produits, moiId],
  );

  // Les annonces de l'utilisateur lui-même sortent du panier automatiquement.
  useEffect(() => {
    if (!moiId || !etat.aRetirer.length) return;
    store.retirerPlusieursDuPanier(etat.aRetirer);
  }, [moiId, etat.aRetirer]);

  // Noms des vendeurs regroupés.
  useEffect(() => {
    const idsVendeurs = etat.lignes
      .map((l) => l.produit?.vendeur_id)
      .filter((x): x is string => !!x && !(x in vendeurs));
    if (!idsVendeurs.length) return;
    let vivant = true;
    Promise.all([...new Set(idsVendeurs)].map((id) => chargerProfilCache(id)))
      .then((liste) => {
        if (!vivant) return;
        setVendeurs((prec) => {
          const suivant = { ...prec };
          for (const p of liste) if (p) suivant[p.id] = p;
          return suivant;
        });
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [etat.lignes, vendeurs]);

  const connectePi = !!utilisateur && !!moi?.pi_uid;

  function commander() {
    if (!etat.groupes.length) return;
    if (!connectePi) {
      router.history.push(lienConnexion("/panier"));
      return;
    }
    navigate({ to: "/paiement" });
  }

  function messageLigne(l: LignePanier) {
    if (l.etat === "propre") return t("votreAnnonce");
    if (l.etat === "retire") return t("annonceRetiree");
    if (l.etat === "stock") return t("stockInsuffisant");
    return t("articleIndisponible");
  }

  const indisponibles = etat.lignes.filter((l) => l.etat !== "ok");
  const vide = !panier.length;

  if (chargement) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold text-primary">🛒 {t("panier")}</h1>

      {vide && (
        <Carte className="space-y-3 text-center">
          <p className="text-sm text-muted-foreground">{t("panierVide")}</p>
          <div>
            <LienBouton to="/market" taille="sm">
              {t("voirTout")}
            </LienBouton>
          </div>
        </Carte>
      )}

      {!vide && chargementProduits && (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>
      )}

      {!vide && !chargementProduits && (
        <>
          {etat.groupes.map((groupe) => {
            const vendeur = vendeurs[groupe.vendeurId];
            return (
              <Carte key={groupe.vendeurId} className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar emoji={vendeur?.photo_url ?? "🏪"} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{vendeur?.nom ?? t("vendeur")}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {groupe.nbLignes} {t("lignes")}
                    </p>
                  </div>
                  <Etiquette ton="pi">{formatPi7(groupe.sousTotal)}</Etiquette>
                </div>

                <ul className="space-y-3">
                  {groupe.lignes.map((l) => (
                    <li key={l.produitId} className="flex gap-3">
                      <LinkImage photo={l.photo} titre={l.titre} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-semibold">{l.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatPi7(l.prixUnitaire)} / {l.unite}
                        </p>
                        <div className="flex items-center gap-2">
                          <Bouton
                            variante="contour"
                            taille="sm"
                            aria-label="-"
                            onClick={() =>
                              store.definirQuantite(l.produitId, Math.max(1, l.quantite - 1))
                            }
                          >
                            <Minus className="size-3" />
                          </Bouton>
                          <span className="w-6 text-center text-sm font-bold">{l.quantite}</span>
                          <Bouton
                            variante="contour"
                            taille="sm"
                            aria-label="+"
                            disabled={!!l.produit && l.quantite >= l.produit.stock}
                            onClick={() => store.definirQuantite(l.produitId, l.quantite + 1)}
                          >
                            <Plus className="size-3" />
                          </Bouton>
                          <Bouton
                            variante="danger"
                            taille="sm"
                            aria-label={t("retirerArticle")}
                            onClick={() => store.retirerDuPanier(l.produitId)}
                          >
                            <Trash2 className="size-3" />
                          </Bouton>
                        </div>
                      </div>
                      <p className="shrink-0 text-sm font-bold text-primary">
                        {formatPi7(l.sousTotal)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="text-muted-foreground">{t("sousTotal")}</span>
                  <span className="font-bold">{formatPi7(groupe.sousTotal)}</span>
                </div>
              </Carte>
            );
          })}

          {indisponibles.length > 0 && (
            <section className="space-y-2">
              <TitreSection>{t("articleIndisponible")}</TitreSection>
              <ul className="space-y-2">
                {indisponibles.map((l) => (
                  <li key={l.produitId}>
                    <Carte className="flex items-center gap-3">
                      <LinkImage photo={l.photo} titre={l.titre} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{l.titre}</p>
                        <p className="text-xs font-semibold text-accent">{messageLigne(l)}</p>
                      </div>
                      <Bouton
                        variante="contour"
                        taille="sm"
                        onClick={() => store.retirerDuPanier(l.produitId)}
                      >
                        {t("retirerArticle")}
                      </Bouton>
                    </Carte>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Carte className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("total")}</span>
              <span className="text-xl font-extrabold text-primary">{formatPi7(etat.total)}</span>
            </div>
            {etat.groupes.length > 1 && (
              <p className="text-xs text-muted-foreground">
                {t("nbPaiements").replace("{n}", String(etat.groupes.length))}
              </p>
            )}
            <Bouton className="w-full" disabled={!etat.groupes.length} onClick={commander}>
              {t("passerCommande")}
            </Bouton>
            <p className="text-center text-xs text-muted-foreground">
              {connectePi ? "" : t("connexionPiRequise")}
            </p>
          </Carte>
        </>
      )}
    </div>
  );
}

function LinkImage({ photo, titre }: { photo: string | null; titre: string }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={titre}
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-primary-soft text-2xl">
      🛍️
    </div>
  );
}
