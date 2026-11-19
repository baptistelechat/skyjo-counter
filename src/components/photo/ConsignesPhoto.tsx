import { Columns3, Maximize, ScanLine, SunDim } from "lucide-react";

// Leçons des photos réelles : sous ~15 % de largeur par carte, les petits chiffres ne sont plus lus ;
// les reflets et l'ombre du téléphone faussent la couleur, dont dépend la lecture.
const CONSIGNES = [
  { Icone: ScanLine, texte: "De face, téléphone parallèle à la table" },
  { Icone: Maximize, texte: "Assez près : la grille remplit la photo" },
  { Icone: SunDim, texte: "Sans reflet ni ombre du téléphone" },
  { Icone: Columns3, texte: "Cartes un peu écartées" },
];

const ConsignesPhoto = (): React.JSX.Element => (
  <ul
    aria-label="Conseils de prise de vue"
    className="grid w-full max-w-md grid-cols-2 gap-2 text-sm text-muted-foreground"
  >
    {CONSIGNES.map(({ Icone, texte }) => (
      <li key={texte} className="flex items-center gap-2">
        <Icone aria-hidden="true" className="size-4 shrink-0" />
        {texte}
      </li>
    ))}
  </ul>
);

export default ConsignesPhoto;
