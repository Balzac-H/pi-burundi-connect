import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bouton, Carte, Champ, Saisie, Selection, Zone, Avatar, LienBouton } from "@/components/ui-kit";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { chargerProfil, enregistrerProfil, televerserPhoto, type Profil } from "@/lib/comptes";

export const Route = createFileRoute("/profil/modifier")({
  head: () => ({
    meta: [
      { title: "Modifier mon profil — BURUNDI PI CONNECT" },
      { name: "description", content: "Mettez à jour votre photo, bio, compétences, numéro WhatsApp, localisation et prix horaire." },
      { property: "og:title", content: "Modifier mon profil — BURUNDI PI CONNECT" },
      { property: "og:description", content: "Gérez vos informations publiques sur la plateforme." },
    ],
  }),
  component: Modifier,
});

function Modifier() {
  const { utilisateur, chargement } = useSession();
  const navigate = useNavigate();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!utilisateur) return;
    chargerProfil(utilisateur.id).then((p) => {
      setProfil(p);
      setPhoto(p?.photo_url ?? null);
    });
  }, [utilisateur]);

  if (chargement) return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
  if (!utilisateur) return <NonConnecte />;

  async function choisirPhoto(fichier: File) {
    if (!utilisateur) return;
    setEnvoi(true);
    try {
      const url = await televerserPhoto("avatars", utilisateur.id, fichier);
      setPhoto(url);
      toast.success("Photo téléversée.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du téléversement.");
    } finally {
      setEnvoi(false);
    }
  }

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!utilisateur) return;
    const f = new FormData(e.currentTarget);
    try {
      await enregistrerProfil(utilisateur.id, {
        nom: String(f.get("nom") ?? ""),
        bio: String(f.get("bio") ?? ""),
        ville: String(f.get("ville") ?? ""),
        telephone: String(f.get("telephone") ?? ""),
        whatsapp: String(f.get("whatsapp") ?? ""),
        statut: String(f.get("statut") ?? "prestataire"),
        prix_horaire: f.get("prix") ? Number(f.get("prix")) : null,
        competences: String(f.get("competences") ?? "")
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        photo_url: photo,
      });
      toast.success("Profil mis à jour !");
      navigate({ to: "/profil" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    }
  }

  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={soumettre}>
      <h1 className="text-2xl font-extrabold text-primary">Modifier mon profil</h1>

      <Carte className="space-y-4">
        <div className="flex items-center gap-4">
          {photo ? (
            <img src={photo} alt="Photo de profil" className="size-20 rounded-full object-cover" />
          ) : (
            <Avatar emoji="🧑🏿" taille="lg" />
          )}
          <input
            ref={fichierRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && choisirPhoto(e.target.files[0])}
          />
          <Bouton type="button" variante="contour" taille="sm" disabled={envoi} onClick={() => fichierRef.current?.click()}>
            {envoi ? "Envoi…" : "Changer la photo"}
          </Bouton>
        </div>

        <Champ label="Nom complet" obligatoire>
          <Saisie name="nom" required defaultValue={profil?.nom ?? ""} maxLength={100} key={profil?.nom} />
        </Champ>
        <Champ label="Bio / Description" aide="Max 300 caractères">
          <Zone name="bio" defaultValue={profil?.bio ?? ""} maxLength={300} key={`b${profil?.id ?? ""}`} />
        </Champ>
        <Champ label="Compétences / Tags" aide="Séparées par des virgules">
          <Saisie name="competences" defaultValue={(profil?.competences ?? []).join(", ")} maxLength={200} key={`c${profil?.id ?? ""}`} />
        </Champ>
        <Champ label="Localisation" obligatoire>
          <Saisie name="ville" required defaultValue={profil?.ville ?? ""} maxLength={120} key={`v${profil?.id ?? ""}`} />
        </Champ>
        <Champ label="Numéro de téléphone" obligatoire>
          <Saisie name="telephone" required type="tel" defaultValue={profil?.telephone ?? ""} maxLength={20} key={`t${profil?.id ?? ""}`} />
        </Champ>
        <Champ label="Numéro WhatsApp" aide="Affiché sur votre profil avec un bouton de contact direct">
          <Saisie name="whatsapp" type="tel" placeholder="+257 79 000 000" defaultValue={profil?.whatsapp ?? ""} maxLength={20} key={`w${profil?.id ?? ""}`} />
        </Champ>
        <Champ label="Prix horaire (Pi)">
          <Saisie name="prix" type="number" min={0} defaultValue={profil?.prix_horaire ?? undefined} key={`p${profil?.id ?? ""}`} />
        </Champ>
        <Champ label="Statut">
          <Selection name="statut" defaultValue={profil?.statut ?? "prestataire"} key={`s${profil?.id ?? ""}`}>
            <option value="prestataire">Prestataire de services</option>
            <option value="vendeur">Vendeur Market</option>
            <option value="les-deux">Les deux</option>
          </Selection>
        </Champ>
      </Carte>

      <div className="flex gap-2">
        <Bouton type="submit">ENREGISTRER</Bouton>
        <Bouton type="button" variante="contour" onClick={() => navigate({ to: "/profil" })}>ANNULER</Bouton>
      </div>
    </form>
  );
}

function NonConnecte() {
  return (
    <Carte className="mx-auto max-w-md space-y-3 text-center">
      <p className="text-sm text-muted-foreground">Connectez-vous pour personnaliser votre profil.</p>
      <LienBouton to="/connexion">SE CONNECTER</LienBouton>
    </Carte>
  );
}
