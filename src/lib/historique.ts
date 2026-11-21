import { gagnants, type GrilleArchivee, type Partie } from "@/lib/partie";

// Historique des parties, 100 % local (IndexedDB). Le format stocké est versionné pour pouvoir évoluer.
export const VERSION_HISTORIQUE = 1;

export type Statut = "terminee" | "abandonnee";

export interface PartieArchivee {
  id: string;
  joueurs: string[];
  manches: number[][];
  grilles?: GrilleArchivee[][];
  creeLe: number;
  termineeLe: number;
  statut: Statut;
  gagnants: number[]; // indices dans joueurs, vide pour une partie abandonnée
}

export interface Historique {
  version: typeof VERSION_HISTORIQUE;
  parties: PartieArchivee[]; // de la plus récente à la plus ancienne
}

export const historiqueVide = (): Historique => ({
  version: VERSION_HISTORIQUE,
  parties: [],
});

// --- S1 : archivage ---

export const archiver = (
  p: Partie,
  statut: Statut,
  maintenant = Date.now(),
): PartieArchivee => ({
  id: p.id,
  joueurs: p.joueurs,
  manches: p.manches,
  ...(p.grilles?.length ? { grilles: p.grilles } : {}),
  creeLe: p.creeLe,
  termineeLe: maintenant,
  statut,
  gagnants: statut === "terminee" ? gagnants(p) : [],
});

const trier = (parties: PartieArchivee[]): PartieArchivee[] =>
  [...parties].sort((a, b) => b.termineeLe - a.termineeLe);

// Ajoute (ou remplace, même id) une partie.
export const ajouter = (h: Historique, p: PartieArchivee): Historique => ({
  ...h,
  parties: trier([p, ...h.parties.filter((x) => x.id !== p.id)]),
});

export const supprimer = (h: Historique, id: string): Historique => ({
  ...h,
  parties: h.parties.filter((p) => p.id !== id),
});

// Vue « Partie » d'une partie archivée, pour réutiliser TableauScores.
export const versPartie = (p: PartieArchivee): Partie => ({
  id: p.id,
  joueurs: p.joueurs,
  manches: p.manches,
  creeLe: p.creeLe,
});

// --- S3 : joueurs connus ---

export const cleJoueur = (nom: string): string =>
  nom.trim().toLocaleLowerCase("fr");

// Prénoms déjà utilisés, les plus joués d'abord, dans leur orthographe la plus récente.
export const joueursConnus = (h: Historique): string[] => {
  const vus = new Map<string, { nom: string; n: number }>();
  for (const p of h.parties)
    for (const nom of p.joueurs) {
      const cle = cleJoueur(nom);
      const v = vus.get(cle);
      if (v) v.n += 1;
      else vus.set(cle, { nom: nom.trim(), n: 1 }); // parties triées : la première vue est la plus récente
    }
  return [...vus.values()]
    .sort((a, b) => b.n - a.n || a.nom.localeCompare(b.nom, "fr"))
    .map((v) => v.nom);
};

// --- S4 : statistiques par joueur ---

export interface StatJoueur {
  nom: string;
  parties: number; // parties terminées jouées (les abandons ne comptent pas)
  victoires: number;
  tauxVictoire: number; // 0..1
  manches: number; // manches jouées, abandons compris
  scoreMoyen: number | null; // par manche
  meilleure: number | null; // plus petit score de manche
  pire: number | null; // plus grand score de manche
  manchesParPartie: number | null; // moyenne sur les parties terminées
}

const moyenne = (xs: number[]): number | null =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;

