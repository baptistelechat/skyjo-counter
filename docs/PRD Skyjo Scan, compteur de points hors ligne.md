# PRD : Skyjo Scan, compteur de points hors ligne

Nov 18, 2026 · @Baptiste

## Contexte et objectif

Skyjo Scan calcule le score d'une manche de Skyjo à partir d'une photo de la grille, entièrement dans le navigateur, sans serveur et hors ligne après le premier chargement.

Le POC Python du 18/11/2026 (Mirage de Cactus Compute + post-traitement) donne le bon score sur 3 photos sur 3 : -1, 21 et 6. L'app finale porte cette logique en TypeScript et exécute Mirage via le build WebAssembly de Cactus.

| Objectif | Mesure de réussite |
| --- | --- |
| Score juste | 95 % des photos de test donnent le score exact (jeu de 20 photos variées) |
| Rapide | Moins de 3 s entre la photo et le score sur un smartphone récent |
| Hors ligne | L'app fonctionne en mode avion après une première visite |
| Gratuit à héberger | Site statique sur Vercel, aucun serveur, aucune API payante |

## Utilisateurs et parcours principal

La cible : des joueurs de Skyjo autour d'une table, souvent sans bon réseau, qui veulent arrêter de compter à la main sur un carnet.

1. Le joueur ouvre l'app (PWA installée ou lien) et crée une partie avec les noms des joueurs.
2. En fin de manche, il photographie la grille d'un joueur, vue de dessus.
3. L'app affiche la grille lue (4 colonnes × 3 lignes), les colonnes défaussées et le score.
4. Il corrige une carte d'un tap si besoin, puis valide.
5. Le score s'ajoute au tableau de la partie. À 100 points, la partie s'arrête et le gagnant est affiché.

## Périmètre

Le MVP couvre le scan d'une grille et le suivi d'une partie, en local sur l'appareil.

| Fonctionnalité | Version | Détail |
| --- | --- | --- |
| Photo ou import d'image | MVP | `<input type="file" accept="image/*" capture="environment">`, pas de flux vidéo |
| Lecture de la grille + score | MVP | Pipeline Mirage + post-traitement (section suivante) |
| Correction manuelle d'une carte | MVP | Tap sur une case : choix de -2 à 12 ou dos |
| Partie multi-joueurs + cumul | MVP | Fin à 100 points, stocké dans IndexedDB |
| Hors ligne (PWA) | MVP | Modèle et moteur mis en cache par le service worker |
| Règle du doublement (celui qui clôt la manche sans avoir le plus petit score) | v1.1 | Une case à cocher par manche |
| Partage du tableau des scores | v1.1 | Web Share API |
| Comptes, synchro en ligne | Hors périmètre | Demanderait un backend |
| Autres jeux (Uno, Yams…) | Hors périmètre | À envisager une fois le pipeline éprouvé |

## Stack et architecture

Une app Vite 100 % client : l'inférence tourne dans un Web Worker, Vercel ne sert que des fichiers statiques.

&#91;embedded content: architecture · thread principal, Web Worker, cache PWA\]

La photo devient des pixels RGB, part au worker, revient en JSON Mirage, puis la logique Skyjo calcule la grille et le score sur le thread principal.

| Brique | Choix | Raison |
| --- | --- | --- |
| Build | Vite + React + TypeScript, pnpm | Aucun besoin de serveur, Worker et WASM natifs |
| UI | Tailwind + shadcn/ui | Stack habituelle |
| Inférence | Cactus v4.1.3 build `wasm` + Mirage | Apache 2.0, redistribuable |
| Stockage | IndexedDB (via `idb-keyval`) | Parties conservées hors ligne |
| Hors ligne | `vite-plugin-pwa` (Workbox) | Met en cache le modèle de 21,6 Mo |
| Tests | Vitest | Rejoue les JSON du POC |
| Hébergement | Vercel, site statique | Gratuit |

## Pipeline de reconnaissance et règles métier

Mirage perçoit (boîtes + texte), le code décide (valeurs + score). Les essais avec `extract()` et une liste fermée de valeurs ont échoué : Mirage renvoie la même distribution de probabilités pour toutes les cartes.

