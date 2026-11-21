import { FAMILLES, type Famille } from "@/lib/skyjo/couleur";
import type { Analyse } from "@/lib/skyjo";
import { score, type Grille, type Score } from "@/lib/skyjo/score";

export const LIMITE = 100;
export const JOUEURS_MIN = 2;
export const JOUEURS_MAX = 8;
export const LIGNES = 3;
export const COLONNES = 4;

// Une case de la grille d'un joueur, telle que validée (après scan et/ou correction).
export interface CaseSaisie {
  valeur: number | null; // null : dos, ou chiffre encore inconnu
  dos: boolean;
  doutes?: string[]; // motifs du scan pour lesquels la case mérite un coup d'œil
}
export type GrilleSaisie = CaseSaisie[][];

// Grille gardée après validation : seulement les valeurs, jamais les doutes du scan ni la photo.
export type CaseArchivee = Pick<CaseSaisie, "valeur" | "dos">;
export type GrilleArchivee = CaseArchivee[][];

export interface Partie {
  id: string;
  joueurs: string[];
  manches: number[][]; // manches[m][j] = score du joueur j à la manche m
  grilles?: GrilleArchivee[][]; // grilles[m][j] = grille corrigée du joueur j à la manche m (absent avant E5)
  creeLe: number;
}

export const alleger = (g: GrilleSaisie): GrilleArchivee =>
  g.map((l) => l.map(({ valeur, dos }) => ({ valeur, dos })));

// --- Grille saisie ---

export const grilleVide = (colonnes = COLONNES): GrilleSaisie =>
  Array.from({ length: LIGNES }, () =>
    Array.from({ length: colonnes }, () => ({ valeur: null, dos: false })),
  );

export const aCompleter = (c: CaseSaisie): boolean =>
  c.valeur === null && !c.dos;

// Grille scannée → grille saisie. Une carte non lue reste à compléter (comptée 0 tant qu'elle ne l'est pas).
export const depuisAnalyse = (
  a: Analyse,
  motifs: (c: Analyse["cartes"][number][number]) => string[],
): GrilleSaisie =>
  a.cartes.map((ligne) =>
    ligne.map((c) => {
      const doutes = motifs(c);
      return {
        valeur: c.valeur,
        dos: c.couleur === "dos" && c.valeur === null,
        ...(doutes.length ? { doutes } : {}),
      };
    }),
  );

export const versGrille = (g: GrilleSaisie): Grille =>
  g.map((l) => l.map((c) => c.valeur));

export const scoreGrille = (g: GrilleSaisie): Score => score(versGrille(g));

// Couleur imprimée sur une carte de cette valeur (dos : null).
export const familleDe = (valeur: number): Famille | null =>
  (Object.keys(FAMILLES) as Famille[]).find((f) =>
    FAMILLES[f].valeurs.includes(valeur),
  ) ?? null;

// --- Partie ---

export const totaux = (p: Partie): number[] =>
  p.joueurs.map((_, j) => p.manches.reduce((s, m) => s + (m[j] ?? 0), 0));

export const terminee = (p: Partie): boolean =>
  totaux(p).some((t) => t >= LIMITE);

// Le plus petit total gagne (ex æquo possibles).
export const gagnants = (p: Partie): number[] => {
  const t = totaux(p);
  const min = Math.min(...t);
  return t.flatMap((v, j) => (v === min ? [j] : []));
};

export const nomsValides = (noms: string[]): string[] =>
  noms.map((n) => n.trim()).filter(Boolean);
