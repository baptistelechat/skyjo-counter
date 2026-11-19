import { estIllisible, type Carte } from '@/lib/skyjo'

// Champs ajoutés en parallèle à Carte (src/lib/skyjo) : lus de façon tolérante pour compiler avant et après.
export type CarteVerif = Carte & { confiance?: number; alertes?: string[] };

const SEUIL_CONFIANCE = 0.5;

// Motifs de vérification d'une carte : vide = carte sûre.
export const motifs = (c: CarteVerif): string[] => [
  ...(estIllisible(c)
    ? [c.boite ? "chiffre non lu, compté 0" : "carte non détectée, comptée 0"]
    : []),
  ...(c.confiance !== undefined && c.confiance < SEUIL_CONFIANCE
    ? [`confiance faible (${Math.round(c.confiance * 100)} %)`]
    : []),
  ...(c.alertes ?? []),
];
