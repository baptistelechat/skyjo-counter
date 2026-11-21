import { defineConfig, minimalPreset } from "@vite-pwa/assets-generator/config";

// Maskable (Android) et apple-touch-icon (iOS) : la plateforme applique son propre masque,
// donc source carrée plein cadre (public/icon-maskable.svg), sans marge ni coins arrondis.
export default defineConfig({
  preset: {
    ...minimalPreset,
    transparent: { sizes: [], favicons: [] },
    maskable: { sizes: [512], padding: 0, resizeOptions: { background: "#1d3fbf" } },
    apple: { sizes: [180], padding: 0, resizeOptions: { background: "#1d3fbf" } },
  },
  images: ["public/icon-maskable.svg"],
});
