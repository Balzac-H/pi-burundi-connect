import { Link } from "@tanstack/react-router";
import { Avatar, Bouton, Carte, Etiquette, Note, TitreSection, BoutonSuivre, LienBouton } from "@/components/ui-kit";
import { parUtilisateur } from "@/lib/data";
import { bientotDisponible } from "@/lib/utils";
import { Share2, Flag, MessageCircle, Pencil } from "lucide-react";
import { formatPi } from "@/lib/store";

const historique = [
  { titre: "Rénovation cuisine", detail: "Job complété · 3 000 Pi", note: 5, avis: "Excellent travail !" },
  { titre: "Installation électrique", detail: "Job complété · 1 200 Pi", note: 5, avis: "Rapide et propre." },
  { titre: "Vente : lot de planches", detail: "Market · 900 Pi", note: 4, avis: "Bon produit, livraison correcte." },
];

export function ProfilComplet({ id, monProfil }: { id: string; monProfil?: boolean }) {
  const u = parUtilisateur(id);

  return (
    <div className="space-y-5">
      <Carte className="space-y-4">
        <div className="flex gap-4">
          <Avatar emoji={u.emoji} taille="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold sm:text-2xl">{u.nom}</h1>
            <Note note={u.note} avis={u.avis} />
            <p className="mt-1 text-sm text-muted-foreground">📍 {u.ville}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {u.competences.map((c) => (
                <Etiquette key={c}>🏷️ {c}</Etiquette>
              ))}
            </div>
          </div>
        </div>
        <p className="text-sm italic text-muted-foreground">« {u.bio} »</p>
        {u.prixHoraire && (
          <p className="text-sm font-semibold text-primary">Prix horaire : {formatPi(u.prixHoraire)} / h</p>
        )}

        <div className="flex flex-wrap gap-2">
          {monProfil ? (
            <>
              <LienBouton to="/profil/modifier" taille="sm"><Pencil className="size-4" /> MODIFIER</LienBouton>
              <LienBouton to="/portefeuille" variante="pi" taille="sm">π MON WALLET</LienBouton>
            </>
          ) : (
            <>
              <BoutonSuivre id={u.id} taille="md" />
              <LienBouton to="/messages" variante="secondaire" taille="sm">
                <MessageCircle className="size-4" /> CONTACT
              </LienBouton>
            </>
          )}
          <Bouton variante="contour" taille="sm" onClick={() => bientotDisponible("Le partage de profil")}>
            <Share2 className="size-4" /> PARTAGER
          </Bouton>
          {!monProfil && (
            <Bouton variante="danger" taille="sm" onClick={() => bientotDisponible("Le signalement")}>
              <Flag className="size-4" /> SIGNALER
            </Bouton>
          )}
        </div>
      </Carte>

      <section>
        <TitreSection>Statistiques</TitreSection>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat icone="👥" valeur={u.followers.toLocaleString("fr-FR")} label="Followers" />
          <Stat icone="🔁" valeur={u.following.toString()} label="Following" />
          <Stat icone="💼" valeur={u.jobsCompletes.toString()} label="Jobs complétés" />
          <Stat icone="🛍️" valeur={u.ventes.toString()} label="Ventes Market" />
        </div>
        <Carte className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold">✅ Taux de satisfaction</span>
          <span className="text-lg font-extrabold text-accent">{u.satisfaction} %</span>
        </Carte>
      </section>

      <section>
        <TitreSection>Historique & avis</TitreSection>
        <div className="space-y-3">
          {historique.map((h) => (
            <Carte key={h.titre} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{h.titre}</h3>
                <Etiquette ton="succes">Complété</Etiquette>
              </div>
              <p className="text-xs text-muted-foreground">{h.detail}</p>
              <p className="text-sm">
                {"⭐".repeat(h.note)} <span className="italic text-muted-foreground">« {h.avis} »</span>
              </p>
            </Carte>
          ))}
        </div>
        {monProfil && (
          <div className="mt-3 flex flex-wrap gap-2">
            <LienBouton to="/jobs/postulations" variante="contour" taille="sm">Mes postulations</LienBouton>
            <LienBouton to="/market/boutique" variante="contour" taille="sm">Ma boutique</LienBouton>
            <Link to="/parametres" className="self-center text-xs font-semibold text-accent">Paramètres</Link>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icone, valeur, label }: { icone: string; valeur: string; label: string }) {
  return (
    <Carte className="text-center">
      <p className="text-lg">{icone}</p>
      <p className="text-lg font-extrabold text-primary">{valeur}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Carte>
  );
}