export const statsJoueurs = (h: Historique): StatJoueur[] => {
  const acc = new Map<
    string,
    {
      nom: string;
      parties: number;
      victoires: number;
      scores: number[];
      longueurs: number[];
    }
  >();
  for (const p of h.parties)
    p.joueurs.forEach((nom, j) => {
      const cle = cleJoueur(nom);
      const a = acc.get(cle) ?? {
        nom: nom.trim(),
        parties: 0,
        victoires: 0,
        scores: [],
        longueurs: [],
      };
      acc.set(cle, a);
      a.scores.push(...p.manches.map((m) => m[j] ?? 0));
      if (p.statut !== "terminee") return;
      a.parties += 1;
      a.longueurs.push(p.manches.length);
      if (p.gagnants.includes(j)) a.victoires += 1;
    });
  return [...acc.values()]
    .map(
      (a): StatJoueur => ({
        nom: a.nom,
        parties: a.parties,
        victoires: a.victoires,
        tauxVictoire: a.parties ? a.victoires / a.parties : 0,
        manches: a.scores.length,
        scoreMoyen: moyenne(a.scores),
        meilleure: a.scores.length ? Math.min(...a.scores) : null,
        pire: a.scores.length ? Math.max(...a.scores) : null,
        manchesParPartie: moyenne(a.longueurs),
      }),
    )
    .sort(
      (a, b) =>
        b.victoires - a.victoires ||
        b.parties - a.parties ||
        a.nom.localeCompare(b.nom, "fr"),
    );
};

// --- S5 : export / import ---

export const exporter = (h: Historique): string =>
  JSON.stringify({ app: "skyjo-scan", ...h }, null, 2);

const estNombres = (x: unknown): x is number[] =>
  Array.isArray(x) &&
  x.every((v) => typeof v === "number" && Number.isFinite(v));

const estCase = (c: unknown): boolean => {
  if (typeof c !== "object" || c === null) return false;
  const { valeur, dos } = c as Record<string, unknown>;
  return (
    (valeur === null || typeof valeur === "number") && typeof dos === "boolean"
  );
};

const estGrilles = (g: unknown): g is GrilleArchivee[][] =>
  Array.isArray(g) &&
  g.every(
    (m) =>
      Array.isArray(m) &&
      m.every(
        (grille) =>
          Array.isArray(grille) &&
          grille.every((l) => Array.isArray(l) && l.every(estCase)),
      ),
  );

const lirePartie = (x: unknown): PartieArchivee | null => {
  if (typeof x !== "object" || x === null) return null;
  const p = x as Record<string, unknown>;
  const joueurs = p.joueurs;
  if (
    typeof p.id !== "string" ||
    !Array.isArray(joueurs) ||
    !joueurs.every((n) => typeof n === "string") ||
    !Array.isArray(p.manches) ||
    !p.manches.every((m) => estNombres(m) && m.length === joueurs.length) ||
    typeof p.creeLe !== "number" ||
    typeof p.termineeLe !== "number" ||
    (p.statut !== "terminee" && p.statut !== "abandonnee") ||
    !estNombres(p.gagnants) ||
    (p.grilles !== undefined && !estGrilles(p.grilles))
  )
    return null;
  return {
    id: p.id,
    joueurs: joueurs as string[],
    manches: p.manches as number[][],
    ...(p.grilles ? { grilles: p.grilles as GrilleArchivee[][] } : {}),
    creeLe: p.creeLe,
    termineeLe: p.termineeLe,
    statut: p.statut,
    gagnants: p.gagnants,
  };
};

// Lit un export JSON ; lève une erreur lisible si le fichier n'est pas un historique valide.
export const lireExport = (texte: string): Historique => {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    throw new Error("Ce fichier n'est pas un JSON valide.");
  }
  if (typeof brut !== "object" || brut === null)
    throw new Error("Ce fichier n'est pas un historique Skyjo Scan.");
  const { version, parties } = brut as Record<string, unknown>;
  if (typeof version === "number" && version > VERSION_HISTORIQUE)
    throw new Error(
      "Cet historique vient d'une version plus récente de l'app.",
    );
  if (version !== VERSION_HISTORIQUE || !Array.isArray(parties))
    throw new Error("Ce fichier n'est pas un historique Skyjo Scan.");
  const lues = parties.map(lirePartie);
  if (lues.some((p) => !p))
    throw new Error("Certaines parties du fichier sont illisibles.");
  return {
    version: VERSION_HISTORIQUE,
    parties: trier(lues as PartieArchivee[]),
  };
};

// Fusion par id : rien n'est perdu, une partie déjà présente n'est pas dupliquée.
export const fusionner = (
  h: Historique,
  importe: Historique,
): { historique: Historique; ajoutees: number } => {
  const ids = new Set(h.parties.map((p) => p.id));
  const nouvelles = importe.parties.filter((p) => !ids.has(p.id));
  return {
    historique: { ...h, parties: trier([...h.parties, ...nouvelles]) },
    ajoutees: nouvelles.length,
  };
};
