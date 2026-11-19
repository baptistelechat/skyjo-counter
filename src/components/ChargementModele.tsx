import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { useChargementModele } from "@/hooks/useChargementModele";

const MO = 1024 * 1024;

// Bandeau de téléchargement du modèle (~21 Mo au premier lancement, puis cache du navigateur).
const ChargementModele = (): React.JSX.Element | null => {
  const { pret, recu, total, erreur } = useChargementModele();
  if (pret) return null;
  if (erreur)
    return (
      <p
        role="alert"
        className="w-full rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
      >
        Le modèle de lecture n'a pas pu se charger : {erreur}. La saisie à la
        main reste possible.
      </p>
    );
  const pourcent = total ? Math.round((recu / total) * 100) : null;
  return (
    <div className="w-full rounded-lg bg-muted/50 p-3">
      <Progress
      value={pourcent}
      
        aria-label="Chargement du modèle de lecture"
      >
        <ProgressLabel>Chargement du modèle de lecture</ProgressLabel>
        <ProgressValue>
          {() =>
            total
              ? `${(recu / MO).toFixed(1)} / ${(total / MO).toFixed(1)} Mo`
              : "…"
          }
        </ProgressValue>
      </Progress>
    </div>
  );
};

export default ChargementModele;
