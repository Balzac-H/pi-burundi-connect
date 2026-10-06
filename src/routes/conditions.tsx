import { createFileRoute } from "@tanstack/react-router";
import { Carte, TitreSection } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — WICO" },
      {
        name: "description",
        content: "Conditions d'utilisation de la plateforme WICO (paiements en Pi).",
      },
    ],
  }),
  component: Conditions,
});

function Conditions() {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <TitreSection>📜 {t("conditions")} d'utilisation</TitreSection>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <p className="text-xs font-semibold text-muted-foreground">{t("aValider")}</p>

        <h3 className="font-bold">1. Objet</h3>
        <p>
          WICO (« la Plateforme ») met en relation des membres du Burundi pour la vente de produits,
          de services et l'offre d'emploi. Les paiements entre membres s'effectuent en Pi (Pi
          Network).
        </p>

        <h3 className="font-bold">2. Compte</h3>
        <p>
          Le compte est créé à l'aide de votre identité Pi Network. Vous êtes responsable des
          activités réalisées via votre compte et vous vous engagez à fournir des informations
          exactes. Vous pouvez supprimer votre compte et vos données à tout moment depuis les
          paramètres.
        </p>

        <h3 className="font-bold">3. Engagements des membres</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ne publier que des annonces sincères et légales.</li>
          <li>Ne pas tenter de contournement du système de paiement de la Plateforme.</li>
          <li>Respecter les autres membres et signaler tout comportement suspect.</li>
        </ul>

        <h3 className="font-bold">4. Paiements et fonds retenus</h3>
        <p>
          Le paiement est confirmé par Pi Network puis conservé en séquestre (« fonds retenus »)
          jusqu'à la confirmation de réception par l'acheteur. La Plateforme prélève une commission
          de 2 % à la libération des fonds. Un litige peut être ouvert par l'acheteur ; les fonds
          restent bloqués jusqu'à traitement.
        </p>

        <h3 className="font-bold">5. Responsabilité</h3>
        <p>
          WICO n'est pas partie aux transactions entre membres. En cas de désaccord, un litige peut
          être signalé ; l'équipe examine les éléments fournis par les deux parties.
        </p>

        <h3 className="font-bold">6. Modifications</h3>
        <p>
          Les présentes conditions peuvent évoluer. La version en vigueur est celle publiée sur
          cette page. Dernière mise à jour : 6 octobre 2026.
        </p>
      </Carte>
    </div>
  );
}
