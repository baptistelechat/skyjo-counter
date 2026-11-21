import { defineConfig, minimalPreset } from "@vite-pwa/assets-generator/config";

// Icônes « any » + favicon depuis public/icon.svg (tuile arrondie).
// Maskable et Apple viennent d'une source plein cadre : voir pwa-assets-maskable.config.ts.
export default defineConfig({
  preset: {
    ...minimalPreset,
    maskable: { sizes: [] },
    apple: { sizes: [] },
  },
  images: ["public/icon.svg"],
});
