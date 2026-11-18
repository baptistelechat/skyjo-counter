# E4 — Hors ligne et déployé (J4)

**But** : PWA installable qui marche en mode avion, déployée sur Vercel, 95 % de scores exacts sur 20 photos.

## Stories

- [ ] **E4-S1 — PWA** : `vite-plugin-pwa` (snippet PRD), cache `.wasm` + `.cact` (limite 30 Mo), manifest + icônes.
- [ ] **E4-S2 — Mode avion** : test manuel installé + hors ligne sur Android et iOS.
- [ ] **E4-S3 — Jeu de 20 photos** : photos annotées (lumière, angle, -2, 11, 12) rejouées en test auto ; recalibrer les seuils couleur.
- [ ] **E4-S4 — Déploiement** : Vercel statique, headers de cache pour `/models` et `/cactus`.

## Critère d'acceptation

≥ 19/20 scores exacts, app fonctionnelle en mode avion après une visite, URL Vercel en prod.

## Dépendance externe

Les 20 photos annotées sont à prendre par Baptiste.
