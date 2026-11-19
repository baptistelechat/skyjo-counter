import { Camera, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  aCompleter,
  scoreGrille,
  type GrilleSaisie,
  type Partie,
} from "@/lib/partie";

interface Props {
  partie: Partie;
  manche: (GrilleSaisie | null)[];
  onOuvrir: (joueur: number) => void;
  onEffacer: (joueur: number) => void;
  onValider: () => void;
}

// Manche en cours : une ligne par joueur (scanner / corriger), validation quand toutes les grilles sont saisies.
const Manche = ({
  partie,
  manche,
  onOuvrir,
  onEffacer,
  onValider,
}: Props): React.JSX.Element => {
  const restantes = manche.filter((g) => !g).length;
  return (
    <section
      aria-labelledby="titre-manche"
      className="flex w-full flex-col gap-3"
    >
      <h2 id="titre-manche" className="text-lg font-semibold">
        Manche {partie.manches.length + 1}
      </h2>
      <ul className="flex flex-col gap-2">
        {partie.joueurs.map((nom, j) => {
          const g = manche[j];
          const aSaisir = g ? g.flat().filter(aCompleter).length : 0;
          return (
            <li
              key={nom}
              className="flex items-center gap-2 rounded-lg border p-2"
            >
              <span className="flex-1 font-medium">{nom}</span>
              {g ? (
                <>
                  <span
                    className="text-xl font-bold tabular-nums"
                    aria-label={`${scoreGrille(g).total} points`}
                  >
                    {scoreGrille(g).total}
                  </span>
                  {aSaisir > 0 && (
                    <span className="text-xs text-orange-600">
                      {aSaisir} à saisir
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Corriger la grille de ${nom}`}
                    onClick={() => onOuvrir(j)}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Effacer la grille de ${nom}`}
                    onClick={() => onEffacer(j)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => onOuvrir(j)}
                  aria-label={`Scanner la grille de ${nom}`}
                >
                  <Camera aria-hidden="true" />
                  Scanner
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <Button size="xl" disabled={restantes > 0} onClick={onValider}>
        <Check aria-hidden="true" />
        {restantes > 0
          ? `Encore ${restantes} grille${restantes > 1 ? "s" : ""} à saisir`
          : "Valider la manche"}
      </Button>
    </section>
  );
};

export default Manche;
