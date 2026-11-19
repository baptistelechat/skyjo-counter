import { del, get, set } from "idb-keyval";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import {
  nomsValides,
  scoreGrille,
  terminee,
  type GrilleSaisie,
  type Partie,
} from "@/lib/partie";

// Partie en cours conservée dans IndexedDB : survit au rechargement et marche hors ligne.
const stockage: StateStorage = {
  getItem: async (cle) => (await get<string>(cle)) ?? null,
  setItem: (cle, valeur) => set(cle, valeur),
  removeItem: (cle) => del(cle),
};

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
        const scores = manche.map((g) => (g ? scoreGrille(g).total : 0));
        setState({
          partie: { ...partie, manches: [...partie.manches, scores] },
          manche: partie.joueurs.map(() => null),
        });
      },
      quitter: () => setState({ partie: null, manche: [] }),
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
