import { cn } from "@/lib/utils";
import { FOND } from "@/components/carte/fond";
import { aCompleter, familleDe, type CaseSaisie } from "@/lib/partie";

interface Props {
  carte: CaseSaisie;
  position: string; // « ligne 1, colonne 2 », pour le lecteur d'écran
  defaussee: boolean;
  onChoisir?: () => void; // absent : grille en lecture seule (scan en cours)
}

const libelle = (c: CaseSaisie): string =>
  c.dos ? "dos de carte" : c.valeur === null ? "à compléter" : String(c.valeur);

// Une carte de la grille : couleur déduite de la valeur, badge si le scan a un doute.
const CaseCarte = ({
  carte,
  position,
  defaussee,
  onChoisir,
}: Props): React.JSX.Element => {
  const famille = carte.dos
    ? "dos"
    : carte.valeur === null
      ? null
      : familleDe(carte.valeur);
  const douteuse = Boolean(carte.doutes?.length) || aCompleter(carte);
  const contenu = (
    <>
      {douteuse && (
        <span className="absolute -top-2 rounded-full bg-orange-500 px-1.5 text-[10px] font-semibold text-white">
          {aCompleter(carte) ? "à saisir" : "à vérifier"}
        </span>
      )}
      <span className={cn(defaussee && "line-through")}>
        {carte.dos ? "" : (carte.valeur ?? "?")}
      </span>
    </>
  );
  const classes = cn(
    "relative flex aspect-[2/3] w-full items-center justify-center rounded-lg text-2xl font-bold shadow",
    famille
      ? FOND[famille]
      : "border-2 border-dashed border-muted-foreground/40 bg-muted text-muted-foreground",
    defaussee && "opacity-40",
    douteuse && "ring-3 ring-orange-500 ring-offset-2 ring-offset-background",
  );
  const nom = `${position} : ${libelle(carte)}${defaussee ? ", colonne défaussée" : ""}${
    carte.doutes?.length ? `, à vérifier (${carte.doutes.join(" ; ")})` : ""
  }`;
  if (!onChoisir)
    return (
      <div role="img" aria-label={nom} className={classes}>
        {contenu}
      </div>
    );
  return (
    <button
      type="button"
      aria-label={`${nom}. Modifier`}
      onClick={onChoisir}
      className={cn(
        classes,
        "cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring active:scale-95 transition-transform",
      )}
    >
      {contenu}
    </button>
  );
};

export default CaseCarte;
