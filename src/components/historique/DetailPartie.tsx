import { ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TableauScores from "@/components/partie/TableauScores";
import { dateCourte } from "@/components/historique/format";
import { versPartie, type PartieArchivee } from "@/lib/historique";

interface Props {
  partie: PartieArchivee;
  onRetour: () => void;
  onSupprimer: (id: string) => void;
}

// Une partie archivée, en lecture seule.
const DetailPartie = ({
  partie,
  onRetour,
  onSupprimer,
}: Props): React.JSX.Element => (
  <div className="flex w-full flex-col gap-4">
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="sm" onClick={onRetour}>
        <ArrowLeft aria-hidden="true" />
        Toutes les parties
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          if (window.confirm("Supprimer cette partie de l'historique ?"))
            onSupprimer(partie.id);
        }}
      >
        <Trash2 aria-hidden="true" />
        Supprimer
      </Button>
    </div>
    <p className="text-sm text-muted-foreground">
      {dateCourte(partie.creeLe)} → {dateCourte(partie.termineeLe)}
      {partie.statut === "abandonnee" && " · partie abandonnée"}
    </p>
    <TableauScores partie={versPartie(partie)} />
  </div>
);

export default DetailPartie;
