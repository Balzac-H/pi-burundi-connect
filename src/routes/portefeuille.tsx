import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Bouton, Carte, BandeauPi, TitreSection, Etiquette, LienBouton } from "@/components/ui-kit";
import { formatPi } from "@/lib/store";
import {
  confirmerReception,
  correspondAuFiltre,
  declarerLivraison,
  libelleStatut,
  lignesCommande,
  mesCommandes,
  ouvrirLitige,
  type CommandeAvecPaiement,
  type FiltreCommandes,
} from "@/lib/commandes";
import { chargerProfilCache, type Profil } from "@/lib/comptes";
import { laisserAvis } from "@/lib/social";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import { estAdmin } from "@/lib/annonces";
import { piRelease } from "@/lib/pi.functions";
import { toast } from "sonner";
import { BesoinCompte } from "@/components/BesoinCompte";

export const Route = createFileRoute("/portefeuille")({
  head: () => ({
    meta: [
      { title: "Mes commandes — Arija Connect" },
      {
        name: "description",
        content:
          "Suivez vos commandes, vos paiements en Pi et la libération des fonds sur Arija Connect.",
      },
      { property: "og:title", content: "Mes commandes — Arija Connect" },
      {
        property: "og:description",
        content: "Commandes, paiements Pi et escrow en un coup d'œil.",
      },
    ],
  }),
  component: PortefeuilleProtege,
});

/** Un paiement interrompu reste reprenable pendant 30 minutes. */
const DELAI_REPRISE_MS = 30 * 60 * 1000;

