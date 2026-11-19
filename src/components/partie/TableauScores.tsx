import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { gagnants, LIMITE, terminee, totaux, type Partie } from "@/lib/partie";

interface Props {
  partie: Partie;
}

// Cumul par manche (une ligne par manche), total en pied de tableau. Gagnant = plus petit total.
const TableauScores = ({ partie }: Props): React.JSX.Element => {
  const t = totaux(partie);
  const fin = terminee(partie);
  const premiers = gagnants(partie);
  return (
    <section aria-labelledby="titre-scores" className="w-full">
      <h2 id="titre-scores" className="sr-only">
        Tableau des scores
      </h2>
      {fin && (
        <p
          role="status"
          className="mb-3 rounded-lg bg-green-100 p-3 text-center font-semibold text-green-900"
        >
          🏆 Partie terminée :{" "}
          {premiers.map((j) => partie.joueurs[j]).join(" et ")}{" "}
          {premiers.length > 1 ? "gagnent" : "gagne"} avec {t[premiers[0]]}{" "}
          points
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Manche</TableHead>
            {partie.joueurs.map((nom) => (
              <TableHead key={nom} scope="col" className="text-right">
                {nom}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {partie.manches.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={partie.joueurs.length + 1}
                className="text-center text-muted-foreground"
              >
                Aucune manche jouée
              </TableCell>
            </TableRow>
          )}
          {partie.manches.map((scores, m) => (
            <TableRow key={m}>
              <TableHead scope="row">{m + 1}</TableHead>
              {scores.map((s, j) => (
                <TableCell key={j} className="text-right tabular-nums">
                  {s}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead scope="row">Total</TableHead>
            {t.map((total, j) => (
              <TableCell key={j} className="text-right font-bold tabular-nums">
                <span className={fin && premiers.includes(j) ? 'text-green-700' : total >= LIMITE ? 'text-destructive' : ''}>
                  {total}
                </span>
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
      {!fin && (
        <p className="mt-2 text-xs text-muted-foreground">
          Fin de partie dès qu'un joueur atteint {LIMITE} points.
        </p>
      )}
    </section>
  );
};

export default TableauScores;
