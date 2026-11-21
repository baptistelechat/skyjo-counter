import { describe, expect, it } from "vitest";
import {
  ajouter,
  archiver,
  cleJoueur,
  exporter,
  fusionner,
  historiqueVide,
  joueursConnus,
  lireExport,
  statsJoueurs,
  supprimer,
  VERSION_HISTORIQUE,
  type Historique,
} from "@/lib/historique";
import { alleger, type Partie } from "@/lib/partie";

const partie = (
  id: string,
  joueurs: string[],
  manches: number[][],
  creeLe = 0,
): Partie => ({ id, joueurs, manches, creeLe });

// Trois parties : Alice gagne la 1re, Bob la 2e, la 3e est abandonnée.
const fictif = (): Historique => {
  let h = historiqueVide();
  h = ajouter(
    h,
    archiver(
      partie(
        "p1",
        ["Alice", "Bob"],
        [
          [10, 60],
          [5, 45],
        ],
      ),
      "terminee",
      1000,
    ),
  );
  h = ajouter(
    h,
    archiver(
      partie(
        "p2",
        [" alice ", "BOB", "Chloé"],
        [
          [50, 0, 30],
          [60, -2, 80],
        ],
      ),
      "terminee",
      2000,
    ),
  );
  h = ajouter(
    h,
    archiver(partie("p3", ["Alice", "Chloé"], [[12, 7]]), "abandonnee", 3000),
  );
  return h;
};

describe("historique", () => {
  it("archive une partie avec son statut et ses gagnants", () => {
    const h = fictif();
    expect(h.version).toBe(VERSION_HISTORIQUE);
    expect(h.parties.map((p) => p.id)).toEqual(["p3", "p2", "p1"]);
    expect(h.parties[2].gagnants).toEqual([0]); // Alice : 15 contre 105
    expect(h.parties[1].gagnants).toEqual([1]); // Bob : -2
    expect(h.parties[0].gagnants).toEqual([]); // abandonnée
  });

  it("remplace une partie archivée deux fois et en supprime une", () => {
    const h = fictif();
    const re = ajouter(
      h,
      archiver(partie("p1", ["Alice", "Bob"], [[10, 60]]), "abandonnee", 4000),
    );
    expect(re.parties).toHaveLength(3);
    expect(re.parties[0].id).toBe("p1");
    expect(supprimer(h, "p2").parties.map((p) => p.id)).toEqual(["p3", "p1"]);
  });

  it("garde les grilles sans les doutes du scan", () => {
    const grille = alleger([[{ valeur: 5, dos: false, doutes: ["flou"] }]]);
    expect(grille).toEqual([[{ valeur: 5, dos: false }]]);
    const p = {
      ...partie("g", ["A", "B"], [[5, 0]]),
      grilles: [[grille, grille]],
    };
    expect(archiver(p, "abandonnee").grilles).toEqual([[grille, grille]]);
    expect(
      archiver(partie("x", ["A", "B"], []), "abandonnee"),
    ).not.toHaveProperty("grilles");
  });

  it("propose les joueurs connus, regroupés par prénom normalisé", () => {
    expect(cleJoueur("  ALICE ")).toBe("alice");
    // Alice : 3 parties (orthographe la plus récente « Alice »), Bob et Chloé : 2.
    expect(joueursConnus(fictif())).toEqual(["Alice", "BOB", "Chloé"]);
  });

  it("calcule les stats par joueur (abandons : manches oui, victoires non)", () => {
    const stats = statsJoueurs(fictif());
    const alice = stats.find((s) => s.nom === "Alice");
    expect(alice).toEqual({
      nom: "Alice",
      parties: 2,
      victoires: 1,
      tauxVictoire: 0.5,
      manches: 5,
      scoreMoyen: (10 + 5 + 50 + 60 + 12) / 5,
      meilleure: 5,
      pire: 60,
      manchesParPartie: 2,
    });
    const chloe = stats.find((s) => s.nom === "Chloé");
    expect(chloe?.parties).toBe(1);
    expect(chloe?.victoires).toBe(0);
    expect(chloe?.manches).toBe(3);
    expect(chloe?.meilleure).toBe(7);
  });

  it("redonne le même historique après export puis import", () => {
    const h = fictif();
    expect(lireExport(exporter(h))).toEqual(h);
    const { historique, ajoutees } = fusionner(
      historiqueVide(),
      lireExport(exporter(h)),
    );
    expect(historique).toEqual(h);
    expect(ajoutees).toBe(3);
    expect(fusionner(h, h).ajoutees).toBe(0);
  });

  it("refuse un fichier qui n'est pas un historique", () => {
    expect(() => lireExport("pas du json")).toThrow(/JSON/);
    expect(() => lireExport('{"version":1}')).toThrow(/historique/);
    expect(() => lireExport('{"version":2,"parties":[]}')).toThrow(/récente/);
    expect(() =>
      lireExport('{"version":1,"parties":[{"id":"x","joueurs":["A"]}]}'),
    ).toThrow(/illisibles/);
  });
});
