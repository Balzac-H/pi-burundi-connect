import { createFileRoute } from "@tanstack/react-router";
import { PageLegale } from "@/components/PageLegale";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — WICO" },
      { name: "description", content: "Règles d'utilisation de WICO : annonces, emplois, paiements en Pi, escrow et litiges." },
      { property: "og:title", content: "Conditions d'utilisation — WICO" },
      { property: "og:description", content: "Les règles de la communauté WICO." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PageLegale
      titre="Conditions d'utilisation"
      contenu={{
        fr: (
          <>
            <h2>1. Objet</h2>
            <p>WICO (Wisdom Connect) met en relation des acheteurs, vendeurs, employeurs et chercheurs d'emploi au Burundi. WICO n'est pas partie aux contrats conclus entre membres.</p>
            <h2>2. Compte</h2>
            <p>Vous pouvez vous inscrire par email, Google ou Pi Network. Vous êtes responsable de l'exactitude de vos informations et de la sécurité de votre compte.</p>
            <h2>3. Annonces</h2>
            <p>Les annonces doivent être licites, exactes (prix, stock, unité) et respecter la loi burundaise. WICO peut retirer toute annonce signalée et suspendre un compte.</p>
            <h2>4. Paiements en Pi</h2>
            <p>Les prix sont exprimés uniquement en Pi (π). Le paiement passe par le Pi Browser. Les fonds sont retenus par WICO jusqu'à la confirmation de réception, puis reversés au vendeur, moins une commission de 2 % à la charge du vendeur.</p>
            <h2>5. Litiges</h2>
            <p>L'acheteur peut signaler un problème depuis « Mes commandes et paiements ». L'équipe examine le litige et peut rembourser ou libérer les fonds.</p>
            <h2>6. Responsabilité</h2>
            <p>WICO fournit le service « en l'état » et ne garantit pas la qualité des biens et services proposés par les membres.</p>
            <h2>7. Contact</h2>
            <p>Pour toute question, utilisez l'assistant de l'application.</p>
          </>
        ),
        rn: <p>WICO ihuza abagura, abadandaza, abatanga akazi n'abarondera akazi mu Burundi. Ibiciro biri muri Pi gusa. Amahera agumizwa na WICO gushika umuguzi yemeje ko yashikiwe, hanyuma ahabwa umudandaza hakuwemwo 2 %. Amatangazo ategerezwa kuba ay'ukuri kandi yubahiriza amategeko.</p>,
        sw: <p>WICO inaunganisha wanunuzi, wauzaji, waajiri na watafuta kazi nchini Burundi. Bei ziko kwa Pi pekee. Fedha zinashikiliwa na WICO hadi mnunuzi athibitishe kupokea, kisha zinatolewa kwa muuzaji ukiondoa ada ya 2 %. Matangazo lazima yawe ya kweli na halali.</p>,
        en: <p>WICO connects buyers, sellers, employers and job seekers in Burundi. Prices are in Pi only. Funds are held by WICO until the buyer confirms receipt, then released to the seller minus a 2% commission. Listings must be accurate and lawful; disputes can be opened from "My orders and payments".</p>,
      }}
    />
  ),
});
