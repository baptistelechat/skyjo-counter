import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

// Stockage IndexedDB des stores persistés : survit au rechargement et marche hors ligne.
export const stockage: StateStorage = {
  getItem: async (cle) => (await get<string>(cle)) ?? null,
  setItem: (cle, valeur) => set(cle, valeur),
  removeItem: (cle) => del(cle),
};
