import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  aCompleter,
  LIGNES,
  scoreGrille,
  type CaseSaisie,
  type GrilleSaisie,
} from "@/lib/partie";
import CaseCarte from "./CaseCarte";
import ChoixValeur from "./ChoixValeur";

interface Props {
  grille: GrilleSaisie;
  onChange?: (g: GrilleSaisie) => void; // absent : lecture seule
  provisoire?: boolean;
}

const position = (l: number, c: number) => `Ligne ${l + 1}, colonne ${c + 1}`;

// Grille d'un joueur : score en direct, tap sur une case pour la corriger.
// Le nombre de colonnes varie (une colonne défaussée en cours de manche est retirée de la table).
const GrilleEditable = ({
  grille,
  onChange,
  provisoire,
}: Props): React.JSX.Element => {
  const [choix, setChoix] = useState<[number, number] | null>(null);
  const { total, defaussees } = scoreGrille(grille);
  const colonnes = grille[0]?.length ?? 0;
  const manquantes = grille.flat().filter(aCompleter).length;

  const modifier = (c: CaseSaisie) => {
    if (!choix || !onChange) return;
    const [l, col] = choix;
    onChange(
      grille.map((ligne, i) =>
        ligne.map((x, j) => (i === l && j === col ? c : x)),
      ),
    );
    setChoix(null);
  };
  const changerColonnes = (n: number) =>
    onChange?.(
      Array.from({ length: LIGNES }, (_, l) =>
        Array.from(
          { length: n },
          (_, c) => grille[l]?.[c] ?? { valeur: null, dos: false },
        ),
      ),
    );

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <p
        aria-live="polite"
        className={
          provisoire ? "text-3xl font-bold opacity-60" : "text-3xl font-bold"
        }
      >
        {provisoire ? "Score provisoire" : "Score"} : {total}
        {manquantes > 0 && !provisoire && (
          <span className="ml-2 text-base font-medium text-orange-600">
            {manquantes} carte{manquantes > 1 ? "s" : ""} à saisir
          </span>
        )}
      </p>
      <div
        role="group"
        aria-label="Grille du joueur"
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${colonnes}, minmax(0, 1fr))` }}
      >
        {grille.flatMap((ligne, l) =>
          ligne.map((c, col) => (
            <CaseCarte
              key={`${l}-${col}`}
              carte={c}
              position={position(l, col)}
              defaussee={defaussees.includes(col)}
              onChoisir={onChange ? () => setChoix([l, col]) : undefined}
            />
          )),
        )}
      </div>
      {onChange && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Touche une carte pour la corriger.</span>
          <span className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Retirer une colonne"
              disabled={colonnes <= 1}
              onClick={() => changerColonnes(colonnes - 1)}
            >
              <Minus aria-hidden="true" />
            </Button>
            <span aria-live="polite">{colonnes} col.</span>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="Ajouter une colonne"
              disabled={colonnes >= 4}
              onClick={() => changerColonnes(colonnes + 1)}
            >
              <Plus aria-hidden="true" />
            </Button>
          </span>
        </div>
      )}
      <ChoixValeur
        ouvert={choix !== null}
        position={choix ? position(...choix) : ""}
        actuelle={choix ? (grille[choix[0]]?.[choix[1]] ?? null) : null}
        onFermer={() => setChoix(null)}
        onChoisir={modifier}
      />
    </div>
  );
};

export default GrilleEditable;