1. **Préparation** : la photo est redimensionnée (côté max 1536 px, à valider), l'orientation EXIF corrigée, puis convertie en RGB sans canal alpha via un `canvas`.
2. **Description** : `cactus_describe` renvoie des objets (boîtes en coordonnées 0-1000) et des textes OCR avec un score.
3. **Réparation du JSON** : sous Windows, le moteur peut écrire `-nan(ind)`. On remplace `nan`, `-nan(ind)` et `inf` par `null` avant `JSON.parse`.
4. **Sélection des cartes** : on garde la catégorie d'objets la plus fréquente ("patch", "game tile"…) et on écarte les boîtes de plus de 200 000 unités² (la grille entière).
5. **Grille** : tri par y, regroupement en lignes (écart < 100), on garde la taille de ligne qui regroupe le plus de cartes (élimine le carnet de scores et les bouts du support), puis tri par x.
6. **Couleur** (sans IA) : teinte dominante au centre de la carte, bord blanc exclu. Plusieurs teintes mélangées (dominante < 50 %) = dos. Sinon la famille donne les valeurs permises.
7. **Lecture OCR** : textes dont le centre tombe dans la carte, corrections O→0 et I→1, lectures retournées ("OT", "OL" = 10, "T" = 1), 6↔9 si hors famille, vote pondéré par le score OCR, et un signe moins l'emporte toujours.
8. **Score** : une colonne de 3 cartes visibles identiques est défaussée, puis on additionne les cartes visibles.

| Famille de couleur | Tranches de teinte (30°) | Valeurs permises |
| --- | --- | --- |
| Rouge | 330-30° | 9 à 12 |
| Jaune | 30-90° | 5 à 8 |
| Vert | 90-150° | 1 à 4 |
| Bleu clair | 150-210° | 0 |
| Bleu foncé | 210-270° | -2, -1 |
| Arc-en-ciel (dos) | aucune dominante > 50 % | carte cachée |

Le classement par couleur a été vérifié sur les 36 cartes des 3 photos de test : 36 sur 36 dans la bonne famille.

## Snippets à reprendre ou ajuster

Tout le post-traitement Python se porte en TypeScript presque ligne à ligne. Seul l'appel au moteur est nouveau et reste à valider sur le vrai build WASM. Les snippets grille, lecture, score et réparation JSON ont été exécutés sous Node 22 sur les JSON du POC : mêmes grilles et mêmes scores qu'en Python (-1 et 21).

| Snippet | Source (POC) | Action | Fichier cible |
| --- | --- | --- | --- |
| Chargement du moteur + modèle | `cactus.Mirage()` (Python) | Nouveau, à valider | `src/worker/cactus.worker.ts` |
| Appel `describe` | `mirage.describe(image)` | Nouveau, à valider | `src/worker/cactus.worker.ts` |
| Réparation `-nan(ind)` | `test_mirage_skyjo.py` | Porter tel quel | `src/lib/json.ts` |
| Photo → RGB | Pillow `convert("RGB")` | Porter via `canvas` | `src/lib/image.ts` |
| Sélection des cartes + grille | `score_skyjo.py` étapes 1-2 | Porter tel quel | `src/lib/skyjo/grille.ts` |
| Famille de couleur | `couleur_carte()` | Porter, seuils à recalibrer sur mobile | `src/lib/skyjo/couleur.ts` |
| Lecture OCR + vote | `lire()`, `valeur_carte()` | Porter tel quel | `src/lib/skyjo/lecture.ts` |
| Score + colonnes | `main()` étape 4 | Porter tel quel | `src/lib/skyjo/score.ts` |
| Formulaire `extract()` | `skyjo_extract.py` | **Abandonner** (ne lit pas les chiffres) | aucun |
| Cache hors ligne | aucun | Nouveau | `vite.config.ts` |

Scripts du POC : test\_mirage\_skyjo.py, score\_skyjo.py, skyjo\_extract.py.

### Worker Cactus (nouveau, à valider)

Signatures tirées de `cactus.h` (v4.1.3). Le module Emscripten expose `_malloc`, `_free`, `HEAPU8`, `ccall` et `UTF8ToString`. Points à vérifier : `n` de `cactus_load` est un `unsigned long long`, donc un `BigInt` côté JS ; les paramètres `language` et `keywords` à `null` ; le moteur garde-t-il sa copie du modèle après `cactus_load` (sinon ne pas libérer `modelPtr`).

