## 💻 Skyjo Scan

Skyjo Scan calcule le score d'une manche de Skyjo à partir d'une photo de la grille, entièrement dans le navigateur, sans serveur et hors ligne après le premier chargement. Cible : des joueurs autour d'une table, souvent sans bon réseau.

### Stack technique

- **Langage** : TypeScript
- **Framework** : React 19 + Vite 8
- **Runtime / Package manager** : Node.js + pnpm
- **Styling** : Tailwind CSS 4 (`@tailwindcss/vite`) + shadcn/ui (Base UI)
- **État / stockage** : Zustand + IndexedDB (`idb-keyval`)
- **Inférence** : Cactus Compute (build WASM, moteur 4.1.4) + modèle Mirage, dans un Web Worker
- **Tests** : Vitest (rejoue les JSON Mirage du POC)
- **Déploiement** : Vercel, site statique

### Architecture

App 100 % client : la photo devient des pixels RGB, part au Web Worker qui exécute Mirage via `cactus.wasm`, revient en JSON, puis la logique Skyjo calcule grille et score sur le thread principal. Spécification dans `docs/PRD Skyjo Scan, compteur de points hors ligne.md`, découpage en épics dans `docs/epics/`, POC Python de référence dans `docs/poc/`.

### Conventions importantes

- Lint via `oxlint` (pas ESLint) ; `src/vendor/**` est ignoré.
- Assets Cactus : `.wasm` dans `public/cactus/`, modèle dans `public/models/`, `cactus.js` dans `src/vendor/`.
- Fixtures de référence dans `tests/fixtures/grille-{moins1,21,6}.{png,mirage.json}` (scores attendus -1, 21, 6).
- Alias `@` → `./src`.
