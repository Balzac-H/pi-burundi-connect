import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bouton, Carte, Etiquette } from "@/components/ui-kit";
import { useSession } from "@/lib/auth";
import { estAdmin, listerSignalements, marquerTraite, raisonsSignalement, type SignalementDb } from "@/lib/annonces";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { piRelease } from "@/lib/pi.functions";
import { formatPi } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Signalements — Admin WICO" },
      { name: "description", content: "Espace administrateur WICO : suivi des signalements de membres et d'annonces." },
      { property: "og:title", content: "Signalements — Admin WICO" },
      { property: "og:description", content: "Modération de la communauté WICO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { utilisateur, chargement } = useSession();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [liste, setListe] = useState<SignalementDb[]>([]);
  const [litiges, setLitiges] = useState<{ id: string; order_id: string; description: string; statut: string; created_at: string }[]>([]);
  const [retenus, setRetenus] = useState<{ id: string; montant: number; order_id: string }[]>([]);
  const chargerPaiements = () => {
    supabase.from("litiges").select("*").order("created_at", { ascending: false }).then(({ data }) => setLitiges(data ?? []));
    supabase.from("payments").select("id, montant, order_id").eq("statut", "paid_held").then(({ data }) => setRetenus(data ?? []));
  };

  useEffect(() => {
    if (!utilisateur) return;
    estAdmin(utilisateur.id).then((ok) => {
      setAdmin(ok);
      if (ok) chargerPaiements();
      if (ok) listerSignalements().then(setListe).catch(() => toast.error("Chargement impossible."));
    });
  }, [utilisateur]);

  const compteurs = useMemo(() => {
    const m = new Map<string, number>();
    liste.forEach((s) => m.set(s.utilisateur_signale_id, (m.get(s.utilisateur_signale_id) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [liste]);

  if (chargement) return null;
  if (!utilisateur) return <Carte>Connectez-vous. <Link to="/connexion" className="font-semibold text-accent">Se connecter</Link></Carte>;
  if (admin === null) return <Carte>Vérification…</Carte>;
  if (!admin) return <Carte>Accès réservé aux administrateurs.</Carte>;

  const basculer = async (s: SignalementDb) => {
    const statut = s.statut === "ouvert" ? "traite" : "ouvert";
    await marquerTraite(s.id, statut);
    setListe((l) => l.map((x) => (x.id === s.id ? { ...x, statut } : x)));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-extrabold text-primary">Espace admin</h1>
      <Carte className="space-y-2">
        <h2 className="font-bold">Fonds retenus ({retenus.length})</h2>
        {retenus.length === 0 && <p className="text-sm text-muted-foreground">Aucun paiement en attente de libération.</p>}
        {retenus.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 text-sm">
            <span>Commande {r.order_id.slice(0, 8)} · {formatPi(Number(r.montant))}</span>
            <Bouton taille="sm" onClick={async () => {
              try { await piRelease({ data: { paymentId: r.id } }); toast.success("Statut passé à « libéré »."); chargerPaiements(); }
              catch (e) { toast.error((e as Error).message); }
            }}>Libérer</Bouton>
          </div>
        ))}
      </Carte>
      <Carte className="space-y-2">
        <h2 className="font-bold">Litiges ({litiges.filter((l) => l.statut === "ouvert").length} ouverts)</h2>
        {litiges.length === 0 && <p className="text-sm text-muted-foreground">Aucun litige.</p>}
        {litiges.map((l) => (
          <div key={l.id} className="space-y-1 border-b border-border/60 pb-2 text-sm last:border-0">
            <p className="font-semibold">Commande {l.order_id.slice(0, 8)} · {l.statut}</p>
            <p className="text-muted-foreground">{l.description}</p>
            {l.statut === "ouvert" && <Bouton taille="sm" variante="contour" onClick={async () => {
              await supabase.from("litiges").update({ statut: "resolu" }).eq("id", l.id); chargerPaiements();
            }}>Marquer résolu</Bouton>}
          </div>
        ))}
      </Carte>
      <h2 className="text-lg font-bold">Signalements</h2>
      <Carte className="space-y-2">
        <h2 className="font-bold">Membres les plus signalés</h2>
        {compteurs.length === 0 && <p className="text-sm text-muted-foreground">Aucun signalement.</p>}
        {compteurs.map(([id, n]) => (
          <div key={id} className="flex items-center justify-between text-sm">
            <Link to="/profil/$id" params={{ id }} className="font-semibold text-primary">{id.slice(0, 8)}…</Link>
            <Etiquette ton={n >= 3 ? "urgent" : undefined}>{n} signalement(s)</Etiquette>
          </div>
        ))}
      </Carte>
      {liste.map((s) => (
        <Carte key={s.id} className="space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold">{raisonsSignalement.find((r) => r.code === s.raison)?.nom ?? s.raison} · {s.cible_type}</span>
            <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("fr-FR")}</span>
          </div>
          {s.details && <p className="text-muted-foreground">{s.details}</p>}
          <Bouton taille="sm" variante={s.statut === "ouvert" ? "primaire" : "contour"} onClick={() => basculer(s)}>
            {s.statut === "ouvert" ? "Marquer traité" : "Rouvrir"}
          </Bouton>
        </Carte>
      ))}
    </div>
  );
}
