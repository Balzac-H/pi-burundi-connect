import { createFileRoute } from "@tanstack/react-router";
import { Carte, LienBouton } from "@/components/ui-kit";
import { useLangue, useT, type Langue } from "@/lib/i18n";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — Arija" },
      {
        name: "description",
        content:
          "Arija, marché et emplois solidaires au Burundi : mission, valeurs et fonctionnement.",
      },
      { property: "og:title", content: "À propos — Arija" },
      { property: "og:description", content: "Mission et valeurs de l'ONG Arija." },
    ],
  }),
  component: APropos,
});

const NOM_ONG =
  "Arija : Alliance pour le Renforcement des valeurs d'Intégrité de Justice Socio-économique et d'amitié entre les peuples";

const NON_RENSEIGNE = "Non renseigné";

type Contenu = {
  titre: string;
  introduction: string;
  missionTitre: string;
  mission: string;
  valeursTitre: string;
  valeurs: { nom: string; texte: string }[];
  plateformeTitre: string;
  plateforme: string;
  vendeursTitre: string;
  vendeurs: string;
  argentTitre: string;
  argent: { etape: string; texte: string }[];
  contactTitre: string;
  contact: string;
};

const contenus: Record<Langue, Contenu> = {
  fr: {
    titre: "À propos d'Arija",
    introduction:
      "Arija est une plateforme burundaise qui rapproche vendeurs, acheteurs et travailleurs, avec des paiements en Pi.",
    missionTitre: "Mission de l'ONG",
    mission: `${NOM_ONG}. L'ONG agit pour le renforcement des valeurs d'intégrité et de justice socio-économique, et pour promouvoir l'amitié entre les peuples du Burundi et de la région.`,
    valeursTitre: "Nos valeurs",
    valeurs: [
      {
        nom: "Intégrité",
        texte: "Des annonces sincères, des transactions traçables et des comportements honnêtes.",
      },
      {
        nom: "Justice socio-économique",
        texte: "Un accès équitable au marché et au travail, et une rémunération juste du travail.",
      },
      {
        nom: "Amitié entre les peuples",
        texte: "La coopération entre membres, communautés et pays de la région.",
      },
    ],
    plateformeTitre: "Ce qu'est Arija",
    plateforme:
      "Arija réunit un marché de produits et de services et un espace d'offres d'emploi. Les échanges se règlent en Pi (Pi Network), sans espèces ni banque.",
    vendeursTitre: "Qui peut vendre",
    vendeurs:
      "Tout membre disposant d'un compte Pi actif peut ouvrir un espace vendeur depuis son profil. Chaque annonce reste sous la responsabilité de son auteur.",
    argentTitre: "Comment l'argent circule",
    argent: [
      {
        etape: "Paiement",
        texte: "L'acheteur paie en Pi ; le paiement est confirmé par Pi Network.",
      },
      {
        etape: "Fonds retenus",
        texte: "Arija retient temporairement les fonds, comme garantie pour l'acheteur.",
      },
      {
        etape: "Libération",
        texte:
          "Les fonds sont libérés au vendeur après confirmation de réception, ou 72 heures après la livraison déclarée sans litige.",
      },
      { etape: "Commission", texte: "Arija prélève une commission de 2 % à la libération." },
    ],
    contactTitre: "Contact et support",
    contact:
      "Pour toute question, utilisez la rubrique support ou les coordonnées officielles de l'ONG.",
  },
  rn: {
    titre: "Ibijanye na Arija",
    introduction:
      "Arija ni urwanda rwa Burundi ruhuzanya abatenguzi, abaguzi n'abakozi, hakoreshejwe Pi.",
    missionTitre: "Intego y'Umuco",
    mission: `${NOM_ONG}. Umuco ukora ku kuzamura indangagaciro z'integrite n'ubuhuza bw'ubukungu, no guhanga uruhana hagati y'abantu b'Aburundi n'abakurikira.`,
    valeursTitre: "Indangagaciro zacu",
    valeurs: [
      {
        nom: "Integrite",
        texte:
          "Ubutumwa butari uburimyi, ibicuruzwa bibangamiwe n'amaherezo, imikoreshereza y'ubuntu.",
      },
      {
        nom: "Ubuhuza bw'ubukungu",
        texte: "Ingirakamaro myengo y'isoko n'akazi, n'inguzanyo ikwiye akazi.",
      },
      {
        nom: "Uruhane hagati y'abantu",
        texte: "Ubufatanye hagati y'abanyamuryango, abaturage n'ibirwa byo mu mpahanya.",
      },
    ],
    plateformeTitre: "Arija ni iki",
    plateforme:
      "Arija ihuza isoko ry'ibicuruzwa n'ibikorwa, hamwe n'umwanya w'akazi. Ihuriro rihindurwa na Pi (Pi Network), ntamafaranga y'ibanze.",
    vendeursTitre: "Ni ubuhe uburyo bwo gutengurako",
    vendeurs:
      "Buri muntu ufite konti ya Pi ikora ashobora gutangira urwanda rwe mu mwanya we. Buri koko iruhukijwe n'umutenguzi.",
    argentTitre: "Uko amafaranga ahaguruka",
    argent: [
      { etape: "Kwishyura", texte: "Umuguzi aishyura na Pi ; Pi Network ikora ubwishyura." },
      {
        etape: "Amafaranga akwirengwa",
        texte: "Arija ibikira amafaranga gihe gito, nk'umwanzo w'umuguzi.",
      },
      {
        etape: "Kutanga",
        texte:
          "Amafaranga atangwa umutenguzi nyuma yo kwemera kw'ubwonyine, cyangwa hejuru y'ibisa myanya 72 guhera ku gutwara utarimo urujijo.",
      },
      { etape: "Umugabane", texte: "Arija ifata umugabane wa 2 % igihe atangwa." },
    ],
    contactTitre: "Ubutumwa n'ufasha",
    contact: "Kubw'ibibazo, koresha umwanya w'ufasha cyangwa aderesi ofisiyeli y'Umuco.",
  },
  sw: {
    titre: "Kuhusu Arija",
    introduction:
      "Arija ni jukwaa la Burundi linalounganisha wauzaji, wanunuzi na wafanyikazi, kwa malipo ya Pi.",
    missionTitre: "Dhamira ya shirika",
    mission: `${NOM_ONG}. Shirika hufanya kazi kukuza thamani za uadilifu na haki ya kijamii-uchumi, na kukuza urafiki kati ya watu wa Burundi na nchi jirani.`,
    valeursTitre: "Thamani zetu",
    valeurs: [
      {
        nom: "Uadilifu",
        texte: "Matangazo ya kweli, miamala inayofuatilika na tabia za heshima.",
      },
      {
        nom: "Haki ya kijamii-uchumi",
        texte: "Ulinganisho wa fursa za soko na kazi, na malipo yanayostahili kazi.",
      },
      {
        nom: "Urafiki kati ya watu",
        texte: "Ushirikiano kati ya wanachama, jamii na nchi za kanda.",
      },
    ],
    plateformeTitre: "Arija ni nini",
    plateforme:
      "Arija inaunganisha soko la bidhaa na huduma pamoja na nafasi za kazi. Malipo hufanyika kwa Pi (Pi Network), bila fedha za mkono wala benki.",
    vendeursTitre: "Nani anaweza kuuza",
    vendeurs:
      "Kila mwenye akaunti inayotumika ya Pi anaweza kuanzisha eneo lake la kuuza kutoka wasifu wake. Kila tangazo linaabirika na mwandishi wake.",
    argentTitre: "Jinsi fedwa zinavyotembea",
    argent: [
      { etape: "Malipo", texte: "Mnunuzi analipa kwa Pi; Pi Network inathibitisha malipo." },
      {
        etape: "Fedha zinashikiliwa",
        texte: "Arija inashikilia fedha kwa muda, kama dhamana kwa mnunuzi.",
      },
      {
        etape: "Kuachiliwa",
        texte:
          "Fedwa huachiliwa kwa muuzaji baada ya kuthibitishwa kupokelewa, au saa 72 baada ya kuletwa kwa kauli bila mgogoro.",
      },
      { etape: "Kamisheni", texte: "Arija huchukua kamisheni ya 2 % wakati wa kuachiliwa." },
    ],
    contactTitre: "Mawasiliano na msaada",
    contact: "Kwa swali lolote, tumia sehemu ya msaada au mawasiliano rasmi ya shirika.",
  },
  en: {
    titre: "About Arija",
    introduction:
      "Arija is a Burundian platform connecting sellers, buyers and workers, with payments in Pi.",
    missionTitre: "The NGO's mission",
    mission: `${NOM_ONG}. The NGO works to strengthen the values of integrity and socio-economic justice, and to promote friendship between the peoples of Burundi and the region.`,
    valeursTitre: "Our values",
    valeurs: [
      {
        nom: "Integrity",
        texte: "Sincere listings, traceable transactions and honest behaviour.",
      },
      {
        nom: "Socio-economic justice",
        texte: "Fair access to the market and to work, and fair pay for work.",
      },
      {
        nom: "Friendship between peoples",
        texte: "Cooperation between members, communities and countries of the region.",
      },
    ],
    plateformeTitre: "What Arija is",
    plateforme:
      "Arija combines a marketplace for products and services with a job board. Payments are made in Pi (Pi Network), with no cash or bank account.",
    vendeursTitre: "Who can sell",
    vendeurs:
      "Any member with an active Pi account can open a seller space from their profile. Each listing remains the responsibility of its author.",
    argentTitre: "How the money moves",
    argent: [
      { etape: "Payment", texte: "The buyer pays in Pi; the payment is confirmed by Pi Network." },
      {
        etape: "Funds held",
        texte: "Arija temporarily holds the funds as a guarantee for the buyer.",
      },
      {
        etape: "Release",
        texte:
          "Funds are released to the seller after receipt is confirmed, or 72 hours after the declared delivery with no dispute.",
      },
      { etape: "Commission", texte: "Arija takes a 2 % commission on release." },
    ],
    contactTitre: "Contact and support",
    contact: "For any question, use the support section or the NGO's official details.",
  },
};

