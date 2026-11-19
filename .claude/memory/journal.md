---
register: journal
---

## 2026-11-18

Initialisation du projet via `/project-init` : registres mémoire, `CLAUDE.md` généré depuis le PRD, branchement des plugins Vite (checker, qrcode, mkcert), changelog et README. Le build était cassé par le template Vite résiduel de `App.tsx`, remplacé par un écran minimal.

**Entrées clés :**

- [BDR-001](decisions/BDR-001.md) — inférence Mirage 100 % client
- [ZBLK-001](archive/blockers/ZBLK-001.md) — build cassé par le template

## 2026-11-19

Session longue (18 → 19/11) : découpage du PRD en 4 epics (docs/epics), scaffold Vite 8 + React 19 + Tailwind 4 + shadcn + Vitest, puis E1 et l'essentiel d'E2. E1 validé : Cactus 4.1.4 WASM + Mirage tournent dans un Web Worker et redonnent le JSON du POC Python sur les 3 photos de référence (cactus.js ignore locateFile, on passe wasmBinary). Logique Skyjo portée depuis les snippets du PRD, avec une page /?debug qui dessine la grille lue à côté de la photo.

Les tests au téléphone ont été durs : chaque nouvelle photo révélait un cas inédit (grille penchée, cartes couchées, carte ratée par Mirage, boîte parasite, cartes collées, grille petite dans la photo, noms de catégories Mirage changeants). Baptiste a ressenti une régression continue ; la mesure a montré le contraire (logique d'origine 0/6 photos réelles) et une cause de fond : les cartes de plus en plus petites dans l'image (22 % → 10 % de la largeur). Correctifs : sélection des cartes par leur forme, quadrillage avec cases estimées, recadrage automatique de la grille et relecture des cartes illisibles sur recadrage, règles de lecture par couleur (+10, signe moins). Un viseur caméra maison avec cadre rouge/vert a été livré trop vite puis retiré (photos délavées, faux « bien cadré »). Bouton « Enregistrer comme fixture » via un middleware Vite : 12 photos réelles validées 12/12 en analyse réelle (6 à 24 s). Photos gardées hors commit, JSON committés. Commit 258c500.

**Entrées clés :**

- [ZBLK-261118_2357-12](archive/blockers/ZBLK-261118_2357-12.md) — « De pire en pire » : photos plus dures, pas régression
- [BDR-261118_2357-3](decisions/BDR-261118_2357-3.md) — Recadrage auto de la grille si carte < 15 % de la photo
- [BDR-261118_2357-1](decisions/BDR-261118_2357-1.md) — Cartes choisies par leur forme 2:3
- [ZBLK-261118_2357-13](archive/blockers/ZBLK-261118_2357-13.md) — Viseur maison : photos délavées, faux « bien cadré »
---

Session fiabilité du scan. On a d'abord vérifié pourquoi le temps réel est hors de portée. La démo webcam de Cactus est une boucle d'une image toutes les quelques secondes, sur le même WASM mono-thread que nous. Les latences de 74-107 ms sont mesurées en natif sur NPU. Une passe Mirage coûte ~10 s dans l'app, et les options `sections`/`fields` n'en gagnent qu'environ 1.

Les 7 pistes de fiabilité ont ensuite été menées en deux vagues de sous-agents :

- vérité terrain carte par carte et banc de mesure ;
- confiance par carte et validation métier ;
- consignes de prise de vue et badges « à vérifier » ;
- couleur recalibrée avec les pixels (`jpeg-js` et `pngjs` en dev) ;
- relecture des cartes douteuses et mosaïque.

La mesure A/B réelle (ancienne version dans un worktree, onglet visible) a montré que la relecture des douteuses et la mosaïque rendaient le scan 21 % plus lent, avec un score faux de plus. Baptiste ne veut pas alourdir le traitement : retour à la relecture des seules illisibles (14,6 s contre 15,5 s, 144/144 cartes, 12/12 scores). La confiance a ensuite été recalibrée avec un plancher de 0,6 pour une lecture cohérente avec la couleur (fausses alertes 10 → 4). Tout est committé dans cf623a2. L'analyse progressive est confiée à une session séparée.

**Entrées clés :**

- [BDR-261119_2055-1](decisions/BDR-261119_2055-1.md) — Aucune passe Mirage en plus : relecture des seules illisibles
- [BDR-261119_2055-2](decisions/BDR-261119_2055-2.md) — Confiance par carte : plancher 0,6 si cohérente avec la couleur
- [LRN-261119_2055-7](learnings/LRN-261119_2055-7.md) — Gain estimé par un sous-agent : le mesurer en A/B avant de garder

---

Scan progressif (session lancée par la session principale) : `scanner()` accepte un callback `onProgression` qui émet la grille provisoire après chaque passe Mirage (1re lecture, passe recadrée ou tournée, relectures des illisibles). La page `/?debug` l'affiche avec une zone `aria-live` « Résultat provisoire… », un score grisé, puis marque « mise à jour » les cartes corrigées. Aucune passe ajoutée. Mesure A/B dans la même page sur les 12 fixtures : grilles finales identiques 12/12, même nombre de passes, temps non dégradé (264 s contre 222 s, bruit ±2× dû à une autre session active). 1re grille visible en 6 à 20 s au lieu de 11 à 46 s. react-doctor : un seul avertissement `async-defer-await`, faux positif (le test `fini` doit suivre l'`await`). vitest est resté bloqué 40 min chaîné derrière lint/build sous `rtk`, puis passé en 45 s lancé seul. Commit `dfcd5bc` poussé (le push a aussi emporté `cf623a2` de l'autre session).

**Entrées clés :**

- [BDR-261119_2132-1](decisions/BDR-261119_2132-1.md) — Scan progressif : callback onProgression, final inchangé
- [ZBLK-261119_2132-2](archive/blockers/ZBLK-261119_2132-2.md) — pnpm test chaîné : 40 min sans sortie


---

Point d'avancement sur les épics (E1 et E2 finis, E3 et E4 non commencés), puis épics mis à jour (E2-S6 cochée, travail du 19/11 documenté). Analyse de la vitesse de Mirage : Cactus est rapide en natif (NEON, multi-cœurs, NPU), mais le seul build WASM publié est mono-thread, sans WebGPU, et le moteur C est fermé, donc pas de recompilation possible. Trois options rédigées dans `docs/vitesse-options.md` : A (assumer l'attente) retenue pour le MVP, B (app native Capacitor) et C (pipeline spécialisé ONNX) gardées pour plus tard.

Implémentation d'E3 S1 à S6 : store de partie Zustand persisté dans IndexedDB, écrans nouvelle partie / manche / saisie joueur / tableau des scores, grille éditable avec dialog de correction, progression du téléchargement du modèle depuis le worker. Bug latent corrigé : les passes Mirage sont mises en file, un scan lancé pendant un autre récupérait la réponse du précédent. Composants photo et couleurs sortis de `debug/` pour être partagés. Vérifié dans Chrome (scan reel-48 → 48 en 13 s, rechargement sans perte), 58 tests verts, puis testé par Baptiste. Commit `0e3ed7a` poussé. Reste E3-S7 (mesures sur 2 téléphones) puis E4.

**Entrées clés :**

- [BDR-261119_2231-1](decisions/BDR-261119_2231-1.md) — Vitesse : option A pour le MVP, B et C documentées
- [BDR-261119_2231-2](decisions/BDR-261119_2231-2.md) — Partie : grilles saisies par joueur, score figé à la validation