```ts
// src/worker/cactus.worker.ts
// cactus.js n'est pas un module ES : on le copie dans src/vendor/ et on ajoute en dernière ligne
// `export default createCactus;` (le .wasm reste servi depuis /public/cactus/)
import createCactus from "../vendor/cactus.js";
import { parseMirage } from "../lib/json";

const MODEL_URL = "/models/mirage.cact";
const OUT_CAP = 16 * 1024 * 1024; // même taille que le buffer Python
const CACTUS_VISION = 4;

let M: any;
let outPtr = 0;

async function init() {
  M = await createCactus({ locateFile: (f: string) => `/cactus/${f}` });
  const cact = new Uint8Array(await (await fetch(MODEL_URL)).arrayBuffer());
  const modelPtr = M._malloc(cact.length);
  M.HEAPU8.set(cact, modelPtr);
  if (M._cactus_load(modelPtr, BigInt(cact.length)) < 0) {
    throw new Error(M.UTF8ToString(M._cactus_last_error()));
  }
  if (!(M._cactus_models() & CACTUS_VISION)) throw new Error("Pas un modèle Mirage");
  outPtr = M._malloc(OUT_CAP);
}

function describe(rgb: Uint8Array, width: number, height: number) {
  const rgbPtr = M._malloc(rgb.length);
  M.HEAPU8.set(rgb, rgbPtr);
  const code = M.ccall(
    "cactus_describe", "number",
    ["number", "number", "number", "string", "string", "string", "number", "number"],
    [rgbPtr, width, height, "{}", null, null, outPtr, OUT_CAP],
  );
  M._free(rgbPtr);
  if (code < 0) throw new Error(M.UTF8ToString(M._cactus_last_error()));
  return parseMirage(M.UTF8ToString(outPtr));
}

const ready = init();
self.onmessage = async (e: MessageEvent<{ rgb: Uint8Array; width: number; height: number }>) => {
  await ready;
  self.postMessage(describe(e.data.rgb, e.data.width, e.data.height));
};
```

### Réparation du JSON (porter tel quel)

```ts
// src/lib/json.ts
export const parseMirage = (brut: string) =>
  JSON.parse(brut.replace(/-?(nan|inf|infinity)(\(ind\))?(?![\w"])/gi, "null"));
```

### Photo → RGB (porter via canvas)

```ts
// src/lib/image.ts
export async function versRGB(fichier: File, max = 1536) {
  const bitmap = await createImageBitmap(fichier, { imageOrientation: "from-image" }); // = exif_transpose
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * k), h = Math.round(bitmap.height * k);
  const ctx = new OffscreenCanvas(w, h).getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const rgb = new Uint8Array(w * h * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i]; rgb[j + 1] = rgba[i + 1]; rgb[j + 2] = rgba[i + 2];
  }
  return { rgb, rgba, width: w, height: h }; // rgba resservira au contrôle couleur
}
```

### Types et grille (porter tel quel)

```ts
// src/lib/skyjo/grille.ts
export type Boite = [number, number, number, number]; // x1, y1, x2, y2 sur 0-1000
export type Texte = { string: string; bbox: Boite; score?: number | null };
export type Mirage = { objects: { name: string; bbox: Boite }[]; text: Texte[] };

export const centre = (b: Boite) => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2] as const;
export const contient = (b: Boite, [x, y]: readonly [number, number]) =>
  b[0] <= x && x <= b[2] && b[1] <= y && y <= b[3];

const plusFrequent = <T,>(xs: T[]) => {
  const n = new Map<T, number>();
  xs.forEach((x) => n.set(x, (n.get(x) ?? 0) + 1));
  return n;
};

export function grilleDeBoites(m: Mirage): Boite[][] {
  const noms = plusFrequent(m.objects.map((o) => o.name));
  const nom = [...noms].sort((a, b) => b[1] - a[1])[0][0];
  const boites = m.objects
    .filter((o) => o.name === nom)
    .map((o) => o.bbox)
    .filter((b) => (b[2] - b[0]) * (b[3] - b[1]) < 200_000)
    .sort((a, b) => centre(a)[1] - centre(b)[1]);

  const lignes: Boite[][] = [[boites[0]]];
  for (const b of boites.slice(1)) {
    const ligne = lignes.at(-1)!;
    if (Math.abs(centre(b)[1] - centre(ligne.at(-1)!)[1]) < 100) ligne.push(b);
    else lignes.push([b]);
  }
  // taille de ligne qui regroupe le plus de cartes (écarte carnet et bouts du support)
  const tailles = plusFrequent(lignes.map((l) => l.length));
  const taille = [...tailles].sort((a, b) => b[0] * b[1] - a[0] * a[1] || b[0] - a[0])[0][0];
  return lignes
    .filter((l) => l.length === taille)
    .map((l) => l.sort((a, b) => centre(a)[0] - centre(b)[0]));
}
```

