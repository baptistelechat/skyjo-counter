# Epics — Skyjo Scan

Découpage du [PRD](../PRD%20Skyjo%20Scan,%20compteur%20de%20points%20hors%20ligne.md). Un epic = un jalon, chacun bloquant pour le suivant.

| Epic                                                                  | Jalon    | Statut                                                                                        |
| --------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| [E1 — Moteur WASM validé](E1-moteur-wasm.md)                          | J1       | ✅ Validé (18/11/2026)                                                                        |
| [E2 — Logique Skyjo portée](E2-logique-skyjo.md)                      | J2       | ✅ Validé : 12/12 photos réelles, 52 tests Vitest (19/11/2026)                                |
| [E3 — MVP utilisable](E3-mvp.md)                                      | J3       | 🚧 6/7 stories (19/11/2026) — reste le test sur téléphones ; option A retenue pour la vitesse |
| [E4 — Hors ligne et déployé](E4-pwa-deploiement.md)                   | J4       | 🚧 1/4 stories (21/11/2026) — PWA + identité visuelle Carnet faites                           |
| [E5 — Historique des parties et statistiques](E5-historique-stats.md) | Après J4 | ✅ 6/6 stories (21/11/2026) — reste à valider sur téléphone                                   |

Décisions de cadrage (18/11/2026) : app Vite à la racine du repo, thème shadcn par défaut (`/brand-creator` plus tard), assets Cactus récupérés depuis la release officielle v4.1.3.

## Point d'avancement (19/11/2026)

Tout le pipeline de lecture est prêt (`scanner()` dans `src/lib/moteur.ts`, avec `onProgression`), et l'app est jouable : partie, scan par joueur, correction, tableau des scores (E3). Reste à la valider sur téléphone (E3-S7), puis E4. Vitesse : option A retenue, options B et C dans [vitesse-options.md](../vitesse-options.md).
