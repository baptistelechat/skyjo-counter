import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Keyboard, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChoixPhoto from "@/components/photo/ChoixPhoto";
import GrilleEditable from "@/components/grille/GrilleEditable";
import { motifs } from "@/lib/aVerifier";
import { scanner, type Progression } from "@/lib/moteur";
import { depuisAnalyse, grilleVide, type GrilleSaisie } from "@/lib/partie";

interface Props {
  joueur: string;
  initiale: GrilleSaisie | null;
  moteurPret: boolean;
  onValider: (g: GrilleSaisie) => void;
  onRetour: () => void;
}

const ETAPES: Record<Progression["etape"], string> = {
  premiere: "Première lecture",
  recadrage: "Lecture zoomée sur la grille",
  relecture: "Relecture des cartes illisibles",
};

type Etat =
  | { vue: "choix" }
  | { vue: "scan"; grille: GrilleSaisie | null; etape: string }
  | { vue: "edition"; grille: GrilleSaisie }
  | { vue: "erreur"; message: string };

// Grille d'un joueur : photo (scan Mirage, grille provisoire puis finale) ou saisie à la main, puis correction.
const SaisieJoueur = ({
  joueur,
  initiale,
  moteurPret,
  onValider,
  onRetour,
}: Props): React.JSX.Element => {
  const [etat, setEtat] = useState<Etat>(
    initiale ? { vue: "edition", grille: initiale } : { vue: "choix" },
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const scanId = useRef(0);

  useEffect(() => () => void (photo && URL.revokeObjectURL(photo)), [photo]);
  // Quitter l'écran pendant un scan : on ignore le résultat (le worker finit sa passe en arrière-plan).
  useEffect(() => () => void scanId.current++, []);

  const scannerPhoto = async (fichier: File) => {
    const id = ++scanId.current;
    setPhoto(URL.createObjectURL(fichier));
    setEtat({ vue: "scan", grille: null, etape: "Lecture de la grille…" });
    try {
      const { analyse } = await scanner(
        fichier,
        Infinity,
        ({ etape, analyse, passes, prevues }) => {
          if (id !== scanId.current) return;
          const suite = etape === "premiere" && prevues > 1 ? " au moins" : "";
          setEtat({
            vue: "scan",
            grille: depuisAnalyse(analyse, motifs),
            etape: `${ETAPES[etape]} · étape ${passes} sur ${prevues}${suite}`,
          });
        },
      );
      if (id === scanId.current)
        setEtat({ vue: "edition", grille: depuisAnalyse(analyse, motifs) });
    } catch (e) {
      if (id === scanId.current) setEtat({ vue: "erreur", message: String(e) });
    }
  };

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center gap-4 p-4">
      <header className="flex w-full items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour à la manche"
          onClick={onRetour}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <h1 className="text-xl font-semibold">Grille de {joueur}</h1>
      </header>

      {etat.vue === "choix" && (
        <>
          <ChoixPhoto disabled={false} onPhoto={scannerPhoto} />
          {!moteurPret && (
            <p className="text-sm text-muted-foreground">
              Le modèle se charge : l'analyse démarrera dès qu'il est prêt.
            </p>
          )}
          <Button
            variant="link"
            onClick={() => setEtat({ vue: "edition", grille: grilleVide() })}
          >
            <Keyboard aria-hidden="true" />
            Saisir la grille à la main
          </Button>
        </>
      )}

      {photo && etat.vue !== "choix" && (
        <img
          src={photo}
          alt={`Photo de la grille de ${joueur}`}
          className="max-h-48 rounded-lg object-contain"
        />
      )}

      {etat.vue === "scan" && (
        <>
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-medium text-blue-700"
          >
            ⏳ {etat.etape}
            {etat.grille && ", la grille peut encore changer"}
          </p>
          {etat.grille ? (
            <GrilleEditable grille={etat.grille} provisoire />
          ) : (
            <p className="text-sm text-muted-foreground">
              La première grille arrive en 5 à 20 secondes.
            </p>
          )}
        </>
      )}

      {etat.vue === "erreur" && (
        <p role="alert" className="text-sm text-destructive">
          L'analyse a échoué : {etat.message}
        </p>
      )}

      {etat.vue === "edition" && (
        <>
          <GrilleEditable
            grille={etat.grille}
            onChange={(grille) => setEtat({ vue: "edition", grille })}
          />
          <Button
            size="xl"
            className="w-full"
            onClick={() => onValider(etat.grille)}
          >
            <Check aria-hidden="true" />
            Valider la grille
          </Button>
        </>
      )}

      {(etat.vue === "edition" || etat.vue === "erreur") && (
        <Button variant="outline" onClick={() => setEtat({ vue: "choix" })}>
          <RotateCcw aria-hidden="true" />
          Reprendre une photo
        </Button>
      )}
    </main>
  );
};

export default SaisieJoueur;
