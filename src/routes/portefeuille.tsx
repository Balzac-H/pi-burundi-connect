import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bouton, Carte, Champ, Saisie, Zone, BandeauPi, TitreSection } from "@/components/ui-kit";
import { transactions } from "@/lib/data";
import { useStore, formatPi, enFBu } from "@/lib/store";
import { bientotDisponible } from "@/lib/utils";
import { useFactures, tauxCommission } from "@/lib/facturation";
import { toast } from "sonner";
import { X } from "lucide-react";

export const Route = createFileRoute("/portefeuille")({
  head: () => ({
    meta: [
      { title: "Wallet Pi — WICO" },
      { name: "description", content: "Consultez votre solde Pi, votre escrow et l'historique de vos transactions sur WICO." },
      { property: "og:title", content: "Wallet Pi — WICO" },
      { property: "og:description", content: "Solde, escrow et transactions Pi en un coup d'œil." },
    ],
  }),
  component: Portefeuille,
});

function Portefeuille() {
  const solde = useStore((s) => s.soldePi);
  const escrow = useStore((s) => s.soldeEscrow);
  const disponible = solde - escrow;
  const [modal, setModal] = useState(false);
  const [montant, setMontant] = useState("");
  const factures = useFactures();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">WALLET PI 💰</h1>
      <p className="text-xs text-muted-foreground">🔐 Connecté à : pi://didier-n</p>

      <Carte className="space-y-2 gradient-pi text-primary-foreground">
        <p className="text-xs uppercase opacity-90">Solde total</p>
        <p className="text-3xl font-extrabold">{formatPi(solde)}</p>
        <p className="text-xs opacity-90">≈ {enFBu(solde)} selon le taux actuel</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-black/15 p-2">
            <p className="opacity-90">Bloqué en escrow</p>
            <p className="text-base font-bold">{formatPi(escrow)}</p>
          </div>
          <div className="rounded-lg bg-black/15 p-2">
            <p className="opacity-90">Disponible</p>
            <p className="text-base font-bold">{formatPi(disponible)}</p>
          </div>
        </div>
      </Carte>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Bouton onClick={() => setModal(true)}>ENVOYER PI</Bouton>
        <Bouton variante="contour" onClick={() => bientotDisponible("La réception par QR code")}>RECEVOIR</Bouton>
        <Bouton variante="contour" onClick={() => bientotDisponible("La copie d'adresse")}>ADRESSE</Bouton>
        <Bouton variante="fantome" onClick={() => bientotDisponible("Les paramètres du wallet")}>PARAMÈTRES</Bouton>
      </div>

      <BandeauPi texte="Transactions sécurisées sur la blockchain Pi" />

      <section>
        <TitreSection>Mes factures</TitreSection>
        {factures.length === 0 ? (
          <Carte>
            <p className="text-sm text-muted-foreground">
              Aucune facture pour le moment. Chaque vente confirmée génère automatiquement une facture
              (commission vendeur : {(tauxCommission() * 100).toLocaleString("fr-FR")} %).
            </p>
          </Carte>
        ) : (
          <div className="space-y-2">
            {factures.map((f) => (
              <Carte key={f.id} className="space-y-1 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-primary">Facture {f.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(f.date).toLocaleString("fr-FR")} · Vendeur : {f.vendeur}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">Payée</span>
                </div>
                <ul className="text-xs text-muted-foreground">
                  {f.lignes.map((l, i) => (
                    <li key={i}>
                      {l.libelle} × {l.quantite} — {formatPi(l.montant)}
                    </li>
                  ))}
                </ul>
                <div className="space-y-0.5 border-t border-border/60 pt-1 text-xs">
                  <Ligne libelle="Montant brut payé par l'acheteur" valeur={formatPi(f.montantBrut)} />
                  <Ligne
                    libelle={`Commission WICO (${(f.tauxCommission * 100).toLocaleString("fr-FR")} %)`}
                    valeur={`− ${formatPi(f.commission)}`}
                  />
                  <Ligne
                    libelle="Montant net reçu par le vendeur"
                    valeur={formatPi(f.montantNetVendeur)}
                    fort
                  />
                </div>
              </Carte>
            ))}
          </div>
        )}
      </section>

      <section>
        <TitreSection>Historique des transactions</TitreSection>
        <Carte className="divide-y divide-border/60 p-0">
          {transactions.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.type}</p>
                <p className="truncate text-xs text-muted-foreground">{t.date} · {t.tiers}</p>
              </div>
              <div className="text-right">
                <p className={t.montant > 0 ? "font-bold text-accent" : "font-bold text-foreground"}>
                  {t.montant > 0 ? "+" : ""}{t.montant.toLocaleString("fr-FR")} Pi
                </p>
                <p className="text-xs text-muted-foreground">✅ {t.statut}</p>
              </div>
            </div>
          ))}
        </Carte>
        <Bouton variante="fantome" className="mt-2 w-full" onClick={() => bientotDisponible("L'historique complet")}>
          VOIR TOUT L'HISTORIQUE
        </Bouton>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <Carte className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Envoyer des Pi</h2>
              <button onClick={() => setModal(false)} aria-label="Fermer"><X className="size-5" /></button>
            </div>
            <Champ label="Destinataire" obligatoire>
              <Saisie placeholder="Nom, adresse ou username Pi" maxLength={100} />
            </Champ>
            <Champ label="Montant (Pi)" obligatoire aide={`Max : ${formatPi(disponible)}`}>
              <Saisie type="number" min={1} max={disponible} value={montant} onChange={(e) => setMontant(e.target.value)} />
            </Champ>
            <Champ label="Message / Raison">
              <Zone maxLength={200} placeholder="Optionnel" />
            </Champ>
            <p className="text-xs text-muted-foreground">Frais estimés : 5 Pi</p>
            <div className="flex gap-2">
              <Bouton
                className="flex-1"
                onClick={() => {
                  const n = Number(montant);
                  if (!n || n <= 0 || n > disponible) {
                    toast.error("Montant invalide.");
                    return;
                  }
                  setModal(false);
                  setMontant("");
                  toast.success(`${formatPi(n)} envoyés avec succès !`);
                }}
              >
                VÉRIFIER
              </Bouton>
              <Bouton variante="contour" onClick={() => setModal(false)}>ANNULER</Bouton>
            </div>
          </Carte>
        </div>
      )}
    </div>
  );
}

function Ligne({ libelle, valeur, fort }: { libelle: string; valeur: string; fort?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${fort ? "font-bold text-primary" : "text-muted-foreground"}`}>
      <span>{libelle}</span>
      <span>{valeur}</span>
    </div>
  );
}
