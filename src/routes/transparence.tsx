import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Carte } from "@/components/ui-kit";
import { useLangue, type Langue } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/transparence")({
  head: () => ({
    meta: [
      { title: "Transparence — Arija" },
      {
        name: "description",
        content: "Commission, traitement des litiges et règles anti-fraude de la plateforme Arija.",
      },
      { property: "og:title", content: "Transparence — Arija" },
      { property: "og:description", content: "Engagements de transparence d'Arija." },
    ],
  }),
  component: Transparence,
});

const COMMISSION = "2 %";

type Contenu = {
  titre: string;
  introduction: string;
  commissionTitre: string;
  commission: string[];
  revenusTitre: string;
  revenus: string[];
  litigesTitre: string;
  litiges: string[];
  fraudeTitre: string;
  fraude: string[];
  statsTitre: string;
  statsCommandes: string;
  aucuneDonnee: string;
};

const contenus: Record<Langue, Contenu> = {
  fr: {
    titre: "Transparence",
    introduction:
      "Ce que Arija prélève, ce que Arija fait des revenus et comment les différends sont traités.",
    commissionTitre: "Taux de commission",
    commission: [
      `Arija prélève une commission de ${COMMISSION} sur chaque paiement libéré au vendeur.`,
      "Aucune autre commission n'est prélevée par la plateforme.",
      "Aucun montant n'est prélevé tant que les fonds sont retenus.",
    ],
    revenusTitre: "À quoi servent les revenus",
    revenus: [
      "Fonctionnement de la plateforme (hébergement, maintenance, sécurité).",
      "Médiation et traitement des litiges.",
      "Amélioration des services proposés aux membres.",
    ],
    litigesTitre: "Traitement des litiges",
    litiges: [
      "Un litige peut être ouvert par l'acheteur avant la libération des fonds.",
      "Un arbitre indépendant examine les éléments fournis par les deux parties.",
      "Si le litige est tranché en faveur de l'acheteur, celui-ci est remboursé et la commission n'est pas perçue.",
      "Les décisions sont consignées dans le journal d'audit de la plateforme.",
    ],
    fraudeTitre: "Règles anti-fraude",
    fraude: [
      "Les paiements passent obligatoirement par Pi Network ; aucun contournement n'est accepté.",
      "Les comptes liés à un conflit d'intérêt sont bloqués.",
      "Les validations sensibles peuvent exiger deux validateurs distincts.",
      "Toute annonce trompeuse peut être signalée et retirée.",
    ],
    statsTitre: "Statistiques",
    statsCommandes: "Commandes enregistrées",
    aucuneDonnee: "Pas encore de données",
  },
  rn: {
    titre: "Ukusobanura",
    introduction: "Ico Arija ifata, icyo Arija ikora n'amafaranga no uko amakorero atunganywa.",
    commissionTitre: "Urwego rw'umugabane",
    commission: [
      `Arija ifata umugabane wa ${COMMISSION} kuri buri wishyuro atangwa umutenguzi.`,
      "Uwundi mugabase ntawufatwa na urwanda.",
      "Ubwoba ntibufatwa igihe amafaranga akwirengwa.",
    ],
    revenusTitre: "Aya mafaranga akorwa iki",
    revenus: [
      "Gukora urwanda (ububikazi, ubusugira, umutekano).",
      "Gusambira no gukemura amakorero.",
      "Kongera ibidukikije abanyamuryango.",
    ],
    litigesTitre: "Ubwiyunge bw'amakorero",
    litiges: [
      "Umuguzi ashobora gufungura urujijo mbere yo gutangwa kw'amafaranga.",
      "Umutetabwenge w'ibirenge abiri areba ibyatumijwe na abiri.",
      "Niba urujijo ruhagarikira umuguzi, arishyurwa nta mugabane ufatabwa.",
      "Izaha zanditswe mu bubiko bw'ubusugira bw'urwanda.",
    ],
    fraudeTitre: "Amategeko y'ubukene bw'intumwa",
    fraude: [
      "Ibishyura biri mu buryo bwa Pi Network ; ntibwemera guhindurwa.",
      "Konti zifite ubwiyunge bw'ibikorwa zihagarikwa.",
      "Ibyemezo bihuye byashobora gukenera abayemeza babiri.",
      "Buri koko gishobora gucwa no gukurwamo.",
    ],
    statsTitre: "Imibare",
    statsCommandes: "Ibyatanzwe",
    aucuneDonnee: "Nta mparabanga ibera",
  },
  sw: {
    titre: "Uwazi",
    introduction:
      "Kile Arija kinachukua, jinsi fedha zinavyotumika na jinsi migogoro inavyoshughulikiwa.",
    commissionTitre: "Kiwango cha kamisheni",
    commission: [
      `Arija huchukua kamisheni ya ${COMMISSION} kwa kila malipo linaloachiliwa kwa muuzaji.`,
      "Hakuna kamisheni nyingine inayochukuliwa na jukwaa.",
      "Hakuna kiasi kinachochukuliwa wakati fedwa zimeshikiliwa.",
    ],
    revenusTitre: "Fedha zinatumikia nini",
    revenus: [
      "Kuendesha jukwaa (hosting, matengenezo, usalama).",
      "Upastishaji na ushughulikaji wa migogoro.",
      "Kuboresha huduma kwa wanachama.",
    ],
    litigesTitre: "Usimamizi wa migogoro",
    litiges: [
      "Mnunuzi anaweza kufungua mgogoro kabla ya kuachiliwa kwa fedha.",
      "Arbitrasi huru huchunguza taarifa zinazotolewa na pande zote mbili.",
      "Mgogoro ukiamuliwa upande wa mnunuzi, hurejeshwa pesa na kamisheni haichukuliwi.",
      "Maamuzi huingizwa kwenye daftari la ukaguzi la jukwaa.",
    ],
    fraudeTitre: "Sheria za kuzuia udanganyifu",
    fraude: [
      "Malipo hupitia Pi Network tu; hakuna upitishaji unaokubalika.",
      "Akaunti zenye mzozo wa maslahi hufungwa.",
      "Uamuzi muhimu unaweza kuhitaji wamuaji wawili tofauti.",
      "Kila tangazo la kudanganya linaweza kuripotiwa na kuondolewa.",
    ],
    statsTitre: "Takwimu",
    statsCommandes: "Amri zilizorekodiwa",
    aucuneDonnee: "Bado hakuna data",
  },
  en: {
    titre: "Transparency",
    introduction:
      "What Arija takes, what Arija does with the revenue and how disputes are handled.",
    commissionTitre: "Commission rate",
    commission: [
      `Arija takes a ${COMMISSION} commission on every payment released to the seller.`,
      "No other commission is taken by the platform.",
      "Nothing is taken while funds are held.",
    ],
    revenusTitre: "What the revenue is used for",
    revenus: [
      "Running the platform (hosting, maintenance, security).",
      "Mediation and dispute handling.",
      "Improving the services offered to members.",
    ],
    litigesTitre: "Dispute handling",
    litiges: [
      "A dispute can be opened by the buyer before funds are released.",
      "An independent arbitrator reviews the evidence from both parties.",
      "If the dispute is decided in the buyer's favour, the buyer is refunded and no commission is taken.",
      "Decisions are recorded in the platform's audit log.",
    ],
    fraudeTitre: "Anti-fraud rules",
    fraude: [
      "Payments must go through Pi Network; no bypassing is accepted.",
      "Accounts linked to a conflict of interest are blocked.",
      "Sensitive validations may require two separate validators.",
      "Any misleading listing can be reported and removed.",
    ],
    statsTitre: "Statistics",
    statsCommandes: "Recorded orders",
    aucuneDonnee: "No data yet",
  },
};

