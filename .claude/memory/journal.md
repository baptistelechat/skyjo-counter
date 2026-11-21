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

## 2026-11-21

Session de test du mode partie (commit `0e3ed7a`). Après une checklist de test manuelle pour Baptiste, Claude a joué tout le parcours lui-même dans le browser pane, en injectant les photos réelles du repo dans le champ « Galerie » (fetch + DataTransfer). Tout est passé : création (min 2, max 8, prénoms nettoyés), scans réels justes (48 en 12 s, 66 en 25 s), correction au clavier avec focus restitué, colonnes identiques barrées, rechargement sans perte, fin à 100 avec ex æquo (120-120), file des passes Mirage correcte quand on abandonne un scan pour en lancer un autre.

Remarques UX relevées, non corrigées : « Retirer une colonne » retire toujours la dernière et perd ses valeurs si on la rajoute ; une grille se valide avec des cartes « à saisir » comptées 0 ; quitter l'écran d'un joueur pendant le scan perd ce scan ; pas d'`aria-live` sur le tableau des scores entre les manches (demandé par le critère E3).

Constat : aucun historique n'est gardé (`quitter()` remet la partie à `null`). Création de l'épic E5 « Historique des parties et statistiques » (6 stories, archivage IndexedDB versionné en S1). `.vitest/` ajouté au `.gitignore`. Commit `e429ea6` poussé. Reste : test sur un vrai téléphone (E3-S7).

**Entrées clés :**

- [LRN-261121_1230-1](learnings/LRN-261121_1230-1.md) — Tester un upload photo sans sélecteur : fetch + DataTransfer

---

Démarrage de l'épic E4 (hors ligne et déployé) par l'identité visuelle, via brand-creator. Six directions proposées, Baptiste choisit « Carnet » (encre de stylo bille, papier à carreaux, marge rouge). Côté logo, la première série (icônes Lucide + 3 concepts logo-design en fast track) ne convainc pas : Baptiste retient le fond K et demande de meilleures marques. Deuxième série autour d'un S en segments d'afficheur de score ; il choisit S3 (une carte dont la face montre le S), puis demande de vérifier que logo-design est bien suivi : troisième série en processus complet (carte de mots, types de marque, test des pairs), mais S3 reste le choix, avec une carte agrandie à 61 % de la tuile.

Pendant le moodboard og:image, Baptiste recadre le positionnement : Skyjo Scan est d'abord un compteur de points, le scan n'est qu'un raccourci de saisie. Les textes (og:image, manifest, meta, accroche de l'accueil) sont réécrits dans ce sens ; il choisit le gabarit « Logo ».

PWA (E4-S1) : vite-plugin-pwa avec manifest statique, icônes générées (maskable et apple depuis une source plein cadre dédiée), og-image.png rendue par Satori hors du repo. Écart volontaire au PRD : le modèle et le moteur ne sont pas précachés par le SW (double téléchargement de 21 Mo) mais mis en Cache API par le worker. Vérifié en pnpm preview, serveur coupé. Tokens Carnet appliqués à src/index.css avec des polices fontsource, pour qu'elles marchent hors ligne. Commit cb0fd20, non poussé. Restent : brand-creator étapes 16 à 18 (DESIGN.md, Design System, maquettes), E4-S2 à S4, et recentrer CLAUDE.md sur le compteur.

**Entrées clés :**

- [BDR-261121_1332-1](decisions/BDR-261121_1332-1.md) — Skyjo Scan = compteur d'abord, le scan est un raccourci
- [BDR-261121_1332-3](decisions/BDR-261121_1332-3.md) — Modèle mis en cache par le worker (Cache API), pas le SW

---

Épic 5 (historique des parties et statistiques) développé pendant qu'une autre conversation terminait l'épic 4 sur `main` : travail isolé dans un worktree `epic-5` pour éviter toute collision (builds, lockfile, commits). Périmètre validé : S1 à S6 ; parties abandonnées comptées pour leurs manches mais pas pour les victoires. Livré : store et clé IndexedDB séparés, archivage automatique en fin de partie ou à l'abandon, écran Historique (liste, détail en lecture seule, suppression), prénoms connus en autocomplétion (`datalist`), stats par joueur, export/import JSON fusionné par id, grilles gardées (valeurs seules). 65 tests Vitest, vérification réelle dans le navigateur en injectant des parties dans IndexedDB.

Une fois l'épic 4 fini (PWA + identité visuelle Carnet), rebase sur `main` avec deux conflits (`App.tsx`, README des épics) résolus en gardant les deux côtés, puis application de la DA Carnet aux écrans Historique (titres Patrick Hand bleu encre, marge rouge sur les cartes, méta en Courier Prime). Fusion en avance rapide dans `main`, changelog mis à jour. Le nettoyage du worktree a buté sur des binaires pnpm liés physiquement au `node_modules` principal encore chargé par les serveurs de dev : dossier à supprimer après arrêt des serveurs.

**Entrées clés :**

- [BDR-261121_1437-1](decisions/BDR-261121_1437-1.md) — Historique : clé séparée, archivage auto, fusion par id
- [BLK-261121_1437-3](blockers/BLK-261121_1437-3.md) — Dossier worktree epic-5 impossible à supprimer
