import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30),
});

const SYSTEME = `Tu es l'assistant virtuel de WICO (Wisdom Connect), une plateforme burundaise qui connecte vendeurs, acheteurs et travailleurs, avec des paiements en Pi.
Aide les utilisateurs à trouver des produits, des services ou des emplois, à comprendre comment fonctionne le paiement en Pi, et à naviguer dans l'application.
Sois clair, concis, chaleureux, et réponds TOUJOURS dans la langue utilisée par l'utilisateur (français, kirundi, kiswahili ou anglais).
Beaucoup d'utilisateurs ne connaissent pas les cryptomonnaies : explique simplement, sans jargon.
Repères de navigation : /market (acheter et vendre des produits), /market/vendre (publier un produit), /jobs (offres d'emploi et services), /jobs/creer (publier une offre), /vendeurs (annuaire des vendeurs), /messages (chat), /portefeuille (solde Pi et factures), /profil (compte et numéro WhatsApp).
Les prix sont en Pi (de 0,001 π à 1 π). Une commission de 1 à 3 % est prélevée au vendeur lors d'une vente confirmée ; l'acheteur paie exactement le prix affiché.`;

export const demanderAssistant = createServerFn({ method: "POST" })
  .validator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const cle = process.env["LOVABLE_API_KEY"];
    if (!cle) return { reponse: "L'assistant n'est pas disponible pour le moment." };

    const reponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEME }, ...data.messages],
      }),
    });

    if (reponse.status === 429) {
      return { reponse: "Trop de demandes en même temps. Réessayez dans un instant." };
    }
    if (!reponse.ok) {
      return { reponse: "Désolé, je n'ai pas pu répondre. Réessayez dans un instant." };
    }

    const json = (await reponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      reponse:
        json.choices?.[0]?.message?.content ??
        "Désolé, je n'ai pas compris. Pouvez-vous reformuler ?",
    };
  });
