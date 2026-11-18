# E3 — MVP utilisable (J3)

**But** : photo → grille affichée → correction → score cumulé dans une partie, en < 3 s sur smartphone.

## Stories

- [ ] **E3-S1 — Partie** : créer une partie (noms des joueurs, 2 à 8), store Zustand persisté dans IndexedDB (`idb-keyval`).
- [ ] **E3-S2 — Écran de chargement** : téléchargement du modèle (~23 Mo) avec barre de progression au premier lancement.
- [ ] **E3-S3 — Scan** : `<input type="file" accept="image/*" capture="environment">` par joueur, envoi au worker, état « analyse… ».
- [ ] **E3-S4 — Grille lue** : grille 4×3 avec valeurs, dos, colonnes défaussées barrées, score de la manche.
- [ ] **E3-S5 — Correction** : tap sur une case → choix -2…12 ou dos ; score recalculé en direct ; saisie manuelle complète possible si le scan échoue.
- [ ] **E3-S6 — Tableau des scores** : cumul par manche, fin à 100 points, gagnant = plus petit total.
- [ ] **E3-S7 — Perf mobile** : mesurer sur 2 téléphones ; passer à 1024 px si > 3 s.

## Critère d'acceptation

Une partie complète jouable sur téléphone, scan < 3 s, rechargement de page sans perte de la partie. a11y : labels, `aria-live` sur le score, dialog de correction accessible.
