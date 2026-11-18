import type { Boite } from './grille'

export type Famille = 'rouge' | 'jaune' | 'vert' | 'bleu clair' | 'bleu foncé'
export type Couleur = Famille | 'dos' | null

// Teintes par tranches de 30° (0 = rouge, 6 = cyan, 7 = bleu…).
export const FAMILLES: Record<Famille, { tranches: number[]; valeurs: number[] }> = {
  rouge: { tranches: [11, 0], valeurs: [9, 10, 11, 12] },
  jaune: { tranches: [1, 2], valeurs: [5, 6, 7, 8] },
  vert: { tranches: [3, 4], valeurs: [1, 2, 3, 4] },
  'bleu clair': { tranches: [5, 6], valeurs: [0] },
  'bleu foncé': { tranches: [7, 8], valeurs: [-2, -1] },
}

const hsv = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max / 255 }
}

// ponytail: seuils réglés sur 3 photos, à recalibrer sur le jeu de 20 (E4-S3).
export const familleCarte = (rgba: Uint8ClampedArray, w: number, h: number, b: Boite): Couleur => {
  const dx = (b[2] - b[0]) * 0.12 // on évite le bord blanc
  const dy = (b[3] - b[1]) * 0.12
  const x1 = Math.floor(((b[0] + dx) / 1000) * w)
  const x2 = Math.floor(((b[2] - dx) / 1000) * w)
  const y1 = Math.floor(((b[1] + dy) / 1000) * h)
  const y2 = Math.floor(((b[3] - dy) / 1000) * h)
  const pasX = Math.max(1, (x2 - x1) / 40) // grille 40 × 60 comme le resize du POC
  const pasY = Math.max(1, (y2 - y1) / 60)
  const tranches = new Array<number>(12).fill(0)
  for (let y = y1; y < y2; y += pasY)
    for (let x = x1; x < x2; x += pasX) {
      const i = (Math.floor(y) * w + Math.floor(x)) * 4
      const { h: t, s, v } = hsv(rgba[i], rgba[i + 1], rgba[i + 2])
      if (s > 0.35 && v > 0.25) tranches[Math.floor(t / 30) % 12]++
    }
  const total = tranches.reduce((a, n) => a + n, 0)
  if (total < 50) return null
  if (Math.max(...tranches) / total < 0.5) return 'dos' // couleurs mélangées = dos arc-en-ciel
  const somme = (f: Famille) => FAMILLES[f].tranches.reduce((a, i) => a + tranches[i], 0)
  // Dos arc-en-ciel vu de biais : une couleur peut dominer, mais au moins 3 familles restent bien présentes.
  if ((Object.keys(FAMILLES) as Famille[]).filter((f) => somme(f) / total > 0.12).length >= 3) return 'dos'
  return (Object.keys(FAMILLES) as Famille[]).sort((a, b) => somme(b) - somme(a))[0]
}
