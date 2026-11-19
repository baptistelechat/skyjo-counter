import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { familleCarte, type Couleur } from "../src/lib/skyjo/couleur";
import { grilleDeBoites, type Mirage } from "../src/lib/skyjo/grille";
import { chargerPixels } from "./pixels";

// Couleur de chaque carte, sur les pixels de l'image analysée par l'app, comparée à celle que donne la valeur
// de verite.json (null = dos). Vérifie aussi que l'image reconstruite en Node a les dimensions de meta.image.

const fx = (f: string) => new URL(`./fixtures/${f}`, import.meta.url);
const lire = <T>(f: string): T => JSON.parse(readFileSync(fx(f), "utf8")) as T;
const verite =
  lire<Record<string, { grille: (number | null)[][] }>>("verite.json");

const attendue = (v: number | null): Couleur =>
  v === null
    ? "dos"
    : v < 0
      ? "bleu foncé"
      : v === 0
        ? "bleu clair"
        : v <= 4
          ? "vert"
          : v <= 8
            ? "jaune"
            : "rouge";

// reel-61-mwmoejrg : Mirage rate la 2e colonne, grilleDeBoites décale les colonnes 3-4 vers 2-3 (bug de grille,
// pas de couleur : la couleur lue est bien celle de la carte sous la boîte). On ne compare que la 1re colonne.
const COLONNES: Record<string, number> = { "reel-61-mwmoejrg": 1 };

describe("familleCarte sur les photos", () => {
  it.each(Object.keys(verite))(
    "%s",
    (nom) => {
      const { image, attendue: dims } = chargerPixels(nom);
      if (dims) expect([image.width, image.height]).toEqual(dims);
      const m = lire<Mirage>(
        `${nom}.${nom.startsWith("grille") ? "mirage" : "wasm"}.json`,
      );
      const lues = grilleDeBoites(m, image.width / image.height).map((l) =>
        l
          .slice(0, COLONNES[nom])
          .map((b) =>
            b ? familleCarte(image.rgba, image.width, image.height, b) : null,
          ),
      );
      expect(lues).toEqual(
        verite[nom].grille.map((l) => l.slice(0, COLONNES[nom]).map(attendue)),
      );
    },
    30_000,
  );
});