function Portefeuille() {
  const t = useT();
  const navigate = useNavigate();
  const { utilisateur } = useSession();
  const [commandes, setCommandes] = useState<CommandeAvecPaiement[]>([]);
  const [onglet, setOnglet] = useState<"achats" | "ventes">("achats");
  const [filtre, setFiltre] = useState<FiltreCommandes>("toutes");
  const [admin, setAdmin] = useState(false);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [profils, setProfils] = useState<Record<string, Profil | null>>({});

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

  const visibles = commandes
    .filter((c) =>
      onglet === "achats" ? c.acheteur_id === utilisateur?.id : c.vendeur_id === utilisateur?.id,
    )
    .filter((c) => correspondAuFiltre(c, filtre));

  // Noms du contrepartie (acheteur ou vendeur).
  useEffect(() => {
    const ids = visibles
      .map((c) => (onglet === "achats" ? c.vendeur_id : c.acheteur_id))
      .filter((id) => !(id in profils));
    if (!ids.length) return;
    let vivant = true;
    Promise.all([...new Set(ids)].map((id) => chargerProfilCache(id)))
      .then((liste) => {
        if (!vivant) return;
        setProfils((prec) => {
          const suivant = { ...prec };
          liste.forEach((p, i) => {
            suivant[ids[i]] = p;
          });
          return suivant;
        });
      })
      .catch(() => undefined);
    return () => {
      vivant = false;
    };
  }, [visibles, onglet, profils]);

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

  async function marquerLivree(c: CommandeAvecPaiement) {
    try {
      await declarerLivraison(c.id);
      toast.success(t("livraisonDeclaree"));
      recharger();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    }
  }

  async function noter(c: CommandeAvecPaiement) {
    if (!utilisateur) return;
    const brut = window.prompt("Votre note (1 à 5) :");
    if (brut === null) return;
    const note = Number(brut);
    if (!Number.isFinite(note) || note < 1 || note > 5) {
      toast.error("Note entre 1 et 5.");
      return;
    }
    const commentaire = window.prompt("Votre commentaire (facultatif) :");
    try {
      await laisserAvis(
        utilisateur.id,
        c.vendeur_id,
        Math.round(note),
        commentaire?.trim() || undefined,
        c.id,
      );
      toast.success(t("noteEnvoyee"));
    } catch (e) {
      const cle = e instanceof Error ? e.message : "";
      if (cle === "avisImpossible") toast.error(t("avisImpossible"));
      else if (cle === "dejaNoteCommande") toast.error(t("dejaNoteCommande"));
      else toast.error(cle || "Action impossible.");
    }
  }

  function copierTxid(txid: string) {
    navigator.clipboard?.writeText(txid).then(
      () => toast.success("Identifiant de transaction copié."),
      () => toast("Transaction : " + txid),
    );
  }

  function copierFacture(c: CommandeAvecPaiement) {
    const texte = texteFacture(c);
    navigator.clipboard?.writeText(texte).then(
      () => toast.success(`${t("facture")} · copiée`),
      () => toast(texte),
    );
  }

  function reprendre(c: CommandeAvecPaiement) {
    navigate({ to: "/paiement", search: { commande: c.id } });
  }

  const peutReprendre = (c: CommandeAvecPaiement) =>
    c.statut === "en_attente_paiement" &&
    Date.now() - new Date(c.created_at).getTime() < DELAI_REPRISE_MS;

  const filtresPrincipaux: { cle: FiltreCommandes; libelle: string }[] = [
    { cle: "toutes", libelle: t("filtreToutes") },
    { cle: "attente", libelle: t("filtreEnAttente") },
    { cle: "succes", libelle: t("filtreSucces") },
  ];
  const filtresSecondaires: { cle: FiltreCommandes; libelle: string }[] = [
    { cle: "annulees", libelle: t("filtreAnnulees") },
    { cle: "litiges", libelle: t("filtreLitiges") },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">{t("mesCommandes")}</h1>

      <BandeauPi texte="Paiements confirmés par Pi Network, fonds retenus jusqu'à réception" />

      <div className="flex flex-wrap gap-2">
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

      <div className="flex flex-wrap gap-2">
        {filtresPrincipaux.map((f) => (
          <Bouton
            key={f.cle}
            taille="sm"
            variante={filtre === f.cle ? "primaire" : "contour"}
            onClick={() => setFiltre(f.cle)}
          >
            {f.libelle}
          </Bouton>
        ))}
      </div>
      <div className="-mt-2 flex flex-wrap gap-2">
        {filtresSecondaires.map((f) => (
          <Bouton
            key={f.cle}
            taille="sm"
            variante={filtre === f.cle ? "doux" : "fantome"}
            onClick={() => setFiltre(f.cle)}
          >
            {f.libelle}
          </Bouton>
        ))}
      </div>

      <section className="space-y-3">
        <TitreSection>
          {t("commandes")} ({visibles.length})
        </TitreSection>
        {visibles.length === 0 ? (
          <Carte className="text-sm text-muted-foreground">{t("aucuneCommande")}</Carte>
        ) : (
          visibles.map((c) => (
            <CarteCommande
              key={c.id}
              c={c}
              onglet={onglet}
              contrepartie={profils[onglet === "achats" ? c.vendeur_id : c.acheteur_id]}
              admin={admin}
              enCours={enCours}
              peutReprendre={peutReprendre(c)}
              onConfirmer={() => confirmer(c.id)}
              onSignaler={() => signalerProbleme(c)}
              onLivrer={() => marquerLivree(c)}
              onNoter={() => noter(c)}
              onLiberer={(p) => liberer(p)}
              onCopierTxid={copierTxid}
              onCopierFacture={() => copierFacture(c)}
              onReprendre={() => reprendre(c)}
            />
          ))
        )}
      </section>

      <LienBouton to="/market" variante="contour" className="w-full">
        {t("voirTout")} · {t("market")}
      </LienBouton>
    </div>
  );
}

