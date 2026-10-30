import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bouton, Carte, Etiquette, Zone, LienBouton } from "@/components/ui-kit";
import { BesoinCompte } from "@/components/BesoinCompte";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";
import { formatPi } from "@/lib/store";
import { PI_SANDBOX } from "@/lib/pi";
import { toast } from "sonner";

export const Route = createFileRoute("/portefeuille")({
  head: () => ({
    meta: [
      { title: "Mes commandes et paiements — WICO" },
      { name: "description", content: "Suivez vos commandes, paiements Pi, fonds retenus et factures sur WICO." },
      { property: "og:title", content: "Mes commandes et paiements — WICO" },
      { property: "og:description", content: "Commandes, paiements Pi et factures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <BesoinCompte titre="Mes commandes et paiements">
      <MesPaiements />
    </BesoinCompte>
  ),
});

type Paiement = { id: string; statut: string; txid: string | null; montant: number; commission: number | null; facture: Record<string, unknown> | null };
type Commande = { id: string; acheteur_id: string; vendeur_id: string; titre: string; quantite: number; unite: string; montant: number; statut: string; created_at: string; payments: Paiement[] };

const libCommande: Record<string, string> = {
  en_attente_paiement: "En attente de paiement", payee: "Payée", recue: "Reçue", annulee: "Annulée",
};
const libPaiement: Record<string, string> = {
  pending: "En attente", approved: "Approuvé", paid_held: "Fonds retenus", released: "Libéré au vendeur", refunded: "Remboursé", cancelled: "Annulé",
};

function MesPaiements() {
  const { utilisateur } = useSession();
  const [liste, setListe] = useState<Commande[] | null>(null);
  const [litigeOuvert, setLitigeOuvert] = useState<string | null>(null);
  const [texte, setTexte] = useState("");

  const charger = () =>
    supabase.from("orders").select("*, payments(*)").order("created_at", { ascending: false })
      .then(({ data }) => setListe((data as unknown as Commande[]) ?? []));
  useEffect(() => { charger(); }, []);

  const explorer = (txid: string) => `https://blockexplorer.minepi.com/${PI_SANDBOX ? "testnet" : "mainnet"}/transactions/${txid}`;

  async function confirmer(id: string) {
    const { error } = await supabase.rpc("confirmer_reception", { _order: id });
    if (error) toast.error("Confirmation impossible."); else { toast.success("Réception confirmée."); charger(); }
  }
  async function signaler(id: string) {
    if (!utilisateur || texte.trim().length < 5) return toast("Décrivez le problème.");
    const { error } = await supabase.from("litiges").insert({ order_id: id, auteur_id: utilisateur.id, description: texte.trim().slice(0, 1000) });
    if (error) toast.error("Envoi impossible."); else { toast.success("Litige ouvert, l'équipe va l'examiner."); setLitigeOuvert(null); setTexte(""); }
  }

  if (liste === null) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Mes commandes et paiements</h1>
      {liste.length === 0 ? (
        <Carte className="space-y-3 text-center">
          <p className="font-semibold">Aucune commande pour le moment.</p>
          <LienBouton to="/market" taille="sm">Découvrir le marché</LienBouton>
        </Carte>
      ) : liste.map((c) => {
        const p = c.payments?.[0];
        const acheteur = c.acheteur_id === utilisateur?.id;
        return (
          <Carte key={c.id} className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">{c.titre} × {c.quantite} {c.unite}</span>
              <span className="font-extrabold text-primary">{formatPi(Number(c.montant))}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Etiquette>{acheteur ? "Achat" : "Vente"}</Etiquette>
              <Etiquette ton={c.statut === "annulee" ? "urgent" : "succes"}>{libCommande[c.statut] ?? c.statut}</Etiquette>
              {p && <Etiquette>Paiement : {libPaiement[p.statut] ?? p.statut}</Etiquette>}
            </div>
            <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("fr-FR")}</p>
            {p?.txid && (
              <a href={explorer(p.txid)} target="_blank" rel="noopener noreferrer" className="block break-all text-xs font-semibold text-accent">txid : {p.txid}</a>
            )}
            {p?.facture && (
              <details className="rounded-lg bg-muted p-2 text-xs">
                <summary className="cursor-pointer font-semibold">Facture {String(p.facture["numero"] ?? "")}</summary>
                <p>Montant brut : {formatPi(Number(p.facture["montant_brut"] ?? c.montant))}</p>
                {p.commission != null && (
                  <>
                    <p>Commission WICO (2 %) : {formatPi(Number(p.commission))}</p>
                    <p>Net vendeur : {formatPi(Number(c.montant) - Number(p.commission))}</p>
                  </>
                )}
              </details>
            )}
            {acheteur && c.statut === "payee" && (
              <div className="flex flex-wrap gap-2">
                <Bouton taille="sm" onClick={() => confirmer(c.id)}>Confirmer la réception</Bouton>
                <Bouton taille="sm" variante="contour" onClick={() => setLitigeOuvert(c.id)}>Signaler un problème</Bouton>
              </div>
            )}
            {litigeOuvert === c.id && (
              <div className="space-y-2">
                <Zone value={texte} maxLength={1000} onChange={(e) => setTexte(e.target.value)} placeholder="Décrivez le problème…" />
                <Bouton taille="sm" variante="danger" onClick={() => signaler(c.id)}>Envoyer</Bouton>
              </div>
            )}
          </Carte>
        );
      })}
    </div>
  );
}
