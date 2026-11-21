import { useMemo, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChargementModele from "@/components/ChargementModele";
import EcranHistorique from "@/components/historique/EcranHistorique";
import { useChargementModele } from "@/hooks/useChargementModele";
import Manche from "@/components/partie/Manche";
import NouvellePartie from "@/components/partie/NouvellePartie";
import SaisieJoueur from "@/components/partie/SaisieJoueur";
import TableauScores from "@/components/partie/TableauScores";
import MoteurTest from "@/debug/MoteurTest";
import { joueursConnus } from "@/lib/historique";
import { terminee } from "@/lib/partie";
import { useHistorique } from "@/store/historique";
import { usePartie } from "@/store/partie";

const Jeu = (): React.JSX.Element | null => {
  const {
    partie,
    manche,
    hydrate,
    creer,
    enregistrer,
    effacer,
    validerManche,
    quitter,
  } = usePartie();
  const { pret } = useChargementModele(); // démarre le téléchargement du modèle dès l'ouverture
  const [joueur, setJoueur] = useState<number | null>(null);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);
  const { historique, hydrate: historiqueHydrate } = useHistorique();
  const connus = useMemo(() => joueursConnus(historique), [historique]);

  if (!hydrate || !historiqueHydrate) return null;
  if (historiqueOuvert)
    return <EcranHistorique onRetour={() => setHistoriqueOuvert(false)} />;
  if (!partie)
    return (
      <NouvellePartie
        onCreer={creer}
        connus={connus}
        onHistorique={() => setHistoriqueOuvert(true)}
      />
    );

  if (joueur !== null)
    return (
      <SaisieJoueur
        key={joueur}
        joueur={partie.joueurs[joueur]}
        initiale={manche[joueur]}
        moteurPret={pret}
        onRetour={() => setJoueur(null)}
        onValider={(g) => {
          enregistrer(joueur, g);
          setJoueur(null);
        }}
      />
    );

  const fin = terminee(partie);
  const nouvelle = () => {
    if (
      fin ||
      window.confirm(
        "Abandonner la partie en cours ? Elle sera rangée dans l'historique comme abandonnée.",
      )
    )
      quitter();
  };
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col items-center gap-5 p-4">
      <header className="flex w-full items-center justify-between">
        <h1 className="font-heading text-3xl text-primary">Skyjo Scan</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Historique et statistiques"
            onClick={() => setHistoriqueOuvert(true)}
          >
            <History aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={nouvelle}>
            <RotateCcw aria-hidden="true" />
            Nouvelle partie
          </Button>
        </div>
      </header>
      <ChargementModele />
      <TableauScores partie={partie} />
      {!fin && (
        <Manche
          partie={partie}
          manche={manche}
          onOuvrir={setJoueur}
          onEffacer={effacer}
          onValider={validerManche}
        />
      )}
    </main>
  );
};

const App = (): React.JSX.Element | null =>
  new URLSearchParams(location.search).has("debug") ? <MoteurTest /> : <Jeu />;

export default App;
