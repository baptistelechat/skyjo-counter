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
