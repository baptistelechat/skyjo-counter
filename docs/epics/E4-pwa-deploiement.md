# E4 — Hors ligne et déployé (J4)

**But** : PWA installable qui marche en mode avion, déployée sur Vercel, 95 % de scores exacts sur 20 photos.

## Stories

- [x] **E4-S1 — PWA** : `vite-plugin-pwa` (precache de l'app seule, 20 fichiers / 544 Kio), manifest statique `public/manifest.webmanifest`, icônes générées depuis `public/icon.svg` (identité Carnet, `docs/design/`). Écart au PRD : `.wasm` + `.cact` ne sont pas précachés mais mis en Cache API par le worker au premier téléchargement (`skyjo-modele-cactus-4.1.4`), pour éviter de télécharger 21 Mo deux fois. Vérifié en `pnpm preview` : SW actif, app rechargée serveur coupé (21/11/2026).
- [ ] **E4-S2 — Mode avion** : test manuel installé + hors ligne sur Android et iOS.
- [ ] **E4-S3 — Jeu de 20 photos** : photos annotées (lumière, angle, -2, 11, 12) rejouées en test auto ; recalibrer les seuils couleur.
- [ ] **E4-S4 — Déploiement** : Vercel statique, headers de cache pour `/models` et `/cactus`.

## Critère d'acceptation

≥ 19/20 scores exacts, app fonctionnelle en mode avion après une visite, URL Vercel en prod.

## Dépendance externe

Les 20 photos annotées sont à prendre par Baptiste.
