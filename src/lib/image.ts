export interface ImageRGB {
  rgb: Uint8Array;
  rgba: Uint8ClampedArray;
  width: number;
  height: number;
}

// Photo → RGB sans alpha, orientation EXIF corrigée (= exif_transpose du POC).
export async function versRGB(fichier: Blob, max = 1536): Promise<ImageRGB> {
  // Pixels bruts comme Pillow : pas de conversion de profil couleur ni d'alpha prémultiplié.
  const bitmap = await createImageBitmap(fichier, {
    imageOrientation: "from-image",
    colorSpaceConversion: "none",
    premultiplyAlpha: "none",
  });
  const k = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * k);
  const height = Math.round(bitmap.height * k);
  const ctx = new OffscreenCanvas(width, height).getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponible");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const rgba = ctx.getImageData(0, 0, width, height).data;
  const rgb = new Uint8Array(width * height * 3);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += 3) {
    rgb[j] = rgba[i];
    rgb[j + 1] = rgba[i + 1];
    rgb[j + 2] = rgba[i + 2];
  }
  return { rgb, rgba, width, height };
}

// Rotation de 90° dans le sens horaire (photo prise en paysage, cartes couchées).
export const tourner = ({ rgba, width, height }: ImageRGB): ImageRGB => {
  const out = new Uint8ClampedArray(rgba.length)
  const rgb = new Uint8Array(width * height * 3)
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const n = x * height + (height - 1 - y) // (x, y) → (hauteur - 1 - y, x) dans l'image tournée
      out.set(rgba.subarray(i, i + 4), n * 4)
      rgb[n * 3] = rgba[i]
      rgb[n * 3 + 1] = rgba[i + 1]
      rgb[n * 3 + 2] = rgba[i + 2]
    }
  return { rgb, rgba: out, width: height, height: width }
}

// Image affichable (JPEG) à partir des pixels, pour montrer la photo telle qu'analysée.
export const versBlob = async ({ rgba, width, height }: ImageRGB): Promise<Blob> => {
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponible')
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), width, height), 0, 0)
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
}

// Recadre une boîte (coordonnées Mirage 0-1000) avec une petite marge : relecture d'une carte seule.
export const recadrer = (
  { rgba, width, height }: ImageRGB,
  [bx1, by1, bx2, by2]: [number, number, number, number],
  marge = 0.08,
): ImageRGB => {
  const mx = (bx2 - bx1) * marge
  const my = (by2 - by1) * marge
  const x1 = Math.max(0, Math.floor(((bx1 - mx) / 1000) * width))
  const y1 = Math.max(0, Math.floor(((by1 - my) / 1000) * height))
  const x2 = Math.min(width, Math.ceil(((bx2 + mx) / 1000) * width))
  const y2 = Math.min(height, Math.ceil(((by2 + my) / 1000) * height))
  const w = x2 - x1
  const h = y2 - y1
  const out = new Uint8ClampedArray(w * h * 4)
  const rgb = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    out.set(rgba.subarray(((y1 + y) * width + x1) * 4, ((y1 + y) * width + x2) * 4), y * w * 4)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const j = (y * w + x) * 3
      rgb[j] = out[i]
      rgb[j + 1] = out[i + 1]
      rgb[j + 2] = out[i + 2]
    }
  }
  return { rgb, rgba: out, width: w, height: h }
}
