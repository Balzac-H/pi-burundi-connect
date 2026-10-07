import { createFileRoute } from "@tanstack/react-router";
import { PageLegale } from "@/components/PageLegale";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — WICO" },
      { name: "description", content: "Quelles données WICO collecte, pourquoi, combien de temps, et comment les supprimer." },
      { property: "og:title", content: "Politique de confidentialité — WICO" },
      { property: "og:description", content: "Vos données sur WICO, en toute transparence." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <PageLegale
      titre="Politique de confidentialité"
      contenu={{
        fr: (
          <>
            <h2>Données collectées</h2>
            <p>Nom, photo, ville, type de compte, email ou identifiant Pi (uid et nom d'utilisateur), numéros de téléphone et WhatsApp si vous les renseignez, annonces, commandes, paiements (identifiant et txid), messages et signalements.</p>
            <h2>Utilisation</h2>
            <p>Faire fonctionner le service, sécuriser les paiements, lutter contre la fraude et répondre aux litiges. Nous ne vendons pas vos données.</p>
            <h2>Visibilité</h2>
            <p>Votre nom, photo et annonces sont publics. Vos numéros ne sont visibles que par les membres connectés. Vos commandes et messages ne sont visibles que par vous et l'autre partie.</p>
            <h2>Partage</h2>
            <p>Pi Network reçoit les informations nécessaires au paiement. Nos prestataires techniques hébergent les données de façon sécurisée.</p>
            <h2>Conservation et suppression</h2>
            <p>Vous pouvez supprimer votre compte et vos données à tout moment depuis Paramètres. Les transactions inscrites sur la blockchain Pi ne peuvent pas être effacées.</p>
          </>
        ),
        rn: <p>Dukusanya izina, ifoto, imeri canke izina rya Pi, inomero za telefone, amatangazo, ivyaguzwe n'amafaranga. Ntitugurisha amakuru yawe. Ushobora gufuta konti yawe n'amakuru yawe yose muri « Paramètres ».</p>,
        sw: <p>Tunakusanya jina, picha, barua pepe au jina la Pi, nambari za simu, matangazo, maagizo na malipo. Hatuuzi data yako. Unaweza kufuta akaunti na data yako wakati wowote kwenye « Paramètres ».</p>,
        en: <p>We collect your name, photo, email or Pi identity, phone numbers, listings, orders and payments to run the service and secure payments. We never sell your data. You can delete your account and data at any time from Settings; Pi blockchain records cannot be erased.</p>,
      }}
    />
  ),
});
