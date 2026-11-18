<h1 align="center">Skyjo Scan 🃏</h1>

<p align="center">
  <b>Snap a photo of your Skyjo grid, get the round score instantly.</b><br>
  <i>Runs entirely in your browser — no server, and offline after the first visit.</i>
</p>

<p align="center">
  <a href="README.fr.md">🇫🇷 Lire en français</a>
</p>

![Status](https://shieldcn.dev/badge/status-work%20in%20progress-orange.svg)
![Offline](https://shieldcn.dev/badge/offline-first-green.svg)
![Built with Vite](https://shieldcn.dev/badge/built%20with-Vite-purple.svg)

---

> ⚠️ **Work in progress**: the in-browser inference engine is being validated (epic E1). The scanning UI and game tracking described below are the MVP target.

## 📸 Screenshots

> _Add screenshots here_

## 🚀 Key Features

- **Photo to score**: take a top-down photo of a player's grid (4 columns × 3 rows) or import an image, and the app reads every card and computes the round score.
- **Fully offline**: the Mirage vision model and its WebAssembly engine are cached on your device — the app keeps working in airplane mode.
- **Smart card reading**: the model detects cards and text, then card color narrows down the allowed values and a weighted OCR vote picks the right number.
- **Discarded columns**: a column of three identical visible cards is removed from the score automatically.
- **One-tap correction**: tap any card to fix its value (-2 to 12) or mark it as face down.
- **Game tracking**: create a game with player names, scores add up round after round, and the game ends at 100 points with the winner displayed — all stored locally in IndexedDB.

## 💻 Technical Stack

| Category      | Technologies                                                                                                                                                                                                                                         |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**  | ![Vite](https://shieldcn.dev/badge/Vite-8-purple.svg) ![React](https://shieldcn.dev/badge/React-19-blue.svg) ![TypeScript](https://shieldcn.dev/badge/TypeScript-7-blue.svg) ![Tailwind](https://shieldcn.dev/badge/Tailwind-4-cyan.svg) `shadcn/ui` |
| **Inference** | ![Cactus](https://shieldcn.dev/badge/Cactus-WASM%204.1.4-green.svg) Mirage vision model, run in a Web Worker                                                                                                                                         |
| **State**     | ![Zustand](https://shieldcn.dev/badge/Zustand-5-orange.svg) `idb-keyval` (IndexedDB)                                                                                                                                                                 |
| **Tests**     | ![Vitest](https://shieldcn.dev/badge/Vitest-5-yellow.svg) replays the reference JSON outputs from the Python POC                                                                                                                                     |
| **Hosting**   | ![Vercel](https://shieldcn.dev/badge/Vercel-static-black.svg) static site, no backend                                                                                                                                                                |

## 📦 Installation & Getting Started

1. **Clone the project**
   ```bash
   git clone https://github.com/baptistelechat/skyjo.git
   cd skyjo
   ```
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Start the development server**
   ```bash
   pnpm dev
   ```
   The dev server runs over HTTPS (local certificate) and prints a QR code to open it on your phone from the same network.
4. **Run the tests**
   ```bash
   pnpm test
   ```

## 📂 Project Structure

```
├── docs/
│   ├── epics/      # MVP broken down into epics (E1 engine → E4 PWA & deploy)
│   └── poc/        # Python proof of concept used as the reference
├── public/
│   ├── cactus/     # cactus.wasm engine
│   └── models/     # mirage.cact model
├── src/
│   ├── components/ # UI (shadcn/ui)
│   ├── lib/        # Skyjo logic (grid, color, OCR reading, score)
│   └── vendor/     # cactus.js (Emscripten loader)
└── tests/
    └── fixtures/   # reference photos + Mirage JSON (scores -1, 21, 6)
```

---

Made with ❤️ by [Baptiste Lechat](https://github.com/baptistelechat)

## 📝 License

This project is under MIT license.
