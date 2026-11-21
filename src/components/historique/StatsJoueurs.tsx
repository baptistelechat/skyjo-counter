import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { nombre } from "@/components/historique/format";
import type { StatJoueur } from "@/lib/historique";

interface Props {
  stats: StatJoueur[];
}

// Une ligne par joueur (prénom normalisé : espaces et casse ignorés).
const StatsJoueurs = ({ stats }: Props): React.JSX.Element => {
  if (!stats.length)
    return (
      <p className="py-8 text-center text-muted-foreground">
        Les statistiques apparaîtront après la première partie archivée.
      </p>
    );
  return (
    <section aria-labelledby="titre-stats" className="w-full">
      <h2 id="titre-stats" className="sr-only">
        Statistiques par joueur
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Joueur</TableHead>
            <TableHead scope="col" className="text-right">
              Victoires
            </TableHead>
            <TableHead scope="col" className="text-right">
              Moy./manche
            </TableHead>
            <TableHead scope="col" className="text-right">
              Meilleure / pire
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((s) => (
            <TableRow key={s.nom}>
              <TableHead scope="row">{s.nom}</TableHead>
              <TableCell className="text-right tabular-nums">
                {s.victoires}/{s.parties}
                <span className="block text-xs text-muted-foreground">
                  {s.parties ? `${Math.round(s.tauxVictoire * 100)} %` : "–"}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {nombre(s.scoreMoyen)}
                <span className="block text-xs text-muted-foreground">
                  {s.manches} manche{s.manches > 1 ? "s" : ""}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {nombre(s.meilleure, 0)} / {nombre(s.pire, 0)}
                <span className="block text-xs text-muted-foreground">
                  {s.manchesParPartie === null
                    ? "–"
                    : `${nombre(s.manchesParPartie)} manches/partie`}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="mt-2 text-xs text-muted-foreground">
        Victoires sur les parties terminées. Les manches des parties abandonnées
        comptent dans les moyennes.
      </p>
    </section>
  );
};

export default StatsJoueurs;
