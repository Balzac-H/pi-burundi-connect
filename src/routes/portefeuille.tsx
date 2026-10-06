import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bouton, Carte, BandeauPi, TitreSection, Etiquette, LienBouton } from "@/components/ui-kit";
import { formatPi } from "@/lib/store";
import {
  confirmerReception,
  libelleStatut,
  mesCommandes,
  ouvrirLitige,
  type CommandeAvecPaiement,
} from "@/lib/commandes";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { estAdmin } from "@/lib/annonces";
import { piRelease } from "@/lib/pi.functions";
import { toast } from "sonner";
import { BesoinCompte } from "@/components/BesoinCompte";
import { Copy, PackageCheck, TriangleAlert } from "lucide-react";

export const Route = createFileRoute("/portefeuille")({
  head: () => ({
    meta: [
      { title: "Mes commandes et paiements — WICO" },
      {
        name: "description",
        content: "Suivez vos commandes, vos paiements en Pi et la libération des fonds sur WICO.",
      },
      { property: "og:title", content: "Mes commandes et paiements — WICO" },
      {
        property: "og:description",
        content: "Commandes, paiements Pi et escrow en un coup d'œil.",
      },
    ],
  }),
  component: PortefeuilleProtege,
});

function Portefeuille() {
  const t = useT();
  const { utilisateur } = useSession();
  const [commandes, setCommandes] = useState<CommandeAvecPaiement[]>([]);
  const [onglet, setOnglet] = useState<"achats" | "ventes">("achats");
  const [admin, setAdmin] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);

  const recharger = useCallback(() => {
    if (!utilisateur?.id) return;
    mesCommandes(utilisateur.id)
      .then(setCommandes)
      .catch(() => setCommandes([]));
  }, [utilisateur?.id]);

  useEffect(() => {
    recharger();
    if (utilisateur?.id)
      estAdmin(utilisateur.id)
        .then(setAdmin)
        .catch(() => undefined);
  }, [recharger, utilisateur?.id]);

  const visibles = commandes.filter((c) =>
    onglet === "achats" ? c.acheteur_id === utilisateur?.id : c.vendeur_id === utilisateur?.id,
  );

  const paye = commandes
    .filter((c) => c.acheteur_id === utilisateur?.id)
    .reduce((s, c) => s + (c.statut === "en_attente_paiement" ? 0 : Number(c.montant)), 0);
  const enEscrow = commandes
    .filter((c) => c.vendeur_id === utilisateur?.id && c.statut === "payee")
    .reduce((s, c) => s + Number(c.montant), 0);
  const libere = commandes
    .filter((c) => c.vendeur_id === utilisateur?.id)
    .flatMap((c) => c.payments)
    .filter((p) => p.statut === "released")
    .reduce((s, p) => s + Number(p.montant), 0);

  async function confirmer(id: string) {
    try {
      await confirmerReception(id);
      toast.success("Réception confirmée — les fonds seront libérés.");
      recharger();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    }
  }

  async function signalerProbleme(c: CommandeAvecPaiement) {
    const description = window.prompt("Décrivez le problème rencontré :");
    if (!description?.trim() || !utilisateur) return;
    try {
      await ouvrirLitige(c.id, utilisateur.id, description.trim());
      toast.success("Litige ouvert. L'équipe va examiner votre demande.");
      recharger();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Signalement impossible.");
    }
  }

  async function liberer(paiementId: string) {
    setEnCours(paiementId);
    try {
      const r = await piRelease({ data: { paymentId: paiementId } });
      toast.success(`Fonds libérés — commission ${formatPi(r.commission)}.`);
      recharger();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Libération impossible.");
    } finally {
      setEnCours(null);
    }
  }

  function copierTxid(txid: string) {
    navigator.clipboard?.writeText(txid).then(
      () => toast.success("Identifiant de transaction copié."),
      () => toast("Transaction : " + txid),
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">🧾 {t("mesCommandes")}</h1>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Carte>
          <p className="text-[0.7rem] uppercase text-muted-foreground">Acheté</p>
          <p className="text-lg font-extrabold text-primary">{formatPi(paye)}</p>
        </Carte>
        <Carte>
          <p className="text-[0.7rem] uppercase text-muted-foreground">En escrow (à recevoir)</p>
          <p className="text-lg font-extrabold text-secondary">{formatPi(enEscrow)}</p>
        </Carte>
        <Carte>
          <p className="text-[0.7rem] uppercase text-muted-foreground">Libéré (net vendeur)</p>
          <p className="text-lg font-extrabold text-accent">{formatPi(libere)}</p>
        </Carte>
      </div>

      <BandeauPi texte="Paiements confirmés par Pi Network, fonds retenus jusqu'à réception" />

      <div className="flex gap-2">
        <Bouton
          taille="sm"
          variante={onglet === "achats" ? "primaire" : "contour"}
          onClick={() => setOnglet("achats")}
        >
          Mes achats
        </Bouton>
        <Bouton
          taille="sm"
          variante={onglet === "ventes" ? "primaire" : "contour"}
          onClick={() => setOnglet("ventes")}
        >
          Mes ventes
        </Bouton>
      </div>

      <section className="space-y-3">
        <TitreSection>Commandes</TitreSection>
        {visibles.length === 0 ? (
          <Carte className="text-sm text-muted-foreground">{t("aucuneCommande")}</Carte>
        ) : (
          visibles.map((c) => <CarteCommande key={c.id} c={c} onglet={onglet} />)
        )}
      </section>

      <section className="space-y-3">
        <TitreSection>Actions</TitreSection>
        <div className="space-y-3">
          {visibles.map((c) => {
            const paiement = c.payments[0];
            const estAcheteur = c.acheteur_id === utilisateur?.id;
            return (
              <Carte key={`a-${c.id}`} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate font-semibold">{c.titre}</span>
                {estAcheteur && c.statut === "payee" && (
                  <>
                    <Bouton taille="sm" onClick={() => confirmer(c.id)}>
                      <PackageCheck className="size-4" /> {t("confirmerReception")}
                    </Bouton>
                    <Bouton taille="sm" variante="danger" onClick={() => signalerProbleme(c)}>
                      <TriangleAlert className="size-4" /> {t("signalerProbleme")}
                    </Bouton>
                  </>
                )}
                {!estAcheteur && admin && paiement && paiement.statut === "paid_held" && (
                  <Bouton
                    taille="sm"
                    variante="pi"
                    disabled={enCours === paiement.id}
                    onClick={() => liberer(paiement.id)}
                  >
                    {t("liberer")} {formatPi(Number(paiement.montant))}
                  </Bouton>
                )}
                {paiement?.txid && (
                  <Bouton taille="sm" variante="contour" onClick={() => copierTxid(paiement.txid!)}>
                    <Copy className="size-4" /> txid
                  </Bouton>
                )}
              </Carte>
            );
          })}
        </div>
      </section>

      <LienBouton to="/market" variante="contour" className="w-full">
        {t("voirTout")} · {t("market")}
      </LienBouton>
    </div>
  );
}

