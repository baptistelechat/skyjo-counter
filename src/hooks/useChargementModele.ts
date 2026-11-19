import { useSyncExternalStore } from 'react'
import { etatChargement, suivreChargement, type Chargement } from '@/lib/moteur'

// État du téléchargement moteur + modèle ; le premier appel démarre le worker.
export const useChargementModele = (): Chargement => useSyncExternalStore(suivreChargement, etatChargement)
