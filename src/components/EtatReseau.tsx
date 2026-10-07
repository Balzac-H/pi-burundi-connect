import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff, RefreshCw } from "lucide-react";

/**
 * Bandeau d'état réseau : informe quand la connexion est faible/absente et
 * rafraîchit automatiquement les données dès que la connexion revient.
 */
export function EtatReseau() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [horsLigne, setHorsLigne] = useState(false);
  const [retour, setRetour] = useState(false);

  useEffect(() => {
    const majEtat = () => setHorsLigne(!navigator.onLine);
    majEtat();

    const surRetour = async () => {
      setHorsLigne(false);
      setRetour(true);
      await queryClient.invalidateQueries();
      await router.invalidate();
      setTimeout(() => setRetour(false), 2500);
    };
    const surPerte = () => setHorsLigne(true);

    window.addEventListener("online", surRetour);
    window.addEventListener("offline", surPerte);
    return () => {
      window.removeEventListener("online", surRetour);
      window.removeEventListener("offline", surPerte);
    };
  }, [queryClient, router]);

  if (!horsLigne && !retour) return null;

  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold ${
        horsLigne ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"
      }`}
    >
      {horsLigne ? (
        <>
          <WifiOff className="size-3.5" /> Mode hors ligne — contenu enregistré affiché
        </>
      ) : (
        <>
          <RefreshCw className="size-3.5 animate-spin" /> Connexion rétablie — mise à jour…
        </>
      )}
    </div>
  );
}