function CarteCommande({
  c,
  onglet,
  contrepartie,
  admin,
  enCours,
  peutReprendre,
  onConfirmer,
  onSignaler,
  onLivrer,
  onNoter,
  onLiberer,
  onCopierTxid,
  onCopierFacture,
  onReprendre,
}: {
  c: CommandeAvecPaiement;
  onglet: "achats" | "ventes";
  contrepartie: Profil | null | undefined;
  admin: boolean;
  enCours: string | null;
  peutReprendre: boolean;
  onConfirmer: () => void;
  onSignaler: () => void;
  onLivrer: () => void;
  onNoter: () => void;
  onLiberer: (paiementId: string) => void;
  onCopierTxid: (txid: string) => void;
  onCopierFacture: () => void;
  onReprendre: () => void;
}) {
  const t = useT();
  const paiement = c.payments[0];
  const lignes = lignesCommande(c);
  const estAcheteur = onglet === "achats";

  return (
    <Carte className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate font-semibold">{c.titre}</p>
        <Etiquette
          ton={
            c.statut === "recue" || c.statut === "payee"
              ? "succes"
              : c.statut === "litige"
                ? "urgent"
                : c.statut === "en_attente_paiement"
                  ? "attente"
                  : "neutre"
          }
        >
          {libelleStatut(c.statut)}
        </Etiquette>
      </div>

      <p className="text-xs text-muted-foreground">
        {new Date(c.created_at).toLocaleString("fr-FR")} ·{" "}
        {estAcheteur ? t("vendeur") : t("acheteur")} : {contrepartie?.nom ?? "…"}
        {contrepartie?.ville ? ` · ${contrepartie.ville}` : ""}
      </p>

      <ul className="space-y-1">
        {lignes.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">
              {l.titre} × {l.quantite} {l.unite}
            </span>
            <span className="shrink-0 font-semibold">{formatPi(Number(l.montant))}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-sm text-muted-foreground">{t("total")}</span>
        <span className="text-base font-semibold text-primary">{formatPi(Number(c.montant))}</span>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          {t("paiementLabel")} : {paiement ? libelleStatut(paiement.statut) : "—"}
          {paiement?.commission != null && ` · commission ${formatPi(Number(paiement.commission))}`}
        </p>
        {paiement?.txid && <p className="truncate font-mono">txid : {paiement.txid}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {peutReprendre && (
          <Bouton taille="sm" variante="pi" onClick={onReprendre}>
            {t("reprendrePaiement")}
          </Bouton>
        )}
        {estAcheteur && c.statut === "payee" && (
          <>
            <Bouton taille="sm" onClick={onConfirmer}>
              {t("confirmerReception")}
            </Bouton>
            <Bouton taille="sm" variante="danger" onClick={onSignaler}>
              {t("signalerProbleme")}
            </Bouton>
          </>
        )}
        {!estAcheteur && c.statut === "payee" && !c.livre_declare_at && (
          <Bouton taille="sm" variante="contour" onClick={onLivrer}>
            {t("marquerLivre")}
          </Bouton>
        )}
        {estAcheteur && c.statut === "recue" && (
          <Bouton taille="sm" variante="pi" onClick={onNoter}>
            {t("noter")}
          </Bouton>
        )}
        {!estAcheteur && admin && paiement && paiement.statut === "paid_held" && (
          <Bouton
            taille="sm"
            variante="pi"
            disabled={enCours === paiement.id}
            onClick={() => onLiberer(paiement.id)}
          >
            {t("liberer")} {formatPi(Number(paiement.montant))}
          </Bouton>
        )}
        {paiement?.txid && (
          <Bouton taille="sm" variante="contour" onClick={() => onCopierTxid(paiement.txid!)}>
            {t("copierTxid")}
          </Bouton>
        )}
        <Bouton taille="sm" variante="contour" onClick={onCopierFacture}>
          {t("facture")}
        </Bouton>
      </div>
    </Carte>
  );
}

type FactureDb = {
  numero?: string;
  date?: string;
  lignes?: { libelle: string; quantite: number; unite: string; montant: number }[];
  montant_brut?: number;
  txid?: string;
};

function texteFacture(c: CommandeAvecPaiement): string {
  const paiement = c.payments[0];
  const f = (paiement?.facture ?? null) as FactureDb | null;
  const lignes = lignesCommande(c);
  const detail =
    f?.lignes && f.lignes.length
      ? f.lignes
      : lignes.map((l) => ({
          libelle: l.titre,
          quantite: l.quantite,
          unite: l.unite,
          montant: Number(l.montant),
        }));
  const numero = f?.numero ?? `ARIJA-${c.id.slice(0, 8).toUpperCase()}`;
  return [
    `Facture ${numero}`,
    `Date : ${f?.date ?? c.created_at}`,
    ...detail.map(
      (l) => `- ${l.libelle} × ${l.quantite} ${l.unite} : ${formatPi(Number(l.montant))}`,
    ),
    `Total : ${formatPi(f?.montant_brut ?? Number(c.montant))}`,
    paiement?.txid ? `Txid : ${paiement.txid}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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
