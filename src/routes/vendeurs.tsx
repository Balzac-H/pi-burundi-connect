import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, Carte, LienBouton, Saisie, TitreSection } from "@/components/ui-kit";
import { chercherProfils, lienWhatsApp, type Profil } from "@/lib/comptes";
import { nomTypeCompte } from "@/lib/annonces";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/vendeurs")({
  head: () => ({
    meta: [
      { title: "Rechercher des vendeurs et prestataires au Burundi" },
      {
        name: "description",
        content:
          "Trouvez des vendeurs, artisans et prestataires près de chez vous : photo, ville et messagerie intégrée.",
      },
      { property: "og:title", content: "Rechercher des vendeurs — Arija" },
      {
        property: "og:description",
        content: "Annuaire des vendeurs et prestataires de la communauté Pi au Burundi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Vendeurs,
});

function Vendeurs() {
  const t = useT();
  const [recherche, setRecherche] = useState("");
  const [liste, setListe] = useState<Profil[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let annule = false;
    setChargement(true);
    const t = setTimeout(() => {
      chercherProfils(recherche).then((r) => {
        if (!annule) {
          setListe(r);
          setChargement(false);
        }
      });
    }, 250);
    return () => {
      annule = true;
      clearTimeout(t);
    };
  }, [recherche]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Vendeurs & prestataires</h1>

      <Carte className="flex items-center gap-2">
        <Saisie
          placeholder="Rechercher par nom, ville ou activité…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          maxLength={80}
          className="border-0 focus:ring-0"
        />
      </Carte>

      <TitreSection>{chargement ? "Recherche…" : `${liste.length} résultat(s)`}</TitreSection>

      {!chargement && liste.length === 0 && (
        <Carte className="text-sm text-muted-foreground">
          Aucun vendeur trouvé pour cette recherche.
        </Carte>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((v) => (
          <Carte key={v.id} className="space-y-2">
            <div className="flex gap-3">
              {v.photo_url ? (
                <img
                  src={v.photo_url}
                  alt={`Photo de ${v.nom}`}
                  className="size-12 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Avatar nom={v.nom} />
              )}
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{v.nom || "Utilisateur"}</h2>
                <p className="truncate text-xs text-muted-foreground">
                  {nomTypeCompte(v.type_compte)}
                </p>
                {v.ville && <p className="truncate text-xs text-muted-foreground">{v.ville}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LienBouton to="/messages/$id" params={{ id: v.id }} taille="sm">
                {t("chat")}
              </LienBouton>
              {(v.whatsapp || v.telephone) && (
                <a
                  href={lienWhatsApp((v.whatsapp || v.telephone) as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-md border border-primary/40 px-3 text-xs font-semibold text-primary hover:bg-primary-soft"
                >
                  {t("contactWhatsapp")}
                </a>
              )}
            </div>
          </Carte>
        ))}
      </div>
    </div>
  );
}
