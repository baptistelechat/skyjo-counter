import { motifs, type CarteVerif } from "./aVerifier";
import type { Couleur } from "@/lib/skyjo/couleur";

const FOND: Record<NonNullable<Couleur>, string> = {
  rouge: "bg-red-600 text-white",
  jaune: "bg-yellow-400 text-black",
  vert: "bg-green-600 text-white",
  "bleu clair": "bg-cyan-300 text-black",
  "bleu foncé": "bg-blue-900 text-white",
  dos: "bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] text-white",
};

interface Props {
  carte: CarteVerif;
  defaussee: boolean;
  maj: boolean; // valeur ou couleur changée depuis la 1re lecture
}

const CarteLue = ({ carte: c, defaussee, maj }: Props): React.JSX.Element => {
  const aVerifier = motifs(c);
  const texteOcr = `Textes OCR : ${c.textes.join(" · ") || "aucun"}`;
  return (
    <div
      role="cell"
      title={
        aVerifier.length
          ? `À vérifier : ${aVerifier.join(" ; ")}\n${texteOcr}`
          : texteOcr
      }
      className={`relative flex aspect-[2/3] flex-col items-center justify-center rounded-lg text-2xl font-bold shadow ${
        c.couleur ? FOND[c.couleur] : "bg-muted"
      } ${defaussee ? "line-through opacity-40" : ""} ${
        aVerifier.length
          ? "ring-4 ring-orange-500 ring-offset-2 ring-offset-background"
          : ""
      }`}
    >
      {aVerifier.length > 0 && (
        <span className="absolute -top-2 rounded-full bg-orange-500 px-1.5 text-[10px] font-semibold text-white no-underline">
          à vérifier
        </span>
      )}
      {maj && (
        <span className="absolute -bottom-2 rounded-full bg-blue-600 px-1.5 text-[10px] font-semibold text-white no-underline">
          mise à jour
        </span>
      )}
      {c.valeur ?? (c.couleur === "dos" ? "?" : "⚠️")}
      <span className="text-[10px] font-normal opacity-80">
        {c.boite ? (c.couleur ?? "couleur ?") : "non détectée"}
      </span>
    </div>
  );
};

export default CarteLue;
