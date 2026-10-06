import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, LienBouton, Avatar } from "@/components/ui-kit";
import { chargerProfilCache, listerProduits, type ProduitDb, type Profil } from "@/lib/comptes";
import { chargerSuivis } from "@/lib/social";
import { store, useStore, formatPi } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favoris")({
  head: () => ({
    meta: [
      { title: "Mes favoris — WICO" },
      {
        name: "description",
        content: "Retrouvez les produits sauvegardés et les vendeurs que vous suivez sur WICO.",
      },
      { property: "og:title", content: "Mes favoris — WICO" },
      { property: "og:description", content: "Produits sauvegardés et profils suivis." },
    ],
  }),
  component: Favoris,
});

function Favoris() {
  const t = useT();
  const favoris = useStore((s) => s.favoris);
  const [annonces, setAnnonces] = useState<ProduitDb[]>([]);
  const [profils, setProfils] = useState<Profil[]>([]);

  useEffect(() => {
    let vivant = true;
    listerProduits()
      .then((p) => {
        if (vivant) setAnnonces(p.filter((x) => favoris.includes(x.id)));
      })
      .catch(() => undefined);
    supabase.auth.getUser().then(({ data }) => {
      const moi = data.user?.id;
      if (!moi || !vivant) return;
      chargerSuivis(moi)
        .then(async (ids) => {
          const p = await Promise.all(ids.map((id) => chargerProfilCache(id)));
          if (vivant) setProfils(p.filter((x): x is Profil => !!x));
        })
        .catch(() => undefined);
    });
    return () => {
      vivant = false;
    };
  }, [favoris]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold text-primary">❤️ {t("favoris")}</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">
          {t("produitsSauvegardes")} ({annonces.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {annonces.map((p) => (
            <Carte key={p.id} className="space-y-2">
              {p.photo_url ? (
                <img
                  src={p.photo_url}
                  alt={p.titre}
                  loading="lazy"
                  className="h-24 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="grid h-24 place-items-center rounded-lg bg-primary-soft text-5xl">
                  🛍️
                </div>
              )}
              <h3 className="font-semibold leading-snug">{p.titre}</h3>
              <Etiquette ton="pi">{formatPi(Number(p.prix))}</Etiquette>
              <div className="flex gap-2">
                <LienBouton to="/market/$id" params={{ id: p.id }} taille="sm" className="flex-1">
                  VOIR
                </LienBouton>
                <Bouton variante="contour" taille="sm" onClick={() => store.basculerFavori(p.id)}>
                  <Heart className="size-4 fill-destructive text-destructive" />
                </Bouton>
              </div>
            </Carte>
          ))}
          {annonces.length === 0 && (
            <Carte className="text-sm text-muted-foreground">{t("aucunFavori")}</Carte>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold uppercase text-muted-foreground">
          {t("profilsSuivis")} ({profils.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {profils.map((u) => (
            <Carte key={u.id} className="flex items-center gap-3">
              <Avatar emoji={u.photo_url ?? "👤"} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{u.nom}</p>
                <p className="truncate text-xs text-muted-foreground">{u.ville ?? u.bio ?? "—"}</p>
              </div>
              <LienBouton to="/profil/$id" params={{ id: u.id }} variante="contour" taille="sm">
                PROFIL
              </LienBouton>
            </Carte>
          ))}
          {profils.length === 0 && (
            <Carte className="text-sm text-muted-foreground">{t("aucunSuivi")}</Carte>
          )}
        </div>
      </section>
    </div>
  );
}
