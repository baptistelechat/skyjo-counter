export type Boite = [number, number, number, number]; // x1, y1, x2, y2 sur 0-1000
export interface Texte {
  string: string;
  bbox: Boite;
  score?: number | null;
}
export interface Mirage {
  objects: { name: string; bbox: Boite }[];
  text: Texte[];
}

export const centre = (b: Boite) =>
  [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] as const;
export const contient = (
  b: Boite,
  [x, y]: readonly [number, number],
): boolean => b[0] <= x && x <= b[2] && b[1] <= y && y <= b[3];

const aire = (b: Boite) => (b[2] - b[0]) * (b[3] - b[1]);
const intersection = (a: Boite, b: Boite) =>
  Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) *
  Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
const mediane = (xs: number[]) =>
  [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;

// Mirage renvoie aussi des boîtes DANS les cartes (coins chiffrés, logo SKYJO) : on les écarte.
const sansImbriquees = (boites: Boite[]) =>
  boites.filter(
    (b) =>
      !boites.some(
        (o) =>
          o !== b &&
          (aire(o) > aire(b) ||
            (aire(o) === aire(b) && boites.indexOf(o) < boites.indexOf(b))) && // doublons
          intersection(b, o) / aire(b) > 0.6,
      ),
  );

// Inclinaison de la grille = angle médian entre chaque carte et sa voisine de droite.
// ponytail: médiane des voisins, suffit jusqu'à ~25° ; au-delà, ajuster une vraie grille (RANSAC).
const inclinaison = (boites: Boite[], w: number, h: number) => {
  const angles = boites.flatMap((a) => {
    const [ax, ay] = centre(a);
    const voisins = boites
      .map((b) => [centre(b)[0] - ax, centre(b)[1] - ay])
      .filter(([dx, dy]) => dx > 0.6 * w && Math.abs(dy) < 0.6 * h)
      .sort((p, q) => p[0] - q[0]);
    return voisins.length ? [Math.atan2(voisins[0][1], voisins[0][0])] : [];
  });
  return mediane(angles);
};

// Boîtes des cartes, choisies par leur FORME et non par leur nom : Mirage les appelle « patch », « tile »,
// « sticky note », « cutout »… et mélange parfois plusieurs noms dans la même photo (« tile » + « letter »,
// « number » désignant alors les petits coins chiffrés). Une carte Skyjo = rectangle 2:3 debout ou couché.
// `ratio` = largeur / hauteur de l'image en pixels (les coordonnées Mirage sont sur 0-1000 dans les deux sens).
// ponytail: bornes larges (biais ~15° → 0,8 ; perspective des cartes du fond → 1,05) ; les morceaux presque
// carrés sont écartés par le filtre de taille. Resserrer si un objet carré de la taille d'une carte passe.
export const boitesCartes = (m: Mirage, ratio: number): Boite[] => {
  const forme = (b: Boite) => ((b[2] - b[0]) * ratio) / (b[3] - b[1]);
  const candidates = m.objects
    .map((o) => o.bbox)
    .filter((b) => aire(b) > 0 && aire(b) < 200_000);
  // Sans les boîtes imbriquées (coins, logo) ni les petits morceaux : < 30 % de l'aire médiane.
  // Médiane et non 3e quartile : avec la perspective, les cartes du fond font 1/3 de celles du premier plan.
  const garder = (boites: Boite[]) => {
    const sans = sansImbriquees(boites);
    const reference = mediane(sans.map(aire));
    return sans.filter((b) => aire(b) >= 0.3 * reference);
  };
  const debout = garder(
    candidates.filter((b) => forme(b) >= 0.4 && forme(b) <= 1.15),
  );
  const couchees = garder(
    candidates.filter((b) => forme(b) >= 1.2 && forme(b) <= 2.5),
  );
  return debout.length >= couchees.length ? debout : couchees;
};

// Cartes couchées (photo prise en paysage) : en pixels, une carte Skyjo est plus haute que large.
export const cartesCouchees = (
  m: Mirage,
  largeur: number,
  hauteur: number,
): boolean => {
  const boites = boitesCartes(m, largeur / hauteur);
  return (
    boites.length > 0 &&
    mediane(
      boites.map((b) => ((b[2] - b[0]) * largeur) / ((b[3] - b[1]) * hauteur)),
    ) > 1
  );
};

// Cartes = catégorie d'objets la plus fréquente, sans la boîte « toute la grille » ni les boîtes
// imbriquées, redressées puis coupées en lignes là où l'écart vertical dépasse une demi-carte ;
// on garde la taille de ligne qui regroupe le plus de cartes (écarte carnet et objets parasites).
export const grilleDeBoites = (
  m: Mirage,
  ratio: number,
): (Boite | null)[][] => {
  const boites = boitesCartes(m, ratio);
  if (!boites.length) return [];

  const w = mediane(boites.map((b) => b[2] - b[0]));
  const h = mediane(boites.map((b) => b[3] - b[1]));
  const t = inclinaison(boites, w, h);
  const redresse = (b: Boite) => {
    const [x, y] = centre(b);
    return {
      x: x * Math.cos(t) + y * Math.sin(t),
      y: -x * Math.sin(t) + y * Math.cos(t),
    };
  };
  const tri = boites
    .map((b) => ({ b, ...redresse(b) }))
    .sort((p, q) => p.y - q.y);

  const lignes: (typeof tri)[] = [[tri[0]]];
  for (const c of tri.slice(1)) {
    const ligne = lignes[lignes.length - 1];
    const prec = ligne[ligne.length - 1];
    // demi-hauteur de la plus petite des deux boîtes : la perspective agrandit les cartes du bas
    const seuil = 0.5 * Math.min(prec.b[3] - prec.b[1], c.b[3] - c.b[1]);
    if (c.y - prec.y < seuil) ligne.push(c);
    else lignes.push([c]);
  }
  // Une grille Skyjo a au plus 4 colonnes : la ligne la plus longue donne le nombre de colonnes
  // (les lignes plus longues portent un objet parasite, réduites ci-dessous).
  const taille = Math.min(4, Math.max(...lignes.map((l) => l.length)));
  // Ligne trop longue (objet parasite collé à la ligne) : on garde ses `taille` plus grandes boîtes.
  for (const [i, l] of lignes.entries())
    if (l.length > taille)
      lignes[i] = [...l].sort((p, q) => aire(q.b) - aire(p.b)).slice(0, taille);
  const completes = lignes
    .filter((l) => l.length === taille)
    .map((l) => l.sort((p, q) => p.x - q.x));

  // Quadrillage : abscisse (redressée) de chaque colonne et taille d'une carte, prises sur les lignes complètes.
  const colonnes = Array.from(
    { length: taille },
    (_, i) => completes.reduce((a, l) => a + l[i].x, 0) / completes.length,
  );
  const wc = mediane(completes.flat().map((c) => c.b[2] - c.b[0]));
  const hc = mediane(completes.flat().map((c) => c.b[3] - c.b[1]));
  const fiable = (b: Boite) => aire(b) >= 0.6 * wc * hc; // sinon : morceau de carte (cartes collées)
  const hauteur = (l: typeof tri) =>
    l.reduce((a, c) => a + c.b[3] - c.b[1], 0) / l.length;
  const ordonnee = (l: typeof tri) => {
    const bonnes = l.filter((c) => fiable(c.b));
    return (
      (bonnes.length ? bonnes : l).reduce((a, c) => a + c.y, 0) /
      (bonnes.length || l.length)
    );
  };

  // Lignes retenues : au moins la moitié des cartes et au moins une boîte de taille carte
  // (écarte carnet, objets isolés et rangées de petits morceaux).
  let rangs = lignes
    .filter(
      (l) =>
        l.length >= 2 &&
        l.length >= taille / 2 &&
        l.some((c) => aire(c.b) >= 0.4 * wc * hc),
    )
    .map((l) => ({ y: ordonnee(l), h: hauteur(l), cartes: l }))
    .sort((p, q) => p.y - q.y);

  // Une grille Skyjo a 3 lignes : une ligne entière ratée (cartes collées) se déduit de l'écart entre ses voisines.
  // ponytail: n'insère qu'entre deux lignes connues ; une 1re ou 3e ligne ratée reste absente.
  for (let i = 0; i + 1 < rangs.length && rangs.length < 3; i++) {
    const [a, b] = [rangs[i], rangs[i + 1]];
    const manquantes = Math.min(
      3 - rangs.length,
      Math.round((b.y - a.y) / ((1.1 * (a.h + b.h)) / 2)) - 1,
    );
    if (manquantes > 0) {
      const ajout = Array.from({ length: manquantes }, (_, k) => ({
        y: a.y + ((b.y - a.y) * (k + 1)) / (manquantes + 1),
        h: (a.h + b.h) / 2,
        cartes: [] as typeof tri,
      }));
      rangs = [...rangs.slice(0, i + 1), ...ajout, ...rangs.slice(i + 1)];
      i += manquantes;
    }
  }

  // Case du quadrillage (repère redressé → repère photo) à la taille d'une carte.
  const caseEstimee = (x: number, y: number): Boite => {
    const cx = x * Math.cos(t) - y * Math.sin(t);
    const cy = x * Math.sin(t) + y * Math.cos(t);
    return [cx - wc / 2, cy - hc / 2, cx + wc / 2, cy + hc / 2];
  };

  // Chaque boîte va dans la colonne la plus proche ; case vide ou simple morceau de carte → case estimée.
  // ponytail: affectation gloutonne par x, suffit tant que les colonnes ne se chevauchent pas.
  return rangs.map(({ y, cartes }) => {
    const ligne = new Array<Boite | null>(taille).fill(null);
    for (const c of [...cartes].sort((p, q) => aire(q.b) - aire(p.b))) {
      const libres = colonnes
        .map((x, i) => ({ i, d: Math.abs(x - c.x) }))
        .filter(({ i, d }) => !ligne[i] && d < 0.6 * wc);
      if (libres.length) ligne[libres.sort((p, q) => p.d - q.d)[0].i] = c.b;
    }
    return ligne.map((b, i) =>
      b && fiable(b) ? b : caseEstimee(colonnes[i], y),
    );
  });
};

// Petit côté d'une carte, en fraction du petit côté de la photo (indépendant de l'orientation).
export const largeurCarte = (
  m: Mirage,
  largeur: number,
  hauteur: number,
): number => {
  const boites = boitesCartes(m, largeur / hauteur);
  if (!boites.length) return 1;
  const cote = mediane(
    boites.map((b) =>
      Math.min(
        ((b[2] - b[0]) * largeur) / 1000,
        ((b[3] - b[1]) * hauteur) / 1000,
      ),
    ),
  );
  return cote / Math.min(largeur, hauteur);
};

// Zone de la grille (0-1000) : cartes + chiffres lus, élargie d'une demi-carte (cartes ratées en bordure).
export const zoneGrille = (m: Mirage, ratio: number): Boite | null => {
  const boites = boitesCartes(m, ratio);
  if (!boites.length) return null;
  const chiffres = m.text
    .filter((t) => /^-?[\dOoDIl]{1,2}$/.test(t.string))
    .map((t) => t.bbox);
  const tout = [...boites, ...chiffres];
  const w = mediane(boites.map((b) => b[2] - b[0]));
  const h = mediane(boites.map((b) => b[3] - b[1]));
  return [
    Math.max(0, Math.min(...tout.map((b) => b[0])) - w / 2),
    Math.max(0, Math.min(...tout.map((b) => b[1])) - h / 2),
    Math.min(1000, Math.max(...tout.map((b) => b[2])) + w / 2),
    Math.min(1000, Math.max(...tout.map((b) => b[3])) + h / 2),
  ];
};
