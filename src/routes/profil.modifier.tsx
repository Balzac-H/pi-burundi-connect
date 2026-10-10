import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bouton, Carte, Champ, Saisie, Selection, Avatar, LienBouton } from "@/components/ui-kit";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { useT } from "@/lib/i18n";
import {
  chargerProfil,
  enregistrerProfil,
  televerserPhoto,
  composerNumero,
  separerNumero,
  indicatifs,
  statutAvecWhatsapp,
  roleStatut,
  oublierProfil,
  type Profil,
} from "@/lib/comptes";

export const Route = createFileRoute("/profil/modifier")({
  head: () => ({
    meta: [
      { title: "Modifier mon profil — Arija Connect" },
      {
        name: "description",
        content:
          "Mettez à jour votre photo, votre localisation, votre type de compte et vos coordonnées.",
      },
      { property: "og:title", content: "Modifier mon profil — Arija Connect" },
      {
        property: "og:description",
        content: "Gérez vos informations publiques sur la plateforme.",
      },
    ],
  }),
  component: Modifier,
});

function Modifier() {
  const { utilisateur, chargement } = useSession();
  const navigate = useNavigate();
  const t = useT();
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

  const tel = separerNumero(profil?.telephone ?? profil?.whatsapp);

  if (chargement)
    return <p className="py-10 text-center text-sm text-muted-foreground">Chargement…</p>;
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
    const brut = String(f.get("telephone") ?? "").trim();
    const numero = brut ? composerNumero(String(f.get("indicatif") ?? "257"), brut) : "";
    const afficher = f.get("afficherWhatsapp") === "on";

    if (afficher && !numero) {
      toast.error("Saisissez un numéro de téléphone pour afficher votre WhatsApp.");
      return;
    }
    if (numero && !/^\d{10,15}$/.test(numero)) {
      toast.error("Numéro invalide : uniquement des chiffres, ex. 79 000 000.");
      return;
    }

    try {
      await enregistrerProfil(utilisateur.id, {
        nom: String(f.get("nom") ?? ""),
        ville: String(f.get("ville") ?? "").trim() || null,
        telephone: afficher && numero ? `+${numero}` : null,
        whatsapp: afficher && numero ? `+${numero}` : null,
        statut: statutAvecWhatsapp(String(f.get("statut") ?? "prestataire"), afficher),
        type_compte: String(f.get("type_compte") ?? "chercheur"),
        photo_url: photo,
      });
      oublierProfil(utilisateur.id);
      toast.success("Profil mis à jour !");
      navigate({ to: "/profil" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    }
  }

  return (
    <form className="mx-auto max-w-2xl space-y-4" onSubmit={soumettre}>
      <h1 className="text-2xl font-semibold text-primary">Modifier mon profil</h1>

      <Carte className="space-y-4">
        <div className="flex items-center gap-4">
          {photo ? (
            <img src={photo} alt="Photo de profil" className="size-20 rounded-full object-cover" />
          ) : (
            <Avatar nom={profil?.nom} taille="lg" />
          )}
          <input
            ref={fichierRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && choisirPhoto(e.target.files[0])}
          />
          <Bouton
            type="button"
            variante="contour"
            taille="sm"
            disabled={envoi}
            onClick={() => fichierRef.current?.click()}
          >
            {envoi ? "Envoi…" : "Changer la photo"}
          </Bouton>
        </div>

        <Champ label="Nom complet" obligatoire>
          <Saisie
            name="nom"
            required
            defaultValue={profil?.nom ?? ""}
            maxLength={100}
            key={profil?.nom}
          />
        </Champ>
        <Champ label="Localisation" aide="Facultatif">
          <Saisie
            name="ville"
            defaultValue={profil?.ville ?? ""}
            maxLength={120}
            key={`v${profil?.id ?? ""}`}
          />
        </Champ>
        <Champ
          label="Numéro de téléphone"
          aide="Chiffres uniquement, sans le zéro initial. Facultatif."
        >
          <div className="flex gap-2">
            <Selection
              name="indicatif"
              className="max-w-44"
              defaultValue={tel.indicatif}
              key={`i${profil?.id ?? ""}`}
            >
              {indicatifs.map((i) => (
                <option key={i.code} value={i.code}>
                  {i.pays}
                </option>
              ))}
            </Selection>
            <Saisie
              name="telephone"
              type="tel"
              inputMode="numeric"
              placeholder="79 000 000"
              defaultValue={tel.local}
              maxLength={15}
              key={`t${profil?.id ?? ""}`}
            />
          </div>
        </Champ>
        <div className="space-y-1.5">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-3">
            <input
              type="checkbox"
              name="afficherWhatsapp"
              className="size-4 shrink-0 accent-[oklch(0.36_0.062_159)]"
              defaultChecked={profil?.afficher_whatsapp ?? false}
              key={`wa${profil?.id ?? ""}`}
            />
            <span className="text-sm font-semibold">{t("afficherWhatsapp")}</span>
          </label>
          <p className="text-xs text-muted-foreground">
            Votre numéro n'est enregistré et affiché aux autres membres que si cette case est
            cochée.
          </p>
        </div>
        <Champ label="Type de compte" obligatoire>
          <Selection
            name="type_compte"
            defaultValue={profil?.type_compte ?? "chercheur"}
            key={`tc${profil?.id ?? ""}`}
          >
            <option value="vendeur">Vendeur</option>
            <option value="employeur">Employeur</option>
            <option value="chercheur">Chercheur d'emploi</option>
          </Selection>
        </Champ>
        <Champ label="Statut">
          <Selection
            name="statut"
            defaultValue={roleStatut(profil?.statut)}
            key={`s${profil?.id ?? ""}`}
          >
            <option value="prestataire">Prestataire de services</option>
            <option value="vendeur">Vendeur Market</option>
            <option value="les-deux">Les deux</option>
          </Selection>
        </Champ>
      </Carte>

      <div className="flex gap-2">
        <Bouton type="submit">Enregistrer</Bouton>
        <Bouton type="button" variante="contour" onClick={() => navigate({ to: "/profil" })}>
          Annuler
        </Bouton>
      </div>
    </form>
  );
}

function NonConnecte() {
  return (
    <Carte className="mx-auto max-w-md space-y-3 text-center">
      <p className="text-sm text-muted-foreground">
        Connectez-vous pour personnaliser votre profil.
      </p>
      <LienBouton to="/connexion">Se connecter</LienBouton>
    </Carte>
  );
}
