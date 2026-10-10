import { createFileRoute, Link } from "@tanstack/react-router";
import { Carte } from "@/components/ui-kit";
import { useLangue, useT, type Cle, type Langue } from "@/lib/i18n";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Arija Connect" },
      {
        name: "description",
        content:
          "Contacter le support Arija Connect, délai de réponse, aides en ligne et signalements.",
      },
      { property: "og:title", content: "Support — Arija Connect" },
      {
        property: "og:description",
        content: "Aide, contact et signalements de la plateforme Arija Connect.",
      },
    ],
  }),
  component: Support,
});

type Vers =
  "/messages" | "/transparence" | "/conditions" | "/confidentialite" | "/market" | "/jobs";

type Lien = { vers: Vers; cle: Cle };

type Contenu = {
  titre: string;
  introduction: string;
  contactTitre: string;
  emailLabel: string;
  emailAbsent: string;
  aideTitre: string;
  aide: { titre: string; texte: string; liens: Lien[] }[];
  signalementTexte: string;
  signalementLiens: Lien[];
};

const contenus: Record<Langue, Contenu> = {
  fr: {
    titre: "Support",
    introduction:
      "Une question sur une commande, un paiement ou votre compte ? Consultez les ressources ci-dessous ou contactez-nous.",
    contactTitre: "Nous contacter",
    emailLabel: "Email",
    emailAbsent:
      "Aucun email de support n'est publié pour le moment. Utilisez la messagerie interne pour nous écrire.",
    aideTitre: "Aide en ligne",
    aide: [
      {
        titre: "Messagerie",
        texte: "Échangez avec un vendeur ou un employeur avant un achat ou une candidature.",
        liens: [{ vers: "/messages", cle: "chat" }],
      },
      {
        titre: "Transparence",
        texte: "Commission, fonds retenus et litiges : les règles de paiement en Pi.",
        liens: [{ vers: "/transparence", cle: "transparence" }],
      },
      {
        titre: "Conditions et confidentialité",
        texte: "Les règles d'utilisation de la plateforme et la gestion de vos données.",
        liens: [
          { vers: "/conditions", cle: "conditions" },
          { vers: "/confidentialite", cle: "confidentialite" },
        ],
      },
    ],
    signalementTexte:
      "Ouvrez l'annonce, l'offre ou le profil concerné, puis choisissez « Signaler » : votre signalement est transmis à l'équipe Arija Connect.",
    signalementLiens: [
      { vers: "/market", cle: "market" },
      { vers: "/jobs", cle: "jobs" },
    ],
  },
  rn: {
    titre: "Ubufasha",
    introduction:
      "Ibibazo ku buyingi, ku bishyurwa cyangwa ku konti yawe? Reba ubufasha ngaho ushyira mu mise cyangwa utwandikire.",
    contactTitre: "Dutumire ubutumwa",
    emailLabel: "Imeyili",
    emailAbsent: "Nta meyili y'ufasha yanditswe ubu. Koresha ubutumwa bw'imbere utwandikire.",
    aideTitre: "Ubufasha ku murongo",
    aide: [
      {
        titre: "Ubutumwa",
        texte: "Igana na mutenguzi cyangwa umukozi mbere yo kugura cyangwa gutanga ubusabane.",
        liens: [{ vers: "/messages", cle: "chat" }],
      },
      {
        titre: "Ukusobanura",
        texte: "Umwanya, amafaranga akwirengwa n'amakorero : amategeko y'ibishyura na Pi.",
        liens: [{ vers: "/transparence", cle: "transparence" }],
      },
      {
        titre: "Amategeko n'ibanga ry'amakuru",
        texte: "Imigenzo yo gukoresha urwanda n'ugutunganya amakuru yawe.",
        liens: [
          { vers: "/conditions", cle: "conditions" },
          { vers: "/confidentialite", cle: "confidentialite" },
        ],
      },
    ],
    signalementTexte:
      "Fungura koko, akazi cyangwa urwanda rufite icyo cabi, hanyuma uhitemo « Menyesha » : ubutumwa bwoherejwa ikigo cya Arija Connect.",
    signalementLiens: [
      { vers: "/market", cle: "market" },
      { vers: "/jobs", cle: "jobs" },
    ],
  },
  sw: {
    titre: "Msaada",
    introduction:
      "Swali kuhusu amri, malipo au akaunti yako? Angalia huduma zilizo hapa chini au wasiliana nasi.",
    contactTitre: "Wasiliana nasi",
    emailLabel: "Barua pepe",
    emailAbsent:
      "Hakuna barua pepe ya msaada iliyochapishwa sasa hivi. Tumia ujumbe wa ndani kututumia ujumbe.",
    aideTitre: "Msaada mtandaoni",
    aide: [
      {
        titre: "Ujumbe",
        texte: "Ongea na muuzaji au mwajiri kabla ya kununua au kuomba kazi.",
        liens: [{ vers: "/messages", cle: "chat" }],
      },
      {
        titre: "Uwazi",
        texte: "Kamisheni, fedha zilizoshikiliwa na migogoro: sheria za malipo ya Pi.",
        liens: [{ vers: "/transparence", cle: "transparence" }],
      },
      {
        titre: "Masharti na faragha",
        texte: "Sheria za kutumia jukwaa na usimamizi wa taarifa zako.",
        liens: [
          { vers: "/conditions", cle: "conditions" },
          { vers: "/confidentialite", cle: "confidentialite" },
        ],
      },
    ],
    signalementTexte:
      "Fungua tangazo, nafasi au wasifu husika, kisha chagua « Ripoti »: ripoti yako humfikishia timu ya Arija Connect.",
    signalementLiens: [
      { vers: "/market", cle: "market" },
      { vers: "/jobs", cle: "jobs" },
    ],
  },
  en: {
    titre: "Support",
    introduction:
      "A question about an order, a payment or your account? Check the resources below or contact us.",
    contactTitre: "Contact us",
    emailLabel: "Email",
    emailAbsent:
      "No support email is published right now. Use the internal messaging to write to us.",
    aideTitre: "Online help",
    aide: [
      {
        titre: "Messages",
        texte: "Talk to a seller or an employer before buying or applying.",
        liens: [{ vers: "/messages", cle: "chat" }],
      },
      {
        titre: "Transparency",
        texte: "Commission, held funds and disputes: the Pi payment rules.",
        liens: [{ vers: "/transparence", cle: "transparence" }],
      },
      {
        titre: "Terms and privacy",
        texte: "The platform's rules of use and how your data is handled.",
        liens: [
          { vers: "/conditions", cle: "conditions" },
          { vers: "/confidentialite", cle: "confidentialite" },
        ],
      },
    ],
    signalementTexte:
      "Open the listing, job or profile concerned, then choose \u00ab Report \u00bb: your report is sent to the Arija Connect team.",
    signalementLiens: [
      { vers: "/market", cle: "market" },
      { vers: "/jobs", cle: "jobs" },
    ],
  },
};

