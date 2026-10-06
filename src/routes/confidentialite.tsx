import { createFileRoute } from "@tanstack/react-router";
import { Carte, TitreSection } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — WICO" },
      { name: "description", content: "Politique de confidentialité de la plateforme WICO." },
    ],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <TitreSection>🔒 {t("confidentialite")}</TitreSection>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <p className="text-xs font-semibold text-muted-foreground">{t("aValider")}</p>

        <h3 className="font-bold">1. Données collectées</h3>
        <p>
          WICO collecte les données nécessaires au fonctionnement du service : identifiant et nom
          d'utilisateur Pi, nom, ville, bio, photo, annonces publiées, messages échangés, commandes
          et paiements. Le numéro de téléphone et le numéro WhatsApp ne sont jamais affichés
          publiquement : ils ne sont visibles que par leur propriétaire.
        </p>

        <h3 className="font-bold">2. Finalités</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Créer et sécuriser votre compte (authentification via Pi Network) ;</li>
          <li>Afficher les annonces, permettre les échanges et traiter les paiements ;</li>
          <li>Vous prévenir des événements importants (paiement reçu, fonds libérés) ;</li>
          <li>Lutter contre la fraude et traiter les signalements.</li>
        </ul>

        <h3 className="font-bold">3. Paiements</h3>
        <p>
          Les paiements sont traités par Pi Network selon leurs propres conditions. WICO ne conserve
          aucune clé privée de portefeuille et n'a pas accès à vos fonds Pi hors du mécanisme de
          paiement décrit aux conditions d'utilisation.
        </p>

        <h3 className="font-bold">4. Partage</h3>
        <p>
          Vos données ne sont ni vendues ni louées. Elles sont accessibles aux autres membres
          uniquement lorsqu'elles sont nécessaires à une interaction (profil, annonce, message,
          commande) et aux administrateurs en cas de signalement ou de litige.
        </p>

        <h3 className="font-bold">5. Vos droits</h3>
        <p>
          Vous pouvez consulter et modifier votre profil à tout moment, et supprimer votre compte
          ainsi que vos données depuis les paramètres. Pour toute question : contact via la page
          Contact.
        </p>

        <h3 className="font-bold">6. Sécurité</h3>
        <p>
          Les échanges sont chiffrés (HTTPS) et les écritures sensibles sont protégées par des
          règles d'accès côté serveur. Dernière mise à jour : 6 octobre 2026.
        </p>
      </Carte>
    </div>
  );
}
