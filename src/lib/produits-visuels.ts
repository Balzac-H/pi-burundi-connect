import legumes from "@/assets/cat-legumes.jpg";
import mode from "@/assets/cat-mode.jpg";
import electronique from "@/assets/cat-electronique.jpg";
import services from "@/assets/cat-services.jpg";

const imagesParProduit: Record<string, string> = {
  "p-tomates": legumes,
  "p-tshirt": mode,
  "p-mangues": legumes,
  "p-radio": electronique,
};

const imagesParCategorie: Record<string, string> = {
  "Fruits & Légumes": legumes,
  Vêtements: mode,
  Électronique: electronique,
  Services: services,
  Maison: services,
};

export function imageProduit(id: string, categorie: string) {
  return imagesParProduit[id] ?? imagesParCategorie[categorie] ?? services;
}