import type { Analyse } from "@/lib/skyjo";
import { motifs, type CarteVerif } from "@/lib/aVerifier";
import CarteLue from "./CarteLue";

interface Props {
  analyse: Analyse;
  photo: string;
  attendu?: number;
  provisoire?: string; // libellé affiché tant que le scan continue
  majs?: ReadonlySet<string>; // positions "ligne-colonne" mises à jour depuis la 1re lecture
}

const GrilleLue = ({ analyse, photo, attendu, provisoire, majs }: Props): React.JSX.Element => {
  const { cartes, score } = analyse;
  const ok = attendu === undefined ? null : attendu === score.total;
  // ponytail: compté ici avec les mêmes critères que les badges, plutôt que via analyse.aVerifier
  const aVerifier = cartes.flatMap((ligne, l) =>
    ligne.flatMap((c: CarteVerif, col) => {
      const m = motifs(c);
      return m.length ? [{ position: `ligne ${l + 1}, colonne ${col + 1}`, motifs: m }] : [];
    }),
  );
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
        <p role="status" aria-live="polite" className="text-sm font-medium">
          {provisoire ? (
            <span className="text-blue-700">⏳ {provisoire}, la grille peut encore changer</span>
          ) : (
            <span className="text-green-700">
              Résultat final{majs?.size ? ` · ${majs.size} carte(s) mise(s) à jour depuis la 1re lecture` : ""}
            </span>
          )}
        </p>
        <p aria-live="polite" className={`text-3xl font-bold ${provisoire ? "opacity-60" : ""}`}>
          Score{provisoire ? " provisoire" : ""} : {score.total}
          {analyse.illisibles > 0 && (
            <span className="ml-2 text-orange-600">partiel</span>
          )}
          {ok !== null && !provisoire && (
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
        <div aria-live="polite" className="text-sm">
          {aVerifier.length === 0 ? (
            <p className="text-green-700">Toutes les cartes semblent bien lues.</p>
          ) : (
            <>
              <p className="font-medium text-orange-600">
                ⚠️ {aVerifier.length} carte{aVerifier.length > 1 ? "s" : ""} à vérifier
              </p>
              <ul className="list-disc pl-5 text-muted-foreground">
                {aVerifier.map(({ position, motifs }) => (
                  <li key={position}>
                    {position} : {motifs.join(" ; ")}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
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
              <CarteLue
                key={`${l}-${col}`}
                carte={c}
                defaussee={score.defaussees.includes(col)}
                maj={majs?.has(`${l}-${col}`) ?? false}
              />
            )),
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Survole une carte pour voir les textes OCR et les alertes.
        </p>
      </div>
    </section>
  );
};

export default GrilleLue;
