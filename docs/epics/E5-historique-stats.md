# E5 — Historique des parties et statistiques (après J4)

**But** : retrouver les parties passées et voir des statistiques par joueur, toujours 100 % hors ligne (IndexedDB), sans compte ni serveur.

> 📌 Point de départ (21/11/2026) : **aucun historique n'est gardé aujourd'hui**. `quitter()` dans `src/store/partie.ts` remet `partie` à `null`, et les grilles de chaque manche sont jetées à `validerManche()` (seuls les totaux restent, cf. [BDR-261119_2231-2](../../.claude/memory/decisions/BDR-261119_2231-2.md)). Tout ce qui précède la story E5-S1 est donc perdu.

## Stories

- [x] **E5-S1 — Archiver les parties** : à la fin d'une partie (ou à l'abandon, avec un statut `abandonnee`), l'ajouter à un historique persisté dans IndexedDB (clé séparée de la partie en cours, ex. `skyjo-scan:historique`). Champs : `id`, `joueurs`, `manches`, `creeLe`, `termineeLe`, `statut`, `gagnants`. Logique pure dans `src/lib/historique.ts`, testée. Versionner le format stocké (`version: 1`) pour pouvoir le faire évoluer.
- [x] **E5-S2 — Écran Historique** : liste des parties (date, joueurs, gagnant·e·s, nombre de manches), du plus récent au plus ancien ; ouvrir une partie affiche son `TableauScores` en lecture seule. Supprimer une partie (avec confirmation).
- [x] **E5-S3 — Joueurs connus** : proposer les prénoms déjà utilisés à la création d'une partie (autocomplétion), et regrouper les stats par prénom normalisé (`trim`, casse ignorée).
- [x] **E5-S4 — Statistiques par joueur** : parties jouées et gagnées (taux de victoire), score moyen par manche, meilleure et pire manche, moyenne de manches par partie. Tableau simple d'abord, graphique (évolution du score moyen) ensuite si utile.
- [x] **E5-S5 — Export / import** : exporter l'historique en JSON et le réimporter (changement de téléphone, sauvegarde), puisqu'il n'y a pas de synchro serveur.
- [x] **E5-S6 (option) — Garder les grilles** : conserver les grilles corrigées de chaque manche avec l'historique. Utile pour des stats fines (cartes les plus fréquentes, colonnes défaussées) **et** comme jeu de données vérifié pour l'option C de la vitesse ([vitesse-options.md](../vitesse-options.md)). Attention au volume : ne stocker que les valeurs, jamais les photos.

## Critère d'acceptation

Après plusieurs parties jouées, rechargement et mode avion compris : les parties terminées sont listées avec le bon gagnant, les stats d'un joueur sont exactes (vérifiées par des tests sur un historique fictif), et l'export puis l'import redonne le même historique.

## Réalisation (21/11/2026)

- Logique pure `src/lib/historique.ts` (archivage, joueurs connus, stats, export/import + validation), testée dans `tests/historique.test.ts` ; store séparé `src/store/historique.ts` (clé `skyjo-scan:historique`).
- Une partie terminée est archivée dès sa dernière manche ; une partie abandonnée l'est en la quittant, seulement si au moins une manche a été jouée.
- Grilles (S6) : `Partie.grilles[m][j]`, valeurs seules (`valeur`, `dos`), sans les doutes du scan ni la photo.
- Import = fusion par `id` (rien n'est écrasé ni dupliqué).
- Stats : tableau simple ; le graphique d'évolution reste à faire si utile.

## Décisions

- Partie abandonnée : ses manches comptent dans les moyennes, ni partie jouée ni victoire.

## Question ouverte

- Faut-il une limite de taille de l'historique (purge des plus anciennes) ? Non traitée pour l'instant.
