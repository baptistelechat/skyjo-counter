# Brand Creator — Skyjo Scan

> Fichier de suivi du skill brand-creator. Ne pas supprimer avant la fin du workflow.

**Reprendre ici** : étape 16 — écrire `docs/design/DESIGN.md` (tokens appliqués dans `src/index.css`), puis Design System (17) et maquettes (18).
**Dernière mise à jour** : 2026-11-21
**Légende** : ⬜ à faire · 🔄 en cours · ⏸️ en attente de ta réponse · ✅ fait · ⏭️ ignorée (raison notée)

## Contexte (étape 1)

| Clé              | Valeur                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| Framework        | Vite (React 19)                                                        |
| `CSS_FILE`       | `src/index.css` (via `components.json`)                                |
| PWA              | oui — à fusionner avec E4-S1 (cache `.wasm` + `.cact`, limite 30 Mo)   |
| Icône principale | ScanText (alt. : NotebookPen, Grid3x3) |
| Couleurs projet  | aucune (thème shadcn `neutral` par défaut) — couleurs de données : familles de cartes rouge/jaune/vert/bleu clair/bleu foncé |

## Choix validés

| Point d'arrêt                     | Choix | Notes / ajustements |
| --------------------------------- | ----- | ------------------- |
| 1 · Direction UI (étape 5)        | Carnet | brand = primary (#1d3fbf) ; marge rouge #c62828 utilisée comme 2e couleur signature du logo |
| 2 · Logo (étape 7)                | S3 sur fond K, carte agrandie (L, 61 %) | masters : `docs/design/logo/` (noir + variante XL) |
| 3 · OG image (étape 11)           | Logo  | carte S seule au centre (pas la tuile, pour éviter la double marge) |
| 4 · Écrans à maquetter (étape 18) | —     |                     |

## Étapes

| #     | Étape                        | Statut | Livrable                              |
| ----- | ---------------------------- | ------ | ------------------------------------- |
| 1     | Contexte projet              | ✅     |                                       |
| 2-3   | Paths Lucide + technique SVG | ✅     |                                       |
| 4     | Moodboard UI                 | ✅     | `docs/design/identity-moodboard.html` |
| 5     | ⏸️ Choix direction           | ✅     |                                       |
| 6     | Moodboard logo               | ✅     | `docs/design/logo-creation.html`      |
| 7     | ⏸️ Choix logo                | ✅     |                                       |
| 8     | Export SVG                   | ✅     | `public/icon.svg`                     |
| 9-10  | Moodboard OG                 | ✅     | `docs/design/og-image-moodboard.html` |
| 11    | ⏸️ Choix OG                  | ✅     |                                       |
| 12    | og:image finale              | ✅     | `public/og-image.png`                 |
| 13-14 | PWA                          | ✅     | config fusionnée avec E4-S1           |
| 15    | Tokens CSS                   | ✅     | bloc pour `src/index.css`             |
| 16    | DESIGN.md + lint             | ⬜     | `docs/design/DESIGN.md`               |
| 17    | Design System Claude         | ⬜     |                                       |
| 18    | ⏸️ Maquettes Claude Design   | ⬜     |                                       |
| 19    | Rapport final                | ⬜     |                                       |

## Sous-tâches

### Étape 4 — Moodboard UI

- [x] Carnet · Tapis vert · Viseur · Altitude · Arc-en-ciel · Veillée
- [x] Vérification mécanique (clés, contrastes clair + sombre)

## Journal

- 2026-11-21 : lancement dans le cadre de l'épic E4 (PWA) — contexte collecté.
- 2026-11-21 : direction Carnet choisie, moodboard logo (18) généré.
- 2026-11-21 : fond K retenu, Baptiste demande de meilleures marques → 6 concepts « afficheur » sur fond K (`logo-creation-k.html`).
- 2026-11-21 : S3 provisoire ; série 3 en processus logo-design complet (carte de mots, test des pairs) → `logo-creation-k3.html`.
- 2026-11-21 : S3 retenu avec carte agrandie → `public/icon.svg` ; moodboard OG (Simple, Logo, Product, Stat, Grid, Showcase).
- 2026-11-21 : positionnement corrigé par Baptiste : **compteur de points d abord**, le scan est un raccourci de saisie → textes OG recentrés (à appliquer aussi au DESIGN.md, au manifest et aux meta).
- 2026-11-21 : og:image `public/og-image.png` (Logo), PWA configurée et vérifiée hors ligne, manifest + meta recentrés compteur.
- 2026-11-21 : tokens Carnet appliqués à `src/index.css` (oklch, polices fontsource hors ligne), accroche recentrée, favicon.svg supprimé, maskable + apple depuis une source plein cadre (`public/icon-maskable.svg`).

### Étape 6 — Moodboard logo

- [x] A-E (strict) · [x] F-J (dégradé) · [x] K-O (créatif) · [x] P-R (sur-mesure, `logo-design` : Bâtons, Carte tranchée, Colonne défaussée)
- [x] Vérification contrastes icône/fond (0 échec)