### Contrôle par couleur (porter, recalibrer)

```ts
// src/lib/skyjo/couleur.ts
import type { Boite } from "./grille";

export type Famille = "rouge" | "jaune" | "vert" | "bleu clair" | "bleu foncé";
export const FAMILLES: Record<Famille, { tranches: number[]; valeurs: number[] }> = {
  rouge: { tranches: [11, 0], valeurs: [9, 10, 11, 12] },
  jaune: { tranches: [1, 2], valeurs: [5, 6, 7, 8] },
  vert: { tranches: [3, 4], valeurs: [1, 2, 3, 4] },
  "bleu clair": { tranches: [5, 6], valeurs: [0] },
  "bleu foncé": { tranches: [7, 8], valeurs: [-2, -1] },
};

function hsv(r: number, g: number, b: number) {
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: ((h * 60) + 360) % 360, s: max ? d / max : 0, v: max / 255 };
}

export function familleCarte(rgba: Uint8ClampedArray, w: number, h: number, b: Boite): Famille | "dos" | null {
  const dx = (b[2] - b[0]) * 0.12, dy = (b[3] - b[1]) * 0.12; // on évite le bord blanc
  const x1 = Math.floor(((b[0] + dx) / 1000) * w), x2 = Math.floor(((b[2] - dx) / 1000) * w);
  const y1 = Math.floor(((b[1] + dy) / 1000) * h), y2 = Math.floor(((b[3] - dy) / 1000) * h);
  const pas = Math.max(1, Math.floor((x2 - x1) / 40)); // échantillonnage ~40 × 60 comme le POC
  const tranches = new Array(12).fill(0);
  for (let y = y1; y < y2; y += pas) for (let x = x1; x < x2; x += pas) {
    const i = (y * w + x) * 4;
    const { h: t, s, v } = hsv(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (s > 0.35 && v > 0.25) tranches[Math.floor(t / 30) % 12]++;
  }
  const total = tranches.reduce((a, n) => a + n, 0);
  if (total < 50) return null;
  if (Math.max(...tranches) / total < 0.5) return "dos";
  const somme = (f: Famille) => FAMILLES[f].tranches.reduce((a, i) => a + tranches[i], 0);
  return (Object.keys(FAMILLES) as Famille[]).sort((a, b) => somme(b) - somme(a))[0];
}
```

### Lecture OCR et vote (porter tel quel)

```ts
// src/lib/skyjo/lecture.ts
import type { Texte } from "./grille";
import { FAMILLES, type Famille } from "./couleur";

const VALEURS = Array.from({ length: 15 }, (_, i) => i - 2); // -2 à 12
const CORRECTIONS: Record<string, string> = { O: "0", o: "0", D: "0", I: "1", l: "1" };
const RETOURNEES: Record<string, number> = { OT: 10, OL: 10, "0T": 10, "0L": 10, T: 1 };
const RETOURNE: Record<number, number> = { 6: 9, 9: 6 };

export function lire(chaine: string): number | null {
  if (chaine in RETOURNEES) return RETOURNEES[chaine];
  const s = [...chaine].map((c) => CORRECTIONS[c] ?? c).join("");
  return /^-?\d{1,2}$/.test(s) && VALEURS.includes(+s) ? +s : null;
}

export function valeurCarte(textes: Texte[], famille: Famille | "dos" | null): number | null {
  if (famille === "dos") return null;
  const permises = famille ? FAMILLES[famille].valeurs : VALEURS;
  const votes = new Map<number, number>();
  for (const t of textes) {
    let v = lire(t.string);
    if (v !== null && !permises.includes(v)) v = RETOURNE[v] ?? null; // 6 sur carte rouge = 9
    if (v !== null && permises.includes(v)) votes.set(v, (votes.get(v) ?? 0) + (t.score || 0.1));
  }
  if (!votes.size) return permises.length === 1 ? permises[0] : null; // bleu clair = 0
  const tri = [...votes].sort((a, b) => b[1] - a[1]);
  return (tri.find(([v]) => v < 0) ?? tri[0])[0]; // le signe moins l'emporte
}
```

