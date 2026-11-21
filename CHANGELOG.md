# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Lecture d'une photo de grille Skyjo par le modèle Mirage, entièrement dans le navigateur, avec la grille reconstituée et le score de la manche (page de test `/?debug`)
- Lecture fiable sur de vraies photos de téléphone : grille penchée ou pivotée, cartes collées, grille petite dans la photo (recadrage automatique), chiffres partiellement lus (relecture de la carte recadrée)
- Signalement des cartes visibles dont le chiffre n'a pas pu être lu, avec un score marqué « partiel »
- Boutons « Photo » (appareil photo) et « Galerie » adaptés au téléphone
- Badge « à vérifier » sur chaque carte douteuse, avec le motif : lecture peu sûre, valeur incompatible avec la couleur, plus d'exemplaires que dans le paquet, colonne presque défaussée ; résumé du nombre de cartes à vérifier en haut de la grille
- Consignes de prise de vue près du choix de photo (de face, assez près, sans reflet, cartes un peu écartées, appareil photo natif)
- Grille et score provisoires affichés dès la première lecture, puis affinés au fil des relectures, avec les cartes corrigées marquées « mise à jour » (sans allonger le scan)
- Partie complète jouable : création d'une partie de 2 à 8 joueurs, scan ou saisie manuelle de la grille de chaque joueur, tableau des scores cumulés par manche, fin de partie à 100 points et gagnant affiché (ex æquo gérés)
- Correction d'une carte d'un tap (choix de -2 à 12 ou dos), score recalculé en direct, nombre de colonnes réglable quand une colonne a été défaussée en cours de manche
- Partie conservée sur l'appareil : un rechargement de page ou une fermeture de l'onglet ne fait rien perdre, même hors ligne
- Barre de progression du téléchargement du modèle de lecture au premier lancement ; la saisie à la main reste possible pendant le chargement
- App installable sur l'écran d'accueil (PWA) et utilisable en mode avion après une première visite : l'app et le modèle de lecture restent en cache, le modèle n'est téléchargé qu'une fois
- Identité visuelle « Carnet » : icône (carte au S d'afficheur de score), couleurs encre et papier, polices manuscrite et très lisible, disponibles hors ligne
- Aperçu illustré quand on partage le lien de l'app
- Historique des parties, terminées ou abandonnées, gardé sur l'appareil : liste du plus récent au plus ancien, gagnant·e·s, tableau des scores en lecture seule, suppression d'une partie
- Statistiques par joueur : victoires et taux de victoire, score moyen par manche, meilleure et pire manche, nombre moyen de manches par partie (les manches d'une partie abandonnée comptent, pas ses victoires)
- Prénoms déjà joués proposés à la création d'une partie
- Export de l'historique en fichier JSON et réimport (changement de téléphone, sauvegarde), sans doublon

### Changed

- L'accueil présente l'app comme un compteur de points pour toute la partie, la photo de la grille devenant un raccourci de saisie

### Fixed

- Couleur des cartes reconnue sur les photos délavées, ce qui évite de mal lire un chiffre partiel (« 2 » sur une carte rouge = 12)
