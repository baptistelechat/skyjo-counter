# E3 — MVP utilisable (J3)

**But** : photo → grille affichée → correction → score cumulé dans une partie, en < 3 s sur smartphone.

> ⚠️ Le « < 3 s » n'est pas atteignable avec Mirage en WASM. **Décision (19/11/2026) : option A** (attente assumée, grille provisoire, correction manuelle). Options B et C détaillées dans [vitesse-options.md](../vitesse-options.md).

## Stories

- [x] **E3-S1 — Partie** : créer une partie (noms des joueurs, 2 à 8), store Zustand persisté dans IndexedDB (`idb-keyval`). ✅ `src/store/partie.ts`, logique pure dans `src/lib/partie.ts`.
- [x] **E3-S2 — Écran de chargement** : téléchargement du modèle (~21 Mo) avec barre de progression au premier lancement. ✅ Le worker envoie la progression du téléchargement en flux (`progress`), affichée par `ChargementModele.tsx`. La saisie à la main reste possible pendant le chargement ou si le modèle échoue.
- [x] **E3-S3 — Scan** : `<input type="file" accept="image/*" capture="environment">` par joueur, envoi au worker, état « analyse… ». ✅ `SaisieJoueur.tsx` : grille provisoire après chaque passe, étape en cours annoncée (`aria-live`). Passes Mirage mises en file dans `moteur.ts` (un scan lancé pendant un autre ne récupère plus la mauvaise réponse).
- [x] **E3-S4 — Grille lue** : grille 4×3 avec valeurs, dos, colonnes défaussées barrées, score de la manche. ✅ `GrilleEditable.tsx` : couleur déduite de la valeur, badges « à vérifier » (doutes du scan) et « à saisir » (carte non lue).
- [x] **E3-S5 — Correction** : tap sur une case → choix -2…12 ou dos ; score recalculé en direct ; saisie manuelle complète possible si le scan échoue. ✅ Dialog accessible (`ChoixValeur.tsx`), nombre de colonnes réglable (colonnes défaussées retirées de la table en cours de manche).
- [x] **E3-S6 — Tableau des scores** : cumul par manche, fin à 100 points, gagnant = plus petit total (ex æquo gérés). ✅ `TableauScores.tsx`, tests dans `tests/partie.test.ts`.
- [ ] **E3-S7 — Perf mobile** : mesurer sur 2 téléphones. ~~Passer à 1024 px~~ : sans effet, Mirage redimensionne lui-même à 512 px. Choisir une piste de la section « Performance ».

## Avancement (19/11/2026)

Parcours complet vérifié dans Chrome (desktop) : création d'une partie à 2 joueurs, saisie manuelle d'une grille, scan de `reel-48-mwmlrnvn` (**48 ✅ en 13 s**, 1 passe), validation de la manche, rechargement de la page sans perte. Lint, build et 58 tests verts.

Reste : **E3-S7** (mesure sur 2 téléphones) et la validation du critère d'acceptation sur un vrai téléphone (partie complète jusqu'à 100 points).

## Performance (état au 19/11/2026)

Le temps se compte **en passes Mirage**, pas en pixels : ~10 s par passe sur PC, ~7 s sur le téléphone, et 1 à 4 passes par photo (photo, recadrage ou rotation, relecture des cartes illisibles). Résultat : 6 à 45 s par scan.

Pourquoi c'est lent dans le navigateur :
- le build WASM 4.1.4 est **mono-thread**, sans WebGPU, et c'est le seul publié. Le moteur C n'est pas open source (le repo GitHub ne contient que le Python), donc on ne peut pas le recompiler avec des threads ;
- les latences annoncées par Cactus (74 ms NPU, 107 ms CPU) sont mesurées **en natif** sur un Galaxy S26 ;
- Mirage est un modèle généraliste (~54 M paramètres, quantifié 2 bits, entrée 512 px) qui génère aussi les noms des objets token par token (2-3 s par passe).

Pistes, de la moins coûteuse à la plus rapide (✅ A retenue, détail dans [vitesse-options.md](../vitesse-options.md)) :

| Piste | Gain attendu | Coût |
| --- | --- | --- |
| A — Assumer l'attente : grille provisoire + correction manuelle, viser moins de passes (consignes photo pour éviter recadrage et rotation) | 6-10 s dans le cas courant | Faible |
| B — App native (Capacitor + SDK Cactus Android/iOS, CPU ARM/NPU) | ~10× | Moyen, quitte la PWA pure |
| C — Pipeline spécialisé : détection des cartes + couleur (déjà fait) + petit classifieur de chiffres (ONNX Runtime Web, WebGPU/multithread) | < 1 s | Élevé : entraîner un modèle sur des photos annotées |

## Critère d'acceptation

Une partie complète jouable sur téléphone, scan < 3 s, rechargement de page sans perte de la partie. a11y : labels, `aria-live` sur le score, dialog de correction accessible.
