# E1 — Moteur WASM validé (J1)

**But** : prouver que `cactus.wasm` + `mirage.cact` tournent dans un Web Worker et renvoient sur `skyjo.png` un JSON équivalent au POC Python. Aucune UI avant ça.

## Stories

- [x] **E1-S1 — Scaffold** : Vite + React + TS (pnpm) à la racine, Tailwind v4 (`@tailwindcss/vite`), shadcn/ui, Vitest, `git init`. ✅ `pnpm lint` + `pnpm build` passent.
- [x] **E1-S2 — Assets Cactus** : récupérer `cactus.js` + `cactus.wasm` v4.1.3 (build `wasm`) et `mirage.cact` ; `.wasm` dans `public/cactus/`, modèle dans `public/models/`, `cactus.js` dans `src/vendor/` avec `export default createCactus;`. Version épinglée notée ici.
  - ✅ **Moteur 4.1.4** (et non 4.1.3 comme dans le PRD) : c'est la version embarquée par `cactus-compute` 4.2.6, qui produit les JSON de référence. Source : Hugging Face `Cactus-Compute/cactus/releases/4.1.4/wasm` + `Cactus-Compute/mirage/mirage.cact`. `cactus.h` copié dans `docs/`. Exports confirmés : `ccall`, `HEAPU8`, `UTF8ToString`, `_malloc`, `_free`, `_cactus_*`.
- [x] **E1-S3 — Worker** : `src/worker/cactus.worker.ts` (snippet PRD) + `src/lib/json.ts` (réparation `-nan(ind)`) + `src/lib/image.ts` (photo → RGB).
- [x] **E1-S4 — Page de test** : route/page `?debug` qui charge une image, affiche le JSON brut, le temps d'inférence et l'état mémoire.
- [x] **E1-S5 — Points ouverts à trancher** : `BigInt` pour `n` de `cactus_load` ; `null` pour `language`/`keywords` ; le moteur garde-t-il sa copie du modèle (libérer `modelPtr` ou non) ; `OUT_CAP` réductible ?

## Résultats (18/11/2026) — ✅ J1 validé

Page de test : `/?debug` (`src/debug/MoteurTest.tsx`), image en pleine résolution comme le POC.

| Photo         | Taille    | Objets | Textes              | Écart bbox max                      | Temps WASM (Chrome) | Temps Python natif |
| ------------- | --------- | ------ | ------------------- | ----------------------------------- | ------------------- | ------------------ |
| grille-moins1 | 1536×1536 | 13/13  | 20/20 identiques    | 1                                   | 12,8 s              | 15,9 s             |
| grille-21     | 686×686   | 17/17  | 30/30 identiques    | 11                                  | 15,3 s              | 27,5 s             |
| grille-6      | 2147×2392 | 15/15  | 26/26, 3 différents | 235 (objet `letter`, pas une carte) | 12,9 s              | —                  |

Chargement moteur + modèle : ~0,9 s. Les 3 textes différents de grille-6 (`6`/`CS`/`ST` → `5s`/`S`/`STS`, score ~0,3) tombent sur des dos de carte : sans effet attendu sur le score, à confirmer en E2. Les pixels envoyés sont identiques au bit près à Pillow (SHA-256), donc l'écart vient du calcul WASM vs natif.

### Points ouverts tranchés (S5)

- `cactus_load(ptr, BigInt(n))` : OK (build compilé avec WASM_BIGINT).
- `language` / `keywords` : pointeur `0` (= `None` du binding Python). Options : `"{}"`.
- Le moteur **copie** le modèle : le binding Python libère ses octets juste après `cactus_load`, on fait `_free(modelPtr)` aussi.
- `cactus.js` **ignore `locateFile`** : le worker télécharge `/cactus/cactus.wasm` et le passe en `wasmBinary`.
- `OUT_CAP` : gardé à 16 Mo comme Python ; le JSON fait ~25 ko, réductible à 1 Mo en E3 si la mémoire mobile coince.
- Décodage photo : `colorSpaceConversion: 'none'` pour coller à Pillow ; seul le gamma PNG (`gAMA`) reste appliqué par Chrome.

### ⚠️ Risque relevé pour E3 : performance

~13 s par photo sur ce PC (4 cœurs), et le Python natif n'est pas plus rapide : c'est le coût du modèle, pas du WASM. L'objectif PRD « < 3 s sur smartphone » est hors d'atteinte en l'état. Pistes E3-S7 : réduire la photo (1024 px, puis moins), `cactus_set_threads`, mesurer sur téléphone, et assumer un écran d'attente.

## Critère d'acceptation

Le JSON produit sur `skyjo.png` contient les mêmes objets/textes que celui du POC Python (à tolérance de bbox près). Le temps desktop est noté.

## Fixtures de référence

`tests/fixtures/grille-{moins1,21,6}.png` + `.mirage.json`, générés le 18/11/2026 par `docs/poc/test_mirage_skyjo.py` (moteur 4.1.4). `docs/poc/score_skyjo.py` donne bien -1, 21 et 6.
