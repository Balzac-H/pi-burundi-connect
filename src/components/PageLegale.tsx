import { useState, type ReactNode } from "react";
import { Carte } from "@/components/ui-kit";

type Langue = "fr" | "rn" | "sw" | "en";
const noms: Record<Langue, string> = { fr: "Français", rn: "Kirundi", sw: "Kiswahili", en: "English" };
const avertissements: Record<Langue, string> = {
  fr: "Projet de texte — à faire valider par un juriste avant publication définitive.",
  rn: "Iyi nyandiko iracari umushinga — itegerezwa kwemezwa n'umuhanga mu mategeko.",
  sw: "Rasimu — inapaswa kuthibitishwa na mwanasheria kabla ya kuchapishwa.",
  en: "Draft text — to be reviewed by a lawyer before final publication.",
};

export function PageLegale({ titre, contenu }: { titre: string; contenu: Record<Langue, ReactNode> }) {
  const [l, setL] = useState<Langue>("fr");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">{titre}</h1>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(noms) as Langue[]).map((k) => (
          <button key={k} onClick={() => setL(k)} className={`rounded-lg px-3 py-1 text-xs font-semibold ${l === k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{noms[k]}</button>
        ))}
      </div>
      <Carte className="text-sm font-semibold text-accent">⚠️ {avertissements[l]}</Carte>
      <Carte className="space-y-3 text-sm leading-6 [&_h2]:mt-2 [&_h2]:font-bold">{contenu[l]}</Carte>
    </div>
  );
}
