import { createFileRoute, Link } from "@tanstack/react-router";
import { Carte, TitreSection } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — Arija Connect" },
      {
        name: "description",
        content: "Politique de confidentialité de la plateforme Arija Connect.",
      },
    ],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <TitreSection>{t("confidentialite")}</TitreSection>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <p className="text-xs font-semibold text-muted-foreground">{t("aValider")}</p>

        <h3 className="font-semibold">1. Données collectées</h3>
        <p>
          Arija Connect collecte uniquement les données strictement nécessaires au service :
          identifiant et nom d'utilisateur Pi, nom affiché, ville (facultative), photo de profil
          (facultative), annonces publiées, offres d'emploi, messages échangés, commandes,
          paiements, notifications et signalements.
        </p>
        <p>
          Le numéro de téléphone et le numéro WhatsApp ne sont collectés et affichés que si le
          propriétaire du profil active l'option « Afficher mon WhatsApp ». Dans le cas contraire,
          ils ne sont ni enregistrés ni rendus visibles. Aucune autre donnée de profil n'est
          collectée.
        </p>
        <p>
          Conservation : vos données sont conservées tant que votre compte est actif. Après la
          suppression de votre compte, les données de profil sont effacées au plus tard sous 30
          jours, sauvegardes incluses ; les enregistrements de commandes et de paiements sont
          conservés uniquement le temps exigé par la comptabilité et la législation.
        </p>

        <h3 className="font-semibold">2. Finalités</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Créer et sécuriser votre compte (authentification via Pi Network) ;</li>
          <li>Afficher les annonces, permettre les échanges et traiter les paiements ;</li>
          <li>
            Autoriser la messagerie interne entre membres et, si vous l'activez, le contact WhatsApp
            ;
          </li>
          <li>Vous prévenir des événements importants (paiement reçu, fonds libérés) ;</li>
          <li>Lutter contre la fraude et traiter les signalements.</li>
        </ul>

        <h3 className="font-semibold">3. Paiements</h3>
        <p>
          Les paiements sont traités par Pi Network selon leurs propres conditions. Arija Connect ne
          conserve aucune clé privée de portefeuille et n'a pas accès à vos fonds Pi hors du
          mécanisme de paiement décrit aux conditions d'utilisation. Les commandes et paiements déjà
          effectués restent enregistrés à des fins comptables et légales.
        </p>

        <h3 className="font-semibold">4. Partage</h3>
        <p>
          Vos données ne sont ni vendues ni louées. Elles sont accessibles aux autres membres
          uniquement lorsqu'elles sont nécessaires à une interaction (profil, annonce, message,
          commande) et aux administrateurs en cas de signalement ou de litige. Votre numéro de
          téléphone n'est visible des autres membres que si vous avez activé l'option « Afficher mon
          WhatsApp ».
        </p>

        <h3 className="font-semibold">5. Vos droits</h3>
        <p>
          Vous pouvez consulter et modifier votre profil à tout moment depuis la page Profil. Vous
          pouvez également supprimer votre compte et vos données depuis Paramètres, via le bouton «
          Supprimer mon compte et mes données » : vos annonces, offres d'emploi, messages,
          notifications, abonnements, avis, signalements et votre profil sont alors supprimés, puis
          votre compte.
        </p>
        <p>
          Les enregistrements de commandes et de paiements sont conservés uniquement le temps exigé
          par la comptabilité et la législation ; les paiements déjà libérés restent enregistrés
          chez Pi Network. Pour toute question, consultez la page{" "}
          <Link to="/support" className="font-semibold text-primary underline">
            Support
          </Link>
          .
        </p>

        <h3 className="font-semibold">6. Sécurité</h3>
        <p>
          Les échanges sont chiffrés (HTTPS) et les écritures sensibles sont protégées par des
          règles d'accès côté serveur. Dernière mise à jour : 7 octobre 2026.
        </p>
      </Carte>
    </div>
  );
}
