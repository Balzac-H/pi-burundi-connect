import { createFileRoute } from "@tanstack/react-router";
import { Carte } from "@/components/ui-kit";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — Arija" },
      {
        name: "description",
        content: "Conditions d'utilisation de la plateforme Arija (paiements en Pi).",
      },
      { property: "og:title", content: "Conditions d'utilisation — Arija" },
    ],
  }),
  component: Conditions,
});

function Conditions() {
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">{t("conditions")} d'utilisation</h1>

      <Carte className="space-y-3 text-sm leading-relaxed">
        <p className="text-xs font-semibold text-attente bg-attente-bg rounded-md px-2 py-1">
          {t("aValider")}
        </p>

        <h3 className="font-semibold">1. Objet</h3>
        <p>
          Arija (« la Plateforme ») met en relation des membres du Burundi pour la vente de
          produits, de services et l'offre d'emploi. Les paiements entre membres s'effectuent en Pi
          (Pi Network).
        </p>

        <h3 className="font-semibold">2. Compte</h3>
        <p>
          Le compte est créé à l'aide de votre identité Pi Network. Vous êtes responsable des
          activités réalisées via votre compte et vous vous engagez à fournir des informations
          exactes. Vous pouvez supprimer votre compte et vos données à tout moment depuis les
          paramètres.
        </p>

        <h3 className="font-semibold">3. Engagements des membres</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>Ne publier que des annonces sincères et légales.</li>
          <li>Ne pas tenter de contournement du système de paiement de la Plateforme.</li>
          <li>Respecter les autres membres et signaler tout comportement suspect.</li>
        </ul>

        <h3 className="font-semibold">4. Paiements, fonds retenus et litiges</h3>
        <p>
          Le paiement est confirmé par Pi Network puis détenu temporairement par Arija (« fonds
          retenus »). Ces fonds restent entre les mains d'Arija jusqu'à la confirmation de réception
          par l'acheteur, ou jusqu'à 72 heures après la livraison déclarée par le vendeur si aucun
          litige n'a été ouvert.
        </p>
        <p>
          À la libération des fonds, Arija prélève une commission de 2 %. Si un litige est tranché
          en faveur de l'acheteur, l'acheteur est remboursé et la commission n'est pas perçue.
        </p>
        <p>
          Le vendeur reste responsable des produits qu'il met en vente. Arija agit uniquement en
          tant qu'intermédiaire de paiement et de médiation.
        </p>

        <h3 className="font-semibold">5. Responsabilité</h3>
        <p>
          Arija n'est pas partie aux transactions entre membres. En cas de désaccord, un litige peut
          être signalé ; un arbitre indépendant examine les éléments fournis par les deux parties.
        </p>

        <h3 className="font-semibold">6. Modifications</h3>
        <p>
          Les présentes conditions peuvent évoluer. La version en vigueur est celle publiée sur
          cette page. Dernière mise à jour : 7 octobre 2026.
        </p>
      </Carte>
    </div>
  );
}
