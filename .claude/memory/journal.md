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

- [BLK-261118_2357-12](blockers/BLK-261118_2357-12.md) — « De pire en pire » : photos plus dures, pas régression
- [BDR-261118_2357-3](decisions/BDR-261118_2357-3.md) — Recadrage auto de la grille si carte < 15 % de la photo
- [BDR-261118_2357-1](decisions/BDR-261118_2357-1.md) — Cartes choisies par leur forme 2:3
- [BLK-261118_2357-13](blockers/BLK-261118_2357-13.md) — Viseur maison : photos délavées, faux « bien cadré »
