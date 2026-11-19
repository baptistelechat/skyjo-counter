import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { analyser, type Mirage } from "../src/lib/skyjo";
import { score, type Grille } from "../src/lib/skyjo/score";
import { chargerPixels } from "./pixels";

// Banc de mesure carte par carte : JSON Mirage des fixtures → analyser → comparé à la vérité transcrite à la main
// dans fixtures/verite.json. Instrument de mesure, pas un test d'exigence. Mesuré deux fois : sans pixels
// (couleur = null, OCR seul) et avec les pixels de l'image analysée (tests/pixels.ts), comme dans l'app.

// Seuils de non-régression = taux de cartes justes mesurés le 19/11/2026 (lecture.ts en cours de modification).
// Remonter quand ça s'améliore.
const TAUX_MIN = 0.86; // sans pixels : 124/144
const TAUX_MIN_PIXELS = 0.9; // avec pixels, familleCarte recalibrée : 131/144

const fx = (f: string) => new URL(`./fixtures/${f}`, import.meta.url);
const lireJson = <T>(f: string): T =>
  JSON.parse(readFileSync(fx(f), "utf8")) as T;

const verite =
  lireJson<Record<string, { grille: Grille; doutes: string[] }>>("verite.json");

// Le JSON Mirage d'une fixture reel-* porte sur l'image analysée (meta.image, déjà tournée/recadrée) : même orientation
// que la vérité (vérifié sur reel-61-mwmo01e1, tournée). Ratio des photos du POC repris de grille.test.ts.
const RATIO_POC: Record<string, number> = {
  "grille-moins1": 1,
  "grille-21": 1,
  "grille-6": 2147 / 2392,
};
const charger = (
  nom: string,
): { m: Mirage; ratio: number; attendu: number } | null => {
  if (nom in RATIO_POC) {
    const attendu = Number(nom.replace("grille-", "").replace("moins", "-"));
    return {
      m: lireJson<Mirage>(`${nom}.mirage.json`),
      ratio: RATIO_POC[nom],
      attendu,
    };
  }
  if (!existsSync(fx(`${nom}.wasm.json`))) return null;
  const meta = lireJson<{ attendu: number; image: [number, number] }>(
    `${nom}.meta.json`,
  );
  return {
    m: lireJson<Mirage>(`${nom}.wasm.json`),
    ratio: meta.image[0] / meta.image[1],
    attendu: meta.attendu,
  };
};

interface Ligne {
  fixture: string;
  justes: number;
  fausses: number; // carte détectée, valeur lue ≠ vérité
  nonLues: number; // carte détectée mais aucun chiffre lisible (vérité = valeur visible)
  nonDetectees: number; // case sans boîte Mirage
  scoreLu: number;
  attendu: number;
  erreurs: string;
}

const mesurer = (nom: string, pixels: boolean): Ligne | null => {
  const f = charger(nom);
  if (!f) return null;
  const vraie = verite[nom].grille;
  const img = pixels ? chargerPixels(nom).image : null;
  const { cartes, score: s } = img
    ? analyser(f.m, img.rgba, img.width, img.height)
    : analyser(f.m, null, f.ratio, 1);
  const l: Ligne = {
    fixture: nom,
    justes: 0,
    fausses: 0,
    nonLues: 0,
    nonDetectees: 0,
    scoreLu: s.total,
    attendu: f.attendu,
    erreurs: "",
  };
  const erreurs: string[] = [];
  vraie.forEach((ligne, i) =>
    ligne.forEach((v, j) => {
      const c = cartes[i]?.[j];
      const lu = c?.valeur ?? null;
      if (lu === v) return void l.justes++;
      const ou = `l${i + 1}c${j + 1}`;
      if (!c?.boite) {
        l.nonDetectees++;
        erreurs.push(`${ou} non détectée (${v})`);
      } else if (lu === null) {
        l.nonLues++;
        erreurs.push(`${ou} ${v} non lue [${c.textes.join(",")}]`);
      } else {
        l.fausses++;
        erreurs.push(`${ou} ${v}→${lu} [${c.textes.join(",")}]`);
      }
    }),
  );
  l.erreurs = erreurs.join(" ; ");
  return l;
};

describe("banc de mesure carte par carte", () => {
  it.each(Object.keys(verite))(
    "la vérité de %s donne le score attendu",
    (nom) => {
      const f = charger(nom);
      if (f) expect(score(verite[nom].grille).total).toBe(f.attendu);
    },
  );

  it.each([
    ["sans pixels", false, TAUX_MIN],
    ["avec pixels", true, TAUX_MIN_PIXELS],
  ] as const)("mesure les fixtures %s et ne régresse pas", (_, pixels, tauxMin) => {
    const lignes = Object.keys(verite).flatMap((n) => mesurer(n, pixels) ?? []);
    const somme = (k: "justes" | "fausses" | "nonLues" | "nonDetectees") =>
      lignes.reduce((a, l) => a + l[k], 0);
    const total = {
      justes: somme("justes"),
      fausses: somme("fausses"),
      nonLues: somme("nonLues"),
      nonDetectees: somme("nonDetectees"),
    };
    const cartes = lignes.length * 12;
    const scoresJustes = lignes.filter((l) => l.scoreLu === l.attendu).length;
    console.table(lignes, [
      "fixture",
      "justes",
      "fausses",
      "nonLues",
      "nonDetectees",
      "scoreLu",
      "attendu",
    ]);
    console.table(total);
    console.log(
      lignes
        .filter((l) => l.erreurs)
        .map((l) => `${l.fixture} : ${l.erreurs}`)
        .join("\n"),
    );
    console.log(
      `cartes justes ${total.justes}/${cartes} (${((100 * total.justes) / cartes).toFixed(1)} %), scores justes ${scoresJustes}/${lignes.length}`,
    );
    expect(total.justes / cartes).toBeGreaterThanOrEqual(tauxMin);
  }, 120_000);
});
