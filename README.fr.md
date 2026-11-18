<h1 align="center">Skyjo Scan 🃏</h1>

<p align="center">
  <b>Photographiez votre grille de Skyjo, obtenez le score de la manche instantanément.</b><br>
  <i>Tourne entièrement dans le navigateur — sans serveur, et hors ligne après la première visite.</i>
</p>

<p align="center">
  <a href="README.md">🇬🇧 Read in English</a>
</p>

![Status](https://shieldcn.dev/badge/status-work%20in%20progress-orange.svg)
![Offline](https://shieldcn.dev/badge/offline-first-green.svg)
![Built with Vite](https://shieldcn.dev/badge/built%20with-Vite-purple.svg)

---

> ⚠️ **En cours de développement** : le moteur d'inférence dans le navigateur est en cours de validation (épic E1). L'interface de scan et le suivi de partie décrits ci-dessous sont la cible du MVP.

## 📸 Captures d'écran

> _Ajouter des captures ici_

## 🚀 Fonctionnalités clés

- **De la photo au score** : prenez en photo, vue de dessus, la grille d'un joueur (4 colonnes × 3 lignes) ou importez une image, et l'app lit chaque carte puis calcule le score de la manche.
- **Entièrement hors ligne** : le modèle de vision Mirage et son moteur WebAssembly sont mis en cache sur l'appareil — l'app fonctionne en mode avion.
- **Lecture intelligente des cartes** : le modèle détecte les cartes et le texte, puis la couleur de la carte restreint les valeurs possibles et un vote OCR pondéré choisit le bon chiffre.
- **Colonnes défaussées** : une colonne de trois cartes visibles identiques est retirée du score automatiquement.
- **Correction en un tap** : touchez une carte pour corriger sa valeur (de -2 à 12) ou la marquer face cachée.
- **Suivi de partie** : créez une partie avec les noms des joueurs, les scores s'additionnent manche après manche et la partie s'arrête à 100 points en affichant le gagnant — tout est stocké localement dans IndexedDB.

## 💻 Stack technique

| Catégorie       | Technologies                                                                                                                                                                                                                                         |
| :-------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**    | ![Vite](https://shieldcn.dev/badge/Vite-8-purple.svg) ![React](https://shieldcn.dev/badge/React-19-blue.svg) ![TypeScript](https://shieldcn.dev/badge/TypeScript-7-blue.svg) ![Tailwind](https://shieldcn.dev/badge/Tailwind-4-cyan.svg) `shadcn/ui` |
| **Inférence**   | ![Cactus](https://shieldcn.dev/badge/Cactus-WASM%204.1.4-green.svg) modèle de vision Mirage, exécuté dans un Web Worker                                                                                                                              |
| **État**        | ![Zustand](https://shieldcn.dev/badge/Zustand-5-orange.svg) `idb-keyval` (IndexedDB)                                                                                                                                                                 |
| **Tests**       | ![Vitest](https://shieldcn.dev/badge/Vitest-5-yellow.svg) rejoue les sorties JSON de référence du POC Python                                                                                                                                         |
| **Hébergement** | ![Vercel](https://shieldcn.dev/badge/Vercel-static-black.svg) site statique, sans backend                                                                                                                                                            |

## 📦 Installation & démarrage

1. **Cloner le projet**
   ```bash
   git clone https://github.com/baptistelechat/skyjo.git
   cd skyjo
   ```
2. **Installer les dépendances**
   ```bash
   pnpm install
   ```
3. **Lancer le serveur de développement**
   ```bash
   pnpm dev
   ```
   Le serveur de dev tourne en HTTPS (certificat local) et affiche un QR code pour l'ouvrir sur votre téléphone depuis le même réseau.
4. **Lancer les tests**
   ```bash
   pnpm test
   ```

## 📂 Structure du projet

```
├── docs/
│   ├── epics/      # MVP découpé en épics (E1 moteur → E4 PWA & déploiement)
│   └── poc/        # preuve de concept Python servant de référence
├── public/
│   ├── cactus/     # moteur cactus.wasm
│   └── models/     # modèle mirage.cact
├── src/
│   ├── components/ # UI (shadcn/ui)
│   ├── lib/        # logique Skyjo (grille, couleur, lecture OCR, score)
│   └── vendor/     # cactus.js (chargeur Emscripten)
└── tests/
    └── fixtures/   # photos de référence + JSON Mirage (scores -1, 21, 6)
```

---

Fait avec ❤️ par [Baptiste Lechat](https://github.com/baptistelechat)

## 📝 Licence

Ce projet est sous licence MIT.