function Transparence() {
  const langue = useLangue();
  const c = contenus[langue];
  const [commandes, setCommandes] = useState<number | null>(null);

  useEffect(() => {
    let vivant = true;
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .then(
        ({ count }) => {
          if (vivant) setCommandes(count ?? 0);
        },
        () => {
          if (vivant) setCommandes(null);
        },
      );
    return () => {
      vivant = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{c.titre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.introduction}</p>
      </div>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.commissionTitre}</h2>
        <p className="text-3xl font-semibold text-primary">{COMMISSION}</p>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {c.commission.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Carte>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.revenusTitre}</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {c.revenus.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Carte>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.litigesTitre}</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {c.litiges.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Carte>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.fraudeTitre}</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          {c.fraude.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Carte>

      <Carte className="space-y-2 text-sm">
        <h2 className="section-label">{c.statsTitre}</h2>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-muted-foreground">{c.statsCommandes}</span>
          {commandes === null ? (
            <span className="text-muted-foreground">{c.aucuneDonnee}</span>
          ) : commandes === 0 ? (
            <span className="font-semibold text-muted-foreground">{c.aucuneDonnee}</span>
          ) : (
            <span className="text-2xl font-semibold text-primary">{commandes}</span>
          )}
        </div>
      </Carte>
    </div>
  );
}
