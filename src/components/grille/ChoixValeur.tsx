import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FOND } from "@/components/carte/fond";
import { familleDe, type CaseSaisie } from "@/lib/partie";
import { VALEURS } from "@/lib/skyjo/lecture";
import { cn } from "@/lib/utils";

interface Props {
  ouvert: boolean;
  position: string;
  actuelle: CaseSaisie | null;
  onFermer: () => void;
  onChoisir: (c: CaseSaisie) => void;
}

// Dialog de correction : -2 à 12 ou dos. Un tap choisit et ferme.
const ChoixValeur = ({
  ouvert,
  position,
  actuelle,
  onFermer,
  onChoisir,
}: Props): React.JSX.Element => {
  const bouton = (c: CaseSaisie, texte: string, fond: string, nom: string) => {
    const choisie = actuelle?.dos === c.dos && actuelle?.valeur === c.valeur;
    return (
      <button
        key={nom}
        type="button"
        aria-label={nom}
        aria-pressed={choisie}
        onClick={() => onChoisir(c)}
        className={cn(
          "flex h-14 items-center justify-center rounded-lg text-xl font-bold shadow outline-none focus-visible:ring-3 focus-visible:ring-ring",
          fond,
          choisie && "ring-3 ring-foreground ring-offset-2 ring-offset-popover",
        )}
      >
        {texte}
      </button>
    );
  };
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && onFermer()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quelle carte ?</DialogTitle>
          <DialogDescription>{position}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-4 gap-2">
          {VALEURS.map((v) => {
            const famille = familleDe(v);
            return bouton(
              { valeur: v, dos: false },
              String(v),
              famille ? FOND[famille] : "",
              String(v),
            );
          })}
          {bouton(
            { valeur: null, dos: true },
            "",
            FOND.dos,
            "Dos de carte (non retournée)",
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChoixValeur;
