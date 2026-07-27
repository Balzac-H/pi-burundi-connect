import { createFileRoute, Link } from "@tanstack/react-router";
import { Bouton, Carte, TitreSection, Etiquette, Note, Distance, Avatar, BoutonSuivre, LienBouton } from "@/components/ui-kit";
import { utilisateurs, jobs, produits, activiteRecente, parUtilisateur } from "@/lib/data";
import { store, useStore, formatPi } from "@/lib/store";
import { Heart, Eye, Share2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accueil — BURUNDI PI CONNECT" },
      {
        name: "description",
        content: "Fil d'actualité : nouvelles offres d'emploi, produits tendance et activité de vos suivis, payés en Pi.",
      },
      { property: "og:title", content: "Accueil — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Fil d'actualité : nouvelles offres d'emploi, produits tendance et activité de vos suivis, payés en Pi." },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const favoris = useStore((s) => s.favoris);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl gradient-primary p-5 text-primary-foreground shadow-[var(--shadow-float)]">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Bienvenue sur Burundi Pi Connect</h1>
        <p className="mt-1 max-w-xl text-sm opacity-90">
          Trouvez un emploi, vendez vos produits et payez en Pi — partout au Burundi.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <LienBouton to="/jobs" variante="secondaire" taille="sm">Voir les emplois</LienBouton>
          <LienBouton to="/market" variante="contour" taille="sm">Explorer le marché</LienBouton>
          <LienBouton to="/portefeuille" variante="pi" taille="sm">Mon Wallet Pi</LienBouton>
        </div>
      </section>

      <section>
        <TitreSection>👥 Suggestions à suivre</TitreSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {utilisateurs
            .filter((u) => u.id !== "u-moi")
            .slice(0, 3)
            .map((u) => (
              <Carte key={u.id} className="flex items-center gap-3">
                <Avatar emoji={u.emoji} />
                <div className="min-w-0 flex-1">
                  <Link to="/profil/$id" params={{ id: u.id }} className="block truncate font-semibold">
                    {u.nom}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{u.metier}</p>
                  <Note note={u.note} />
                </div>
                <BoutonSuivre id={u.id} />
              </Carte>
            ))}
        </div>
      </section>

      <section>
        <TitreSection action={<Link to="/jobs" className="text-xs font-semibold text-accent">Tout voir</Link>}>
          💼 Nouvelles offres d'emploi
        </TitreSection>
        <div className="grid gap-3 lg:grid-cols-2">
          {jobs.slice(0, 2).map((j) => {
            const emp = parUtilisateur(j.employeurId);
            return (
              <Carte key={j.id} className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {emp.emoji} <span className="font-semibold text-foreground">{emp.nom}</span> a publié une nouvelle offre
                </p>
                <h3 className="font-bold">{j.titre}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <Etiquette ton="pi">{formatPi(j.salairePi)}</Etiquette>
                  {j.urgent && <Etiquette ton="urgent">⚡ Urgent</Etiquette>}
                  <Distance km={emp.distanceKm} />
                </div>
                <div className="flex gap-2">
                  <LienBouton to="/jobs/$id" params={{ id: j.id }} taille="sm">VOIR</LienBouton>
                  <Bouton taille="sm" variante="contour" onClick={() => toast.success("Lien de l'offre copié !")}>
                    <Share2 className="size-4" /> PARTAGER
                  </Bouton>
                </div>
              </Carte>
            );
          })}
        </div>
      </section>

      <section>
        <TitreSection action={<Link to="/market" className="text-xs font-semibold text-accent">Tout voir</Link>}>
          🔥 Produits tendance
        </TitreSection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {produits.slice(0, 3).map((p) => (
            <Carte key={p.id} className="space-y-2">
              <div className="grid h-28 place-items-center rounded-lg bg-primary-soft text-5xl">{p.emoji}</div>
              <h3 className="font-semibold leading-snug">{p.titre}</h3>
              <p className="text-sm font-bold text-primary">{formatPi(p.prix)}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <button
                  onClick={() => store.basculerFavori(p.id)}
                  className="inline-flex items-center gap-1"
                  aria-label="Ajouter aux favoris"
                >
                  <Heart className={favoris.includes(p.id) ? "size-4 fill-destructive text-destructive" : "size-4"} />
                  {p.favoris}
                </button>
                <span className="inline-flex items-center gap-1"><Eye className="size-4" /> {p.vues}</span>
              </div>
              <LienBouton to="/market/$id" params={{ id: p.id }} taille="sm" className="w-full">ACHETER</LienBouton>
            </Carte>
          ))}
        </div>
      </section>

      <section>
        <TitreSection>✨ Activité récente de vos suivis</TitreSection>
        <Carte className="space-y-3">
          {activiteRecente.map((a) => (
            <div key={a.texte} className="flex gap-3 border-b border-border/60 pb-3 last:border-0 last:pb-0">
              <span className="text-lg">{a.icone}</span>
              <div>
                <p className="text-sm font-semibold">{a.texte}</p>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
            </div>
          ))}
        </Carte>
      </section>
    </div>
  );
}
