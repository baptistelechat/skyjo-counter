import { FAMILLES, type Couleur } from "./couleur";
import type { Texte } from "./grille";

export const VALEURS = Array.from({ length: 15 }, (_, i) => i - 2); // -2 à 12
const CORRECTIONS: Record<string, string> = {
  O: "0",
  o: "0",
  D: "0",
  I: "1",
  l: "1",
};
const RETOURNEES: Record<string, number> = {
  OT: 10,
  OL: 10,
  "0T": 10,
  "0L": 10,
  T: 1,
};
const RETOURNE: Record<number, number> = { 6: 9, 9: 6 };

export const lire = (chaine: string): number | null => {
  if (chaine in RETOURNEES) return RETOURNEES[chaine];
  const s = [...chaine].map((c) => CORRECTIONS[c] ?? c).join("");
  return /^-?\d{1,2}$/.test(s) && VALEURS.includes(+s) ? +s : null;
};

export interface Lecture {
  valeur: number | null;
  confiance: number; // 0 à 1
  raisons: string[];
}

export interface Contexte {
  estimee?: boolean; // case déduite du quadrillage, pas une boîte Mirage
  relue?: boolean; // textes issus de la relecture d'un recadrage
}

// Confiance d'un dos : seule la couleur (arc-en-ciel) le désigne.
export const CONFIANCE_DOS = 0.8;
// Bleu clair sans aucun chiffre lu : 0 est la seule valeur possible, mais rien ne le confirme.
export const CONFIANCE_DEFAUT = 0.5;
// Plancher d'une lecture directe confirmée par la couleur (calibré sur les 12 fixtures, 87 cartes visibles).
export const PLANCHER_COULEUR = 0.6;

const arrondi = (x: number): number =>
  Math.round(Math.min(1, Math.max(0, x)) * 100) / 100;

// Vote entre les chiffres d'une carte (2 coins + centre), pondéré par le score OCR, avec sa confiance :
// marge × (0,25 + 0,4 × soutien + 0,35 × accord), où marge = part du gagnant dans les votes,
// soutien = somme des scores OCR du gagnant (saturée à 1,2) et accord = lectures concordantes (saturé à 3).
// Puis × (1 − 0,25 × part corrigée) [+10, signe, 6↔9], × 0,8 si case estimée, × 0,9 si relue.
// ponytail: coefficients posés à la main, à recalibrer sur le jeu de photos annotées.
export const lireCarte = (
  textes: Texte[],
  couleur: Couleur,
  contexte: Contexte = {},
): Lecture => {
  if (couleur === "dos")
    return {
      valeur: null,
      confiance: CONFIANCE_DOS,
      raisons: ["dos (couleur seule)"],
    };
  const permises = couleur ? FAMILLES[couleur].valeurs : VALEURS;
  const votes = new Map<
    number,
    { poids: number; n: number; corrige: number; raisons: Set<string> }
  >();
  for (const t of textes) {
    let v = lire(t.string);
    let raison: string | null = null;
    if (v !== null && !permises.includes(v)) {
      if (permises.includes(v + 10)) {
        v += 10; // « 2 » sur carte rouge = 12 dont le « 1 » s'est perdu
        raison = "corrigée +10 (chiffre perdu)";
      } else if (permises.includes(-v)) {
        v = -v; // « 2 » sur carte bleu foncé = -2 dont le signe moins s'est perdu
        raison = "signe moins ajouté";
      } else {
        v = RETOURNE[v] ?? null; // 6 sur carte rouge = 9
        raison = "retournée 6↔9";
      }
    }
    if (v === null || !permises.includes(v)) continue;
    const poids = t.score || 0.1;
    const vote = votes.get(v) ?? {
      poids: 0,
      n: 0,
      corrige: 0,
      raisons: new Set<string>(),
    };
    vote.poids += poids;
    vote.n++;
    if (raison) {
      vote.corrige += poids;
      vote.raisons.add(raison);
    }
    votes.set(v, vote);
  }

  const raisons: string[] = [];
  if (contexte.estimee) raisons.push("case estimée par le quadrillage");
  if (contexte.relue) raisons.push("relue sur recadrage");
  const facteur = (contexte.estimee ? 0.8 : 1) * (contexte.relue ? 0.9 : 1);

  if (!votes.size) {
    if (permises.length === 1)
      return {
        valeur: permises[0],
        confiance: arrondi(CONFIANCE_DEFAUT * facteur),
        raisons: [...raisons, "bleu clair sans chiffre (0 par défaut)"],
      };
    return {
      valeur: null,
      confiance: 0,
      raisons: [...raisons, "aucun chiffre lu"],
    };
  }

  const tri = [...votes].sort((a, b) => b[1].poids - a[1].poids);
  const [valeur, gagnant] = tri.find(([v]) => v < 0) ?? tri[0]; // le signe moins se perd mais n'apparaît jamais par erreur
  const total = tri.reduce((a, [, v]) => a + v.poids, 0);
  const marge = gagnant.poids / total;
  const soutien = Math.min(1, gagnant.poids / 1.2);
  const accord = Math.min(3, gagnant.n) / 3;
  const corrige = 1 - 0.25 * (gagnant.corrige / gagnant.poids);
  if (marge < 1) raisons.push(`vote partagé (${Math.round(marge * 100)} %)`);
  if (gagnant.n === 1) raisons.push("une seule lecture");
  raisons.push(...gagnant.raisons);
  let base = marge * (0.25 + 0.4 * soutien + 0.35 * accord) * corrige;
  // Lecture directe, sans désaccord, d'une valeur permise par la couleur détectée : l'OCR de Mirage note
  // ses chiffres justes 0,3 à 0,5, ce qui faisait tomber sous le seuil des cartes justes lues une seule fois
  // (10 fausses alertes sur 87 cartes visibles des fixtures, aucune erreur réelle parmi elles).
  if (
    couleur &&
    marge === 1 &&
    gagnant.corrige === 0 &&
    base < PLANCHER_COULEUR
  ) {
    base = PLANCHER_COULEUR;
    raisons.push("cohérente avec la couleur");
  }
  return { valeur, confiance: arrondi(base * facteur), raisons };
};

export const valeurCarte = (textes: Texte[], couleur: Couleur): number | null =>
  lireCarte(textes, couleur).valeur;
