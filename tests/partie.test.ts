import { describe, expect, it } from "vitest";
import {
  aCompleter,
  depuisAnalyse,
  familleDe,
  gagnants,
  grilleVide,
  scoreGrille,
  terminee,
  totaux,
  type GrilleSaisie,
  type Partie,
} from "@/lib/partie";
import { resumer, type Carte } from "@/lib/skyjo";

const partie = (manches: number[][]): Partie => ({
  id: "p",
  joueurs: ["A", "B", "C"],
  manches,
  creeLe: 0,
});
const cases = (valeurs: (number | "dos" | null)[][]): GrilleSaisie =>
  valeurs.map((l) =>
    l.map((v) =>
      v === "dos" ? { valeur: null, dos: true } : { valeur: v, dos: false },
    ),
  );

describe("partie", () => {
  it("cumule les manches et s’arrête à 100 points", () => {
    const p = partie([
      [40, 10, 30],
      [55, 20, 35],
    ]);
    expect(totaux(p)).toEqual([95, 30, 65]);
    expect(terminee(p)).toBe(false);
    const fin = partie([...p.manches, [5, 12, 0]]);
    expect(terminee(fin)).toBe(true);
    expect(gagnants(fin)).toEqual([1]);
  });

  it("gère les ex æquo", () => {
    expect(gagnants(partie([[100, 20, 20]]))).toEqual([1, 2]);
  });
});

describe("grille saisie", () => {
  it("compte les dos et cartes à compléter pour 0, défausse les colonnes identiques", () => {
    const g = cases([
      [5, "dos", 12, null],
      [5, -2, 0, 3],
      [5, 4, 1, 3],
    ]);
    expect(scoreGrille(g)).toEqual({ total: 21, defaussees: [0], cachees: 2 });
    expect(g.flat().filter(aCompleter)).toHaveLength(1);
  });

  it("part d’une grille 3 × 4 entièrement à compléter", () => {
    const g = grilleVide();
    expect(g).toHaveLength(3);
    expect(g.flat().every(aCompleter)).toBe(true);
  });

  it("convertit une analyse : dos, carte illisible et doutes", () => {
    const carte = (c: Partial<Carte>): Carte => ({
      boite: [0, 0, 10, 10],
      couleur: "vert",
      valeur: 3,
      textes: [],
      ...c,
    });
    const a = resumer([
      [
        carte({}),
        carte({ couleur: "dos", valeur: null }),
        carte({ couleur: "jaune", valeur: null }),
      ],
    ]);
    const g = depuisAnalyse(a, (c) =>
      c.valeur === null && c.couleur !== "dos" ? ["illisible"] : [],
    );
    expect(g[0].map((c) => [c.valeur, c.dos])).toEqual([
      [3, false],
      [null, true],
      [null, false],
    ]);
    expect(g[0][2].doutes).toEqual(["illisible"]);
  });

  it("donne la couleur imprimée de chaque valeur", () => {
    expect([-2, 0, 4, 5, 12].map(familleDe)).toEqual([
      "bleu foncé",
      "bleu clair",
      "vert",
      "jaune",
      "rouge",
    ]);
  });
});
