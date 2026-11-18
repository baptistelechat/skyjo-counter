import type { Couleur } from "@/lib/skyjo/couleur";
import type { Analyse } from "@/lib/skyjo";

const FOND: Record<NonNullable<Couleur>, string> = {
  rouge: "bg-red-600 text-white",
  jaune: "bg-yellow-400 text-black",
  vert: "bg-green-600 text-white",
  "bleu clair": "bg-cyan-300 text-black",
  "bleu foncé": "bg-blue-900 text-white",
  dos: "bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] text-white",
};

interface Props {
  analyse: Analyse;
  photo: string;
  attendu?: number;
}

const GrilleLue = ({ analyse, photo, attendu }: Props): React.JSX.Element => {
  const { cartes, score } = analyse;
  const ok = attendu === undefined ? null : attendu === score.total;
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <figure className="relative">
        <img
          src={photo}
          alt="Grille Skyjo analysée, cartes détectées encadrées"
          className="w-full rounded"
        />
        {cartes
          .flat()
          .flatMap(({ boite }) => (boite ? [boite] : []))
          .map(([x1, y1, x2, y2]) => (
            <div
              key={`${x1}-${y1}`}
              aria-hidden="true"
              className="absolute border-2 border-fuchsia-500"
              style={{
                left: `${x1 / 10}%`,
                top: `${y1 / 10}%`,
                width: `${(x2 - x1) / 10}%`,
                height: `${(y2 - y1) / 10}%`,
              }}
            />
          ))}
      </figure>

      <div className="space-y-3">
        <p aria-live="polite" className="text-3xl font-bold">
          Score : {score.total}
          {analyse.illisibles > 0 && (
            <span className="ml-2 text-orange-600">partiel</span>
          )}
          {ok !== null && (
            <span className={ok ? "ml-2 text-green-600" : "ml-2 text-red-600"}>
              {ok ? "✅" : `❌ attendu ${attendu}`}
            </span>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          {cartes.flat().filter((c) => c.boite).length} cartes détectées ·{" "}
          {score.cachees} cachée(s)
          {score.defaussees.length > 0 &&
            ` · colonne(s) ${score.defaussees.map((c) => c + 1).join(", ")} défaussée(s)`}
        </p>
        {analyse.illisibles > 0 && (
          <p role="alert" className="text-sm font-medium text-orange-600">
            ⚠️ {analyse.illisibles} carte(s) non détectée(s) ou sans chiffre lu,
            comptée(s) 0 : à corriger à la main (E3)
          </p>
        )}
        <div
          role="table"
          aria-label="Grille lue"
          className="grid max-w-sm gap-2"
          style={{
            gridTemplateColumns: `repeat(${cartes[0]?.length ?? 4}, minmax(0, 1fr))`,
          }}
        >
          {cartes.flatMap((ligne, l) =>
            ligne.map((c, col) => (
              <div
                key={`${l}-${col}`}
                role="cell"
                title={`Textes OCR : ${c.textes.join(" · ") || "aucun"}`}
                className={`flex aspect-[2/3] flex-col items-center justify-center rounded-lg text-2xl font-bold shadow ${
                  c.couleur ? FOND[c.couleur] : "bg-muted"
                } ${score.defaussees.includes(col) ? "line-through opacity-40" : ""} ${
                  c.valeur === null && c.couleur !== "dos"
                    ? "ring-4 ring-orange-500"
                    : ""
                }`}
              >
                {c.valeur ?? (c.couleur === "dos" ? "?" : "⚠️")}
                <span className="text-[10px] font-normal opacity-80">
                  {c.boite ? (c.couleur ?? "couleur ?") : "non détectée"}
                </span>
              </div>
            )),
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Survole une carte pour voir les textes OCR qu'elle contient.
        </p>
      </div>
    </section>
  );
};

export default GrilleLue;
