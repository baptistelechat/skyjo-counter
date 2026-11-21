import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  alleger,
  nomsValides,
  scoreGrille,
  terminee,
  type GrilleSaisie,
  type Partie,
} from "@/lib/partie";
import { useHistorique } from "@/store/historique";
import { stockage } from "@/store/stockage";

interface PartieState {
  partie: Partie | null;
  manche: (GrilleSaisie | null)[]; // grilles de la manche en cours, une par joueur (null : pas encore saisie)
  hydrate: boolean;
  creer: (noms: string[]) => void;
  enregistrer: (joueur: number, grille: GrilleSaisie) => void;
  effacer: (joueur: number) => void;
  validerManche: () => void;
  quitter: () => void;
}

// Une partie terminée est archivée dès sa dernière manche ; abandonnée, au moment de la quitter
// (si au moins une manche a été jouée).
const archiverSiBesoin = (p: Partie) => {
  const { historique, archiver } = useHistorique.getState();
  if (historique.parties.some((x) => x.id === p.id)) return;
  if (terminee(p)) archiver(p, "terminee");
  else if (p.manches.length) archiver(p, "abandonnee");
};

export const usePartie = create<PartieState>()(
  persist(
    (setState, getState) => ({
      partie: null,
      manche: [],
      hydrate: false,
      creer: (noms) => {
        const joueurs = nomsValides(noms);
        setState({
          partie: {
            id: crypto.randomUUID(),
            joueurs,
            manches: [],
            grilles: [],
            creeLe: Date.now(),
          },
          manche: joueurs.map(() => null),
        });
      },
      enregistrer: (joueur, grille) =>
        setState(({ manche }) => ({
          manche: manche.map((g, j) => (j === joueur ? grille : g)),
        })),
      effacer: (joueur) =>
        setState(({ manche }) => ({
          manche: manche.map((g, j) => (j === joueur ? null : g)),
        })),
      validerManche: () => {
        const { partie, manche } = getState();
        if (!partie || manche.some((g) => !g)) return;
        const grilles = manche.filter((g): g is GrilleSaisie => g !== null);
        const suite: Partie = {
          ...partie,
          manches: [
            ...partie.manches,
            grilles.map((g) => scoreGrille(g).total),
          ],
          grilles: [...(partie.grilles ?? []), grilles.map(alleger)],
        };
        setState({ partie: suite, manche: partie.joueurs.map(() => null) });
        if (terminee(suite)) archiverSiBesoin(suite);
      },
      quitter: () => {
        const { partie } = getState();
        if (partie) archiverSiBesoin(partie);
        setState({ partie: null, manche: [] });
      },
    }),
    {
      name: "skyjo-scan:partie",
      storage: createJSONStorage(() => stockage),
      partialize: ({ partie, manche }) => ({ partie, manche }),
      onRehydrateStorage: () => () => usePartie.setState({ hydrate: true }),
    },
  ),
);

export const partieTerminee = (p: Partie | null): boolean =>
  Boolean(p && terminee(p));
