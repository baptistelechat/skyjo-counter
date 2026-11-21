import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import DetailPartie from "@/components/historique/DetailPartie";
import ExportImport from "@/components/historique/ExportImport";
import ListeParties from "@/components/historique/ListeParties";
import StatsJoueurs from "@/components/historique/StatsJoueurs";
import { statsJoueurs } from "@/lib/historique";
import { useHistorique } from "@/store/historique";

type Onglet = "parties" | "joueurs";

interface Props {
  onRetour: () => void;
}

// Historique des parties et statistiques par joueur.
const EcranHistorique = ({ onRetour }: Props): React.JSX.Element => {
  const { historique, supprimer, importer } = useHistorique();
  const [onglet, setOnglet] = useState<Onglet>("parties");
  const [ouverte, setOuverte] = useState<string | null>(null);
  const stats = useMemo(() => statsJoueurs(historique), [historique]);
  const partie = historique.parties.find((p) => p.id === ouverte);

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-5 p-4">
      <header className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Retour à la partie"
          onClick={onRetour}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold">Historique</h1>
      </header>

      {partie ? (
        <DetailPartie
          partie={partie}
          onRetour={() => setOuverte(null)}
          onSupprimer={(id) => {
            supprimer(id);
            setOuverte(null);
          }}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Vue">
            {(
              [
                ["parties", `Parties (${historique.parties.length})`],
                ["joueurs", "Joueurs"],
              ] as const
            ).map(([id, libelle]) => (
              <Button
                key={id}
                variant={onglet === id ? "default" : "outline"}
                aria-pressed={onglet === id}
                onClick={() => setOnglet(id)}
              >
                {libelle}
              </Button>
            ))}
          </div>
          {onglet === "parties" ? (
            <ListeParties parties={historique.parties} onOuvrir={setOuverte} />
          ) : (
            <StatsJoueurs stats={stats} />
          )}
          <ExportImport historique={historique} onImporter={importer} />
        </>
      )}
    </main>
  );
};

export default EcranHistorique;
