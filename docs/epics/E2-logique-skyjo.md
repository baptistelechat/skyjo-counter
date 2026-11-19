# E2 — Logique Skyjo portée (J2)

**But** : `src/lib/skyjo/*` porté depuis le POC et couvert par Vitest sur les 3 JSON (-1, 21, 6).

## Stories

- [x] **E2-S1 — Grille** : `grille.ts` (sélection catégorie dominante, filtre > 200 000 u², regroupement en lignes, tri x).
- [x] **E2-S2 — Couleur** : `couleur.ts` (teinte dominante, bord exclu, dos si dominante < 50 %).
- [x] **E2-S3 — Lecture OCR** : `lecture.ts` (O→0, I→1, lectures retournées, 6↔9 hors famille, vote pondéré, le moins l'emporte).
- [x] **E2-S4 — Score** : `score.ts` (colonnes défaussées, somme des visibles, nb de cachées).
- [x] **E2-S5 — Pipeline** : `analyser(mirage, rgba, w, h)` → `{ grille, familles, score }`, une seule fonction appelée par l'UI.
- [x] **E2-S6 — Fixtures** : `tests/fixtures/` avec les 3 JSON POC + 9 photos réelles (`reel-*`) et `verite.json` (vérité terrain carte par carte) ; pixels décodés par `pngjs`/`jpeg-js` (`tests/pixels.ts`). ✅ 52/52 tests verts (`banc`, `reel`, `confiance`, `couleur`, `grille`, `orientation`).

## Avancement (18/11/2026)

Logique portée dans `src/lib/skyjo/` (`analyser()` dans `index.ts`) et branchée sur la page `/?debug`, qui dessine la grille lue à côté de la photo (cartes encadrées, couleur, valeur, colonnes défaussées, score vs attendu). Validé à la main dans Chrome sur la sortie **WASM** : -1 ✅, 21 ✅, 6 ✅, mêmes grilles que le POC Python. Reste S6 : tests Vitest automatiques (il faudra décoder les PNG côté Node, par ex. `pngjs`, pour le contrôle couleur).

### Premier test réel sur téléphone (18/11/2026)

Photo 3060×4080 analysée en **6,7 s** sur le téléphone de Baptiste, mais grille fausse (25 « cartes » sur une ligne). Deux causes corrigées dans `grille.ts` :

- Mirage renvoie aussi des boîtes **dans** les cartes (coins chiffrés, logo SKYJO), de même catégorie : on écarte une boîte dont > 60 % de l'aire est dans une plus grande.
- Grille **penchée** : le seuil fixe de 100 du POC ne tient pas. On redresse les centres de l'angle médian carte → voisine de droite, puis on coupe les lignes quand l'écart dépasse la demi-hauteur de la plus petite des deux boîtes (la perspective double la taille des cartes du bas, cf. grille-21).

Couvert par `tests/grille.test.ts` (fixtures 3 × 4 + grille synthétique penchée de 15° avec boîtes imbriquées). Reste à valider sur la vraie photo du téléphone (score attendu 48).

### 3 photos réelles, 3 angles (18/11/2026)

| Photo | Résultat | Cause | Correction |
| --- | --- | --- | --- |
| Bien droite | 48 ✅ | — | — |
| En biais | 36 (attendu 48) | Un 12 sans chiffre OCR lu, compté 0 ; un dos classé jaune | Cartes **illisibles** signalées (`Analyse.illisibles`, score « partiel ») ; dos = au moins 3 familles > 12 % des pixels colorés |
| Pivotée (EXIF paysage) | 0 | Cartes couchées à 90° : l'OCR ne lit plus les chiffres | `cartesCouchees()` (ratio en pixels) → `tourner()` + 2e passe, dans `src/lib/moteur.ts` (`scanner()`, réutilisable en E3) |

Non-régression : 36/36 cartes et -1, 21, 6 inchangés. Tests : `tests/orientation.test.ts`. À revalider sur les 3 photos réelles (à déposer dans `tests/fixtures/`).

### Fixtures réelles enregistrées depuis le téléphone (18/11/2026)

Bouton « Enregistrer comme fixture » sur `/?debug` (dev uniquement, middleware Vite dans `vite.config.ts`) → `tests/fixtures/reel-<score>-<id>.{jpg,wasm.json,meta.json}`. Aucune balise EXIF `Orientation` sur ces photos (Xiaomi 24090RA29G).

| Photo | Avant | Cause | Après |
| --- | --- | --- | --- |
| `reel-48-mwmloid8` | 36 | « 12 » lu « 2 » sur carte rouge | 48 ✅ (0/1/2 hors famille rouge → +10) |
| `reel-48-mwmlptxh` | 36 | Mirage rate un dos → ligne de 3 jetée (avec son 12) | 48 ✅, trou « non détectée » signalé |
| `reel-48-mwmlrnvn` | 48 | — | 48 ✅ |

Lignes incomplètes gardées (≥ moitié des cartes), chaque carte placée dans la colonne la plus proche (x redressé moyen des lignes complètes). Tests : `tests/reel.test.ts` (10 tests au total).

### Suite des tests réels (18/11/2026)

- `reel-48-mwmmakzd` : 28 → **48 ✅**. Mirage voyait les 12 cartes, mais une boîte parasite de 40×44 allongeait la 1re ligne à 5 → ligne jetée. Correctif : boîtes < 30 % de l'aire médiane écartées, ligne trop longue réduite à ses plus grandes boîtes.
- `reel-66-mwmmd09y` : 59 au lieu de 66, carte jaune (7) **sans aucun texte OCR** dans le JSON Mirage : limite du modèle, pas de la logique. Signalée ⚠️. Piste : relire les cartes illisibles en recadrant la photo sur la carte (plus de pixels pour l'OCR) et en relançant `describe` sur ce recadrage.

### Relecture par recadrage (18/11/2026)

Carte visible sans chiffre lu → `recadrer()` la photo sur sa boîte (+8 % de marge) → nouvelle passe `describe` → `relire()` (vote contraint par la couleur déjà connue). Branché dans `scanner()` (`src/lib/moteur.ts`). `reel-66-mwmmd09y` : 59 → **66 ✅** (« 7 », « L », « 4 » sur jaune → 7).

⚠️ Coût : une passe sur un recadrage prend presque autant que la photo entière (~7 s sur PC : Mirage redimensionne en interne).

### Comparatif logique d'origine vs actuelle (18/11/2026)

Sur les 9 fixtures (JSON seul, sans relecture) : logique d'origine du PRD **3/9** (que les photos du POC, 0/6 photos réelles), logique actuelle **8/9** (reel-66 = 66 avec la relecture). Nouvelle règle : chiffre lu sans son signe moins sur une carte bleu foncé (« 2 » → -2). `reel-34-mwmn4rfp` : score saisi 32, recompté **34** sur la photo (la carte verte est un 3), `meta.json` corrigé.

### Cartes collées : quadrillage (18/11/2026)

`reel-61-mwmo01e1` (cartes jointives, photo paysage) : Mirage fragmente ou fusionne les boîtes des cartes qui se touchent, mais l'OCR lit presque tous les chiffres. `grilleDeBoites` ne dépend plus d'une boîte par carte : colonnes (x redressé) et taille de carte mesurées sur les lignes complètes, nombre de colonnes = ligne la plus longue plafonnée à 4, ligne entière manquante insérée entre deux lignes connues (3 lignes max), case vide ou fragment (< 60 % d'une carte) remplacé par une **case estimée** du quadrillage. Analyse réelle : **61 ✅** en 27 s (rotation + 1 relecture). Les trous « non détectée » disparaissent (ptxh : case estimée, lue comme dos).

### Cause de fond : cartes trop petites dans la photo (18/11/2026)

Pas de régression : chaque ancienne photo donne un meilleur score qu'au moment de la prise. Mais la taille d'une carte dans l'image a baissé au fil des tests (POC 21-22 % de la largeur, puis 16 %, puis **10 %**) ; Mirage réduit toute la photo à une taille fixe, donc à 10 % il n'encadre que 7 cartes sur 12 et ne lit aucun « -1 ».

- **B · Recadrage automatique** (`scanner()`) : si une carte fait < 15 % du petit côté de la photo (`largeurCarte`), 2e passe sur `zoneGrille` (cartes + chiffres, + ½ carte de marge), combinée à la rotation si besoin. `reel-61-mwmoejrg` : 41 → **61 ✅** (28 s au lieu de 43 s, moins de relectures).
- ~~A · Viseur caméra~~ : **retiré**. La capture par le navigateur (`ImageCapture`) sort des photos deux fois moins saturées que l'appareil photo natif (0,13 contre 0,25 sur la même grille), et la mesure de cadrage par couleurs vives disait « bien cadré » trop loin. Retour à l'appareil photo natif ; la distance est compensée par B.

### Sélection des cartes par leur forme (18/11/2026)

Mirage nomme les cartes au hasard (« patch », « tile », « sticky note », « cutout »…) et mélange parfois plusieurs noms dans une même photo (`mozhev` recadrée : « tile » + « letter », et « number » pour les coins chiffrés). La catégorie la plus fréquente désignait alors les coins → 1re ligne perdue. `boitesCartes(m, ratio)` choisit désormais les rectangles de forme carte (largeur/hauteur en pixels 0,4-1,15 debout, 1,2-2,5 couchée, majorité gagnante), sans imbriquées ni doublons ni morceaux (< 30 % de l'aire médiane). `meta.json` porte `image` (dimensions analysées) pour les tests.

**Validation en analyse réelle (Mirage + rotation + recadrage + relecture) sur les 12 photos : 12/12 ✅**, de 6 à 24 s par photo (recadrage sur 5 photos, rotation sur 1, relecture d'une carte sur 3).

### Confiance et cartes douteuses (19/11/2026)

- Chaque carte porte une **confiance** et des alertes (`lecture.ts`, `validation.ts`) : couleur incohérente avec la valeur, nombre de cartes impossible dans le paquet, colonne presque défaussée. Plancher de cohérence couleur à 0,6. La page de debug affiche des badges « à vérifier » et des consignes photo.
- `familleCarte` (`couleur.ts`) recalibrée sur les 12 photos avec une saturation relative, pour les photos délavées.
- Le worker ne demande plus à Mirage que `objects` + `text` (~1 s de moins par passe).
- Décision : **aucune passe Mirage en plus** pour les cartes douteuses (A/B mesuré : +21 % de temps et un 12 lu 11). Seules les cartes illisibles sont relues.

### Affichage progressif (19/11/2026)

`scanner(photo, max, onProgression)` envoie la grille provisoire après chaque passe Mirage (1re lecture en 6-20 s), le résultat final ne change pas. La page de debug l'affiche dans une zone `aria-live` et marque les cartes mises à jour. 12/12 grilles finales identiques, temps non dégradé.

## Critère d'acceptation

`pnpm test` vert : 3/3 scores exacts, 36/36 familles de couleur. ✅ Dépassé : 12/12 scores exacts, 144/144 cartes.