### Score (porter tel quel)

```ts
// src/lib/skyjo/score.ts
export type Grille = (number | null)[][]; // null = carte cachée

export function score(grille: Grille) {
  const colonnes = grille[0].map((_, c) => grille.map((ligne) => ligne[c]));
  const defaussees = colonnes.flatMap((col, i) =>
    col.length === 3 && col.every((v) => v !== null) && new Set(col).size === 1 ? [i] : []);
  const total = colonnes
    .filter((_, i) => !defaussees.includes(i))
    .flat()
    .reduce<number>((a, v) => a + (v ?? 0), 0);
  return { total, defaussees, cachees: grille.flat().filter((v) => v === null).length };
}
```

### Hors ligne (nouveau)

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // le modèle fait 21,6 Mo
        globPatterns: ["**/*.{js,css,html,wasm,cact,svg,png}"],
      },
      manifest: { name: "Skyjo Scan", short_name: "Skyjo", display: "standalone" },
    }),
  ],
  worker: { format: "es" },
});
```

## Risques et plan de validation

Le risque principal est l'appel au moteur WASM, non documenté et jamais exécuté. Il se valide en premier, avant toute interface.

| Risque | Impact | Validation ou parade |
| --- | --- | --- |
| API JS de `cactus.js` différente de `cactus.h` (BigInt, `null`, mémoire) | Bloquant | Page de test minimale qui charge le modèle et compare le JSON à celui du POC Python sur `skyjo.png` |
| Lenteur sur mobile (build WASM mono-cœur) | Expérience dégradée | Mesurer sur 2 téléphones ; réduire la photo à 1024 px si plus de 3 s |
| Mémoire : modèle 21,6 Mo + buffer 16 Mo + photo dans le tas WASM | Crash sur vieux téléphones | Libérer chaque buffer ; réduire `OUT_CAP` si possible |
| Règles OCR réglées sur 3 photos seulement | Scores faux | Jeu de 20 photos annotées (lumière, angle, -2, 11, 12) rejoué en test automatique |
| Couleurs faussées par l'éclairage (lampe chaude, ombre) | Mauvaise famille | Recalibrer les seuils sur le jeu de 20 photos ; la correction manuelle reste possible |
| Premier chargement de 23 Mo | Attente au premier lancement | Écran de téléchargement avec progression, puis cache PWA |
| Format JSON de Mirage qui change entre versions | Parsing cassé | Épingler la version du moteur et du modèle (v4.1.3) dans `/public` |

Ouvert : le moteur garde-t-il sa propre copie du modèle après `cactus_load` ? À vérifier avant de libérer la mémoire du `.cact`.

## Jalons et critères d'acceptation

Quatre jalons, chacun bloquant pour le suivant. Aucune date n'est fixée.

1. **J1, moteur WASM validé** : une page de test charge `cactus.wasm` + `mirage.cact` et produit sur `skyjo.png` un JSON équivalent à celui du POC Python.
2. **J2, logique portée** : `src/lib/skyjo/*` couvert par des tests Vitest sur les 3 JSON du POC (-1, 21, 6), contrôle couleur compris.
3. **J3, MVP utilisable** : photo → grille affichée → correction → score cumulé dans une partie, en moins de 3 s sur smartphone.
4. **J4, hors ligne et déployé** : PWA installée, fonctionne en mode avion, déployée sur Vercel, 95 % de scores exacts sur le jeu de 20 photos.

- [ ] Constituer le jeu de 20 photos annotées (score attendu par photo)
- [ ] Copier `cactus.js`, `cactus.wasm` (v4.1.3) et `mirage.cact` dans le projet
- [ ] Créer le projet : `pnpm create vite skyjo-scan --template react-ts`, puis Tailwind et shadcn/ui