function CarteCommande({ c, onglet }: { c: CommandeAvecPaiement; onglet: "achats" | "ventes" }) {
  const paiement = c.payments[0];
  return (
    <Carte className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{c.titre}</p>
        <Etiquette
          ton={
            c.statut === "recue" || c.statut === "payee"
              ? "succes"
              : c.statut === "litige"
                ? "urgent"
                : "neutre"
          }
        >
          {libelleStatut(c.statut)}
        </Etiquette>
      </div>
      <p className="text-xs text-muted-foreground">
        {onglet === "achats" ? "Acheté" : "Vendu"} le{" "}
        {new Date(c.created_at).toLocaleDateString("fr-FR")} · {c.quantite} {c.unite} ×{" "}
        {formatPi(Number(c.montant) / c.quantite)}
      </p>
      <p className="text-base font-extrabold text-primary">{formatPi(Number(c.montant))}</p>
      {paiement && (
        <p className="truncate text-xs text-muted-foreground">
          Paiement : {libelleStatut(paiement.statut)}
          {paiement.commission != null && ` · commission ${formatPi(Number(paiement.commission))}`}
          {paiement.txid && ` · ${paiement.txid.slice(0, 10)}…`}
        </p>
      )}
    </Carte>
  );
}

function PortefeuilleProtege() {
  const t = useT();
  return (
    <BesoinCompte
      titre={t("mesCommandes")}
      message="Connectez-vous avec Pi pour consulter vos commandes et paiements."
    >
      <Portefeuille />
    </BesoinCompte>
  );
}