function APropos() {
  const langue = useLangue();
  const t = useT();
  const c = contenus[langue];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{c.titre}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{c.introduction}</p>
      </div>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.missionTitre}</h2>
        <p className="font-semibold text-foreground">{NOM_ONG}</p>
        <p className="text-muted-foreground">{c.mission}</p>
      </Carte>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.valeursTitre}</h2>
        <ul className="space-y-3">
          {c.valeurs.map((v) => (
            <li key={v.nom}>
              <p className="font-semibold text-foreground">{v.nom}</p>
              <p className="text-muted-foreground">{v.texte}</p>
            </li>
          ))}
        </ul>
      </Carte>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.plateformeTitre}</h2>
        <p className="text-muted-foreground">{c.plateforme}</p>
        <h3 className="font-semibold text-foreground">{c.vendeursTitre}</h3>
        <p className="text-muted-foreground">{c.vendeurs}</p>
      </Carte>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.argentTitre}</h2>
        <ol className="space-y-3">
          {c.argent.map((e, i) => (
            <li key={e.etape} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-foreground">{e.etape}</span>
                <span className="text-muted-foreground">{e.texte}</span>
              </span>
            </li>
          ))}
        </ol>
      </Carte>

      <Carte id="support" className="space-y-3 text-sm leading-relaxed">
        <h2 className="section-label">{c.contactTitre}</h2>
        <p className="text-muted-foreground">{c.contact}</p>
        <LienBouton to="/support" variante="contour">
          {t("support")}
        </LienBouton>
        <dl className="space-y-2">
          {[
            { terme: "Numéro d'enregistrement de l'ONG", valeur: NON_RENSEIGNE },
            { terme: "Email de contact", valeur: NON_RENSEIGNE },
            { terme: "Adresse", valeur: NON_RENSEIGNE },
            { terme: "Téléphone", valeur: NON_RENSEIGNE },
          ].map((l) => (
            <div key={l.terme} className="flex flex-wrap items-baseline justify-between gap-2">
              <dt className="text-muted-foreground">{l.terme}</dt>
              <dd className="font-semibold text-muted-foreground">{l.valeur}</dd>
            </div>
          ))}
        </dl>
      </Carte>
    </div>
  );
}