function LienAide({ vers, cle }: Lien) {
  const t = useT();
  return (
    <Link
      to={vers}
      className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-primary hover:underline"
    >
      {t(cle)}
    </Link>
  );
}

function Support() {
  const langue = useLangue();
  const t = useT();
  const c = contenus[langue];
  const email = String(import.meta.env.VITE_SUPPORT_EMAIL ?? "").trim();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{c.titre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.introduction}</p>
      </div>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.contactTitre}</h2>
        {email ? (
          <dl className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">{c.emailLabel}</dt>
              <dd>
                <a
                  href={`mailto:${email}`}
                  className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
                >
                  {email}
                </a>
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-muted-foreground">{c.emailAbsent}</p>
        )}
        <p className="text-muted-foreground">{t("delaiReponse")}</p>
      </Carte>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.aideTitre}</h2>
        <ul className="space-y-3">
          {c.aide.map((a) => (
            <li key={a.titre}>
              <p className="font-semibold text-foreground">{a.titre}</p>
              <p className="text-muted-foreground">{a.texte}</p>
              <div className="flex flex-wrap gap-x-4">
                {a.liens.map((l) => (
                  <LienAide key={l.vers} vers={l.vers} cle={l.cle} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Carte>

      <Carte className="space-y-2 text-sm leading-relaxed">
        <h2 className="section-label">{t("signalerProbleme")}</h2>
        <p className="text-muted-foreground">{c.signalementTexte}</p>
        <div className="flex flex-wrap gap-x-4">
          {c.signalementLiens.map((l) => (
            <LienAide key={l.vers} vers={l.vers} cle={l.cle} />
          ))}
        </div>
      </Carte>
    </div>
  );
}
