import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import checker from "vite-plugin-checker";
import mkcert from "vite-plugin-mkcert";
import { qrcode } from "vite-plugin-qrcode";
import { VitePWA } from "vite-plugin-pwa";

interface FixtureRequest {
  nom: string;
  ext: string;
  photo: string; // base64
  wasm: unknown;
  meta: unknown;
}

// Dev uniquement : la page /?debug (ouverte depuis le téléphone) enregistre ses photos dans tests/fixtures.
// ponytail: aucun contrôle d'accès, le serveur de dev n'est exposé qu'au réseau local.
const DOSSIER = path.resolve(import.meta.dirname, "tests/fixtures");

// Fixtures dont la photo est présente sur ce poste, avec leur JSON de référence et le score attendu.
const listerFixtures = () =>
  readdirSync(DOSSIER).flatMap((fichier) => {
    const m = /^(.+)\.(png|jpg)$/.exec(fichier);
    if (!m) return [];
    const [, nom, ext] = m;
    const ref = existsSync(path.join(DOSSIER, `${nom}.mirage.json`))
      ? "mirage"
      : "wasm";
    const metaPath = path.join(DOSSIER, `${nom}.meta.json`);
    const score = /-(moins)?(\d+)/.exec(nom);
    const attendu = existsSync(metaPath)
      ? (JSON.parse(readFileSync(metaPath, "utf8")) as { attendu: number })
          .attendu
      : score && (score[1] ? -Number(score[2]) : Number(score[2]));
    return [{ nom, ext, ref, attendu }];
  });

const fixtures = (): Plugin => ({
  name: "skyjo-fixtures",
  apply: "serve",
  configureServer(server) {
    server.middlewares.use("/__fixtures", (req, res) => {
      if (req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        return void res.end(JSON.stringify(listerFixtures()));
      }
      if (req.method !== "POST") return void res.writeHead(405).end();
      const morceaux: Buffer[] = [];
      let taille = 0;
      req.on("data", (c: Buffer) => {
        taille += c.length;
        if (taille > 30 * 1024 * 1024) req.destroy();
        else morceaux.push(c);
      });
      req.on("end", () => {
        try {
          const f = JSON.parse(
            Buffer.concat(morceaux).toString("utf8"),
          ) as FixtureRequest;
          if (
            !/^[a-z0-9-]{1,60}$/.test(f.nom) ||
            !["jpg", "png"].includes(f.ext)
          )
            return void res.writeHead(400).end("Nom ou extension invalide");
          const dossier = DOSSIER;
          const photo = path.join(dossier, `${f.nom}.${f.ext}`);
          if (existsSync(photo))
            return void res.writeHead(409).end("Cette fixture existe déjà");
          writeFileSync(photo, Buffer.from(f.photo, "base64"));
          writeFileSync(
            path.join(dossier, `${f.nom}.wasm.json`),
            JSON.stringify(f.wasm, null, 2),
          );
          writeFileSync(
            path.join(dossier, `${f.nom}.meta.json`),
            JSON.stringify(f.meta, null, 2),
          );
          res.writeHead(201).end(`${f.nom}.${f.ext}`);
        } catch (e) {
          res.writeHead(400).end(String(e));
        }
      });
    });
  },
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checker({ typescript: true }),
    qrcode(),
    mkcert(),
    fixtures(),
    // Le SW ne précache que l'app : moteur et modèle (21 Mo) sont mis en cache par le worker
    // lui-même (src/worker/cactus.worker.ts), pour ne pas les télécharger deux fois.
    VitePWA({
      registerType: "autoUpdate",
      manifest: false, // manifest statique dans public/ (visible dès pnpm dev)
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff,woff2,webmanifest}"],
        globIgnores: ["**/models/**", "**/cactus/**", "og-image.png"],
        navigateFallbackDenylist: [/^\/__fixtures/],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "./src") } },
  server: { host: true },
  worker: { format: "es" },
});
