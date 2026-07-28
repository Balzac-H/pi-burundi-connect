import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, Carte, Etiquette, Saisie, TitreSection } from "@/components/ui-kit";
import { chercherProfils, lienWhatsApp, type Profil } from "@/lib/comptes";
import { formatPi } from "@/lib/store";
import { MessageCircle, Search } from "lucide-react";

export const Route = createFileRoute("/vendeurs")({
  head: () => ({
    meta: [
      { title: "Rechercher des vendeurs et prestataires au Burundi" },
      { name: "description", content: "Trouvez des vendeurs, artisans et prestataires près de chez vous : photo, compétences, ville et contact WhatsApp direct." },
      { property: "og:title", content: "Rechercher des vendeurs — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Annuaire des vendeurs et prestataires de la communauté Pi au Burundi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Vendeurs,
});

function Vendeurs() {
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
      <h1 className="text-2xl font-extrabold text-primary">VENDEURS & PRESTATAIRES 🔎</h1>

      <Carte className="flex items-center gap-2">
        <Search className="size-4 shrink-0 text-muted-foreground" />
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
        <Carte className="text-sm text-muted-foreground">Aucun vendeur trouvé pour cette recherche.</Carte>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((v) => (
          <Carte key={v.id} className="space-y-2">
            <div className="flex gap-3">
              {v.photo_url ? (
                <img src={v.photo_url} alt={`Photo de ${v.nom}`} className="size-12 shrink-0 rounded-full object-cover" />
              ) : (
                <Avatar emoji="🧑🏿" />
              )}
              <div className="min-w-0">
                <h2 className="truncate font-bold">{v.nom || "Utilisateur"}</h2>
                {v.ville && <p className="truncate text-xs text-muted-foreground">📍 {v.ville}</p>}
                {v.prix_horaire ? (
                  <p className="text-xs font-semibold text-primary">{formatPi(Number(v.prix_horaire))} / h</p>
                ) : null}
              </div>
            </div>
            {v.bio && <p className="line-clamp-2 text-xs text-muted-foreground">{v.bio}</p>}
            <div className="flex flex-wrap gap-1.5">
              {v.competences.slice(0, 4).map((c) => (
                <Etiquette key={c}>🏷️ {c}</Etiquette>
              ))}
            </div>
            {v.whatsapp && (
              <a
                href={lienWhatsApp(v.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-success/15 px-3 text-xs font-semibold text-success"
              >
                <MessageCircle className="size-4" /> WHATSAPP
              </a>
            )}
          </Carte>
        ))}
      </div>
    </div>
  );
}
