import { ChevronRight } from "lucide-react";
import type { PartieArchivee } from "@/lib/historique";
import { dateCourte } from "@/components/historique/format";

interface Props {
  parties: PartieArchivee[];
  onOuvrir: (id: string) => void;
}

// Parties archivées, de la plus récente à la plus ancienne.
const ListeParties = ({ parties, onOuvrir }: Props): React.JSX.Element => {
  if (!parties.length)
    return (
      <p className="py-8 text-center text-muted-foreground">
        Aucune partie archivée pour l'instant. Les parties terminées ou
        abandonnées apparaîtront ici.
      </p>
    );
  return (
    <ul className="flex flex-col gap-2">
      {parties.map((p) => {
        const gagnants = p.gagnants.map((j) => p.joueurs[j]).join(" et ");
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOuvrir(p.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-l-3 border-l-destructive bg-card p-3 text-left text-card-foreground transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-mono text-xs text-muted-foreground">
                  {dateCourte(p.termineeLe)} · {p.manches.length} manche
                  {p.manches.length > 1 ? "s" : ""}
                </span>
                <span className="truncate font-heading text-lg leading-tight">
                  {p.joueurs.join(", ")}
                </span>
                <span className="text-sm">
                  {p.statut === "terminee" ? (
                    <>🏆 {gagnants}</>
                  ) : (
                    <span className="text-muted-foreground">Abandonnée</span>
                  )}
                </span>
              </div>
              <ChevronRight
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ListeParties;
