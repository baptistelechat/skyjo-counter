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

// Vote entre les chiffres d'une carte (2 coins + centre), pondéré par le score OCR.
export const valeurCarte = (
  textes: Texte[],
  couleur: Couleur,
): number | null => {
  if (couleur === "dos") return null;
  const permises = couleur ? FAMILLES[couleur].valeurs : VALEURS;
  const votes = new Map<number, number>();
  for (const t of textes) {
    let v = lire(t.string);
    if (v !== null && !permises.includes(v)) {
      if (permises.includes(v + 10))
        v += 10; // « 2 » sur carte rouge = 12 dont le « 1 » s'est perdu
      else if (permises.includes(-v))
        v = -v; // « 2 » sur carte bleu foncé = -2 dont le signe moins s'est perdu
      else v = RETOURNE[v] ?? null; // 6 sur carte rouge = 9
    }
    if (v !== null && permises.includes(v))
      votes.set(v, (votes.get(v) ?? 0) + (t.score || 0.1));
  }
  if (!votes.size) return permises.length === 1 ? permises[0] : null; // bleu clair = 0
  const tri = [...votes].sort((a, b) => b[1] - a[1]);
  return (tri.find(([v]) => v < 0) ?? tri[0])[0]; // le signe moins se perd mais n'apparaît jamais par erreur
};
