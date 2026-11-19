import { existsSync, readFileSync } from "node:fs";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { recadrer, tourner, type ImageRGB } from "../src/lib/image";
import type { Boite } from "../src/lib/skyjo/grille";

// Pixels de l'image qu'a analysée l'app, reconstruits en Node : décodage pur JS, orientation EXIF,
// puis recadrage et rotation décrits dans meta.json (mêmes fonctions que src/lib/moteur.ts).

const fx = (f: string) => new URL(`./fixtures/${f}`, import.meta.url);

// Tag EXIF Orientation (0x0112) de l'IFD0, 1 si absent.
export const orientationExif = (d: Uint8Array): number => {
  let p = 2;
  while (p + 4 < d.length && d[p] === 0xff) {
    const marqueur = d[p + 1];
    const taille = (d[p + 2] << 8) | d[p + 3];
    const exif = String.fromCharCode(...d.subarray(p + 4, p + 8)) === "Exif";
    if (marqueur === 0xe1 && exif) {
      const t = p + 10; // début TIFF
      const le = d[t] === 0x49; // 'II' = little endian
      const u16 = (o: number) =>
        le ? d[o] | (d[o + 1] << 8) : (d[o] << 8) | d[o + 1];
      const u32 = (o: number) =>
        le ? u16(o) + u16(o + 2) * 65536 : u16(o) * 65536 + u16(o + 2);
      const ifd = t + u32(t + 4);
      for (let i = 0; i < u16(ifd); i++) {
        const e = ifd + 2 + i * 12;
        if (u16(e) === 0x0112) return u16(e + 8);
      }
      return 1;
    }
    if (marqueur === 0xda) break; // début des données image
    p += 2 + taille;
  }
  return 1;
};

const avecRgb = (
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): ImageRGB => ({
  rgba,
  width,
  height,
  rgb: new Uint8Array(0), // inutile pour la couleur ; tourner() le recalcule
});

// Comme createImageBitmap({ imageOrientation: 'from-image' }).
// ponytail: orientations 1, 3, 6, 8 seulement (rotations) ; les miroirs (2, 4, 5, 7) n'existent pas sur ces téléphones.
const orienter = (img: ImageRGB, o: number): ImageRGB => {
  // 0 (invalide, vu sur reel-48) = 1, comme le navigateur.
  const quarts = { 0: 0, 1: 0, 3: 2, 6: 1, 8: 3 }[o];
  if (quarts === undefined) throw new Error(`Orientation EXIF ${o} non gérée`);
  let r = img;
  for (let i = 0; i < quarts; i++) r = tourner(r);
  return r;
};

export interface Fixture {
  image: ImageRGB;
  attendue: [number, number] | null; // meta.image : dimensions analysées par l'app (null pour le POC)
}

// Décodage selon les octets, pas l'extension : grille-21.png est en réalité un JPEG.
const decoder = (brut: Uint8Array): ImageRGB => {
  if (brut[0] === 0x89) {
    const png = PNG.sync.read(Buffer.from(brut))
    return avecRgb(new Uint8ClampedArray(png.data), png.width, png.height)
  }
  const j = jpeg.decode(brut, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 1024 })
  return orienter(avecRgb(new Uint8ClampedArray(j.data), j.width, j.height), orientationExif(brut))
}

export const chargerPixels = (nom: string): Fixture => {
  const png = existsSync(fx(`${nom}.png`))
  let image = decoder(new Uint8Array(readFileSync(fx(`${nom}.${png ? 'png' : 'jpg'}`))))
  if (png) return { image, attendue: null } // photos du POC : analysées telles quelles
  const meta = JSON.parse(readFileSync(fx(`${nom}.meta.json`), 'utf8')) as {
    tournee: boolean
    recadrage?: Boite | null
    image: [number, number]
  }
  if (meta.recadrage) image = recadrer(image, meta.recadrage, 0)
  if (meta.tournee) image = tourner(image)
  return { image, attendue: meta.image }
}
