import type { Boite } from './grille'

export type Famille = 'rouge' | 'jaune' | 'vert' | 'bleu clair' | 'bleu foncé'
export type Couleur = Famille | 'dos' | null

// Teinte HSV (degrés) : [début, fin[ de chaque famille. Frontières au milieu des écarts mesurés sur les
// 12 fixtures (teinte médiane des cartes) : rouge -13..8, jaune 48..58, vert 113..130, bleu clair 188..199,
// bleu foncé 222..234. Marge la plus faible : bleu clair / bleu foncé, ±11° autour de 210.
export const FAMILLES: Record<Famille, { teinte: [number, number]; valeurs: number[] }> = {
  rouge: { teinte: [300, 388], valeurs: [9, 10, 11, 12] }, // 300-360 puis 0-28 (rose → orangé)
  jaune: { teinte: [28, 85], valeurs: [5, 6, 7, 8] },
  vert: { teinte: [85, 160], valeurs: [1, 2, 3, 4] },
  'bleu clair': { teinte: [160, 210], valeurs: [0] },
  'bleu foncé': { teinte: [210, 300], valeurs: [-2, -1] },
}
const NOMS = Object.keys(FAMILLES) as Famille[]

const hsv = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  let h = 0
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max / 255 }
}

const famille = (h: number): Famille =>
  NOMS.find((f) => {
    const [a, b] = FAMILLES[f].teinte
    return (a <= h && h < b) || (a <= h + 360 && h + 360 < b)
  }) ?? 'rouge'

// Seuil relatif plutôt qu'absolu : les photos réelles sont souvent délavées (saturation médiane 0,1 à 0,2 sur
// reel-61-mwmozhev). On garde la moitié la plus saturée des pixels de la carte : le fond coloré, pas le blanc.
// Dos arc-en-ciel = aucune famille ne fait 65 % de ces pixels (faces ≥ 75 %, dos ≤ 55 % sur les 12 fixtures).
// ponytail: HSV suffit (écarts de teinte nets) ; Lab/LCh si bleu clair / bleu foncé se confondent sur d'autres photos.
export const familleCarte = (rgba: Uint8ClampedArray, w: number, h: number, b: Boite): Couleur => {
  const dx = (b[2] - b[0]) * 0.12 // on évite le bord blanc
  const dy = (b[3] - b[1]) * 0.12
  const x1 = ((b[0] + dx) / 1000) * w
  const x2 = ((b[2] - dx) / 1000) * w
  const y1 = ((b[1] + dy) / 1000) * h
  const y2 = ((b[3] - dy) / 1000) * h
  const pixels: { h: number; s: number }[] = []
  for (let y = 0; y < 46; y++) // grille 30 × 46 sur la zone intérieure (≈ 40 × 60 sur la carte entière)
    for (let x = 0; x < 30; x++) {
      const i = (Math.floor(y1 + ((y + 0.5) * (y2 - y1)) / 46) * w + Math.floor(x1 + ((x + 0.5) * (x2 - x1)) / 30)) * 4
      const p = hsv(rgba[i], rgba[i + 1], rgba[i + 2])
      if (p.v > 0.25) pixels.push(p)
    }
  const mediane = pixels.map((p) => p.s).sort((a, c) => a - c)[pixels.length >> 1] ?? 0
  const colores = pixels.filter((p) => p.s >= Math.max(0.1, mediane))
  if (colores.length < 50) return null
  const n = new Map<Famille, number>(NOMS.map((f) => [f, 0]))
  for (const p of colores) n.set(famille(p.h), (n.get(famille(p.h)) ?? 0) + 1)
  const [premiere, nombre] = [...n].sort((a, c) => c[1] - a[1])[0]
  return nombre / colores.length < 0.65 ? 'dos' : premiere
}
