import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  ajouter,
  archiver,
  fusionner,
  historiqueVide,
  supprimer,
  type Historique,
  type Statut,
} from "@/lib/historique";
import type { Partie } from "@/lib/partie";
import { stockage } from "@/store/stockage";

interface HistoriqueState {
  historique: Historique;
  hydrate: boolean;
  archiver: (p: Partie, statut: Statut) => void;
  supprimer: (id: string) => void;
  importer: (h: Historique) => number; // nombre de parties ajoutées
}

// Clé séparée de la partie en cours : vider l'une ne touche pas l'autre.
export const useHistorique = create<HistoriqueState>()(
  persist(
    (setState, getState) => ({
      historique: historiqueVide(),
      hydrate: false,
      archiver: (p, statut) =>
        setState(({ historique }) => ({
          historique: ajouter(historique, archiver(p, statut)),
        })),
      supprimer: (id) =>
        setState(({ historique }) => ({
          historique: supprimer(historique, id),
        })),
      importer: (h) => {
        const { historique, ajoutees } = fusionner(getState().historique, h);
        setState({ historique });
        return ajoutees;
      },
    }),
    {
      name: "skyjo-scan:historique",
      storage: createJSONStorage(() => stockage),
      partialize: ({ historique }) => ({ historique }),
      onRehydrateStorage: () => () => useHistorique.setState({ hydrate: true }),
    },
  ),
);
