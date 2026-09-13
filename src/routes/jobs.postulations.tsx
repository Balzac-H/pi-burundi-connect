import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Carte, Etiquette, LienBouton } from "@/components/ui-kit";
import { jobs, parJob, parUtilisateur } from "@/lib/data";
import { store, useStore } from "@/lib/store";
import { bientotDisponible } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/jobs/postulations")({
  head: () => ({
    meta: [
      { title: "Mes postulations — BURUNDI PI CONNECT" },
      { name: "description", content: "Suivez vos candidatures : en attente, acceptées, terminées, et laissez vos avis." },
      { property: "og:title", content: "Mes postulations — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Gérez toutes vos candidatures d'emploi en un endroit." },
    ],
  }),
  component: Postulations,
});

const terminees = [
  { titre: "Rénovation cuisine", montant: "3 000 Pi", employeur: "Robert P.", avis: "Excellent !" },
  { titre: "Peinture salon", montant: "1 200 Pi", employeur: "Jean M.", avis: "Très bon travail." },
];

const filtres = ["Toutes", "En attente", "Acceptées", "Terminées"] as const;

function Postulations() {
  const [filtre, setFiltre] = useState<(typeof filtres)[number]>("Toutes");
  const candidatures = useStore((s) => s.candidatures);
  const enAttente = candidatures.map(parJob).filter(Boolean);
  const acceptees = jobs.filter((j) => j.id === "j-nettoyage");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Mes postulations</h1>

      <div className="flex flex-wrap gap-2">
        {filtres.map((f) => (
          <Bouton key={f} taille="sm" variante={filtre === f ? "primaire" : "contour"} onClick={() => setFiltre(f)}>
            {f}
          </Bouton>
        ))}
      </div>

      {(filtre === "Toutes" || filtre === "En attente") && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">En attente ({enAttente.length})</h2>
          {enAttente.map((j) => {
            const emp = parUtilisateur(j!.employeurId);
            return (
              <Carte key={j!.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{j!.titre}</p>
                  <p className="text-xs text-muted-foreground">{j!.salaire} · {emp.nom} · ⏳ depuis 3 jours</p>
                </div>
                <Bouton
                  variante="danger"
                  taille="sm"
                  onClick={() => {
                    store.annulerCandidature(j!.id);
                    toast.success("Postulation annulée.");
                  }}
                >
                  ANNULER
                </Bouton>
              </Carte>
            );
          })}
          {enAttente.length === 0 && <Carte className="text-sm text-muted-foreground">Aucune candidature en attente.</Carte>}
        </section>
      )}

      {(filtre === "Toutes" || filtre === "Acceptées") && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Acceptées ({acceptees.length})</h2>
          {acceptees.map((j) => (
            <Carte key={j.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{j.titre}</p>
                <Etiquette ton="succes">✅ Commence demain</Etiquette>
              </div>
              <p className="text-xs text-muted-foreground">{j.salaire} · {parUtilisateur(j.employeurId).nom}</p>
              <div className="flex flex-wrap gap-2">
                <LienBouton to="/jobs/$id" params={{ id: j.id }} variante="contour" taille="sm">VOIR DÉTAIL</LienBouton>
                <LienBouton to="/messages" variante="secondaire" taille="sm">CHAT</LienBouton>
                <Bouton taille="sm" onClick={() => bientotDisponible("Le marquage comme commencé")}>MARQUER COMMENCÉ</Bouton>
              </div>
            </Carte>
          ))}
        </section>
      )}

      {(filtre === "Toutes" || filtre === "Terminées") && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold uppercase text-muted-foreground">Terminées ({terminees.length})</h2>
          {terminees.map((t) => (
            <Carte key={t.titre} className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{t.titre}</p>
                <Etiquette ton="succes">COMPLÉTÉE</Etiquette>
              </div>
              <p className="text-xs text-muted-foreground">{t.montant} · {t.employeur}</p>
              <p className="text-sm">⭐⭐⭐⭐⭐ <span className="italic text-muted-foreground">« {t.avis} »</span></p>
              <Bouton taille="sm" variante="contour" onClick={() => bientotDisponible("Laisser un avis")}>
                LAISSER UN AVIS
              </Bouton>
            </Carte>
          ))}
        </section>
      )}
    </div>
  );
}
