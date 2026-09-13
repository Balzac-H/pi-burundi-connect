import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Affiche un toast "Bientôt disponible" pour les boutons temporairement inactifs. */
export function bientotDisponible(nom = "Cette fonctionnalité") {
  toast.info(`${nom} sera bientôt disponible.`, { duration: 2500 });
}
