import { describe, expect, it } from 'vitest'
import { tourner, type ImageRGB } from '../src/lib/image'
import { cartesCouchees, type Mirage } from '../src/lib/skyjo/grille'

describe('orientation', () => {
  it('tourne une image 2 × 1 de 90° horaire', () => {
    // pixels A (rouge) puis B (vert) sur une ligne → A en haut, B en bas après rotation
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255])
    const img: ImageRGB = { rgb: new Uint8Array(6), rgba, width: 2, height: 1 }
    const t = tourner(img)
    expect([t.width, t.height]).toEqual([1, 2])
    expect([...t.rgb]).toEqual([255, 0, 0, 0, 255, 0])
  })

  it('détecte les cartes couchées en pixels réels', () => {
    // boîte 100 × 100 sur 0-1000 : debout dans une photo portrait 3060 × 4080, couchée en paysage
    const m: Mirage = { objects: [{ name: 'tile', bbox: [100, 100, 200, 200] }], text: [] }
    expect(cartesCouchees(m, 4080, 3060)).toBe(true)
    expect(cartesCouchees(m, 3060, 4080)).toBe(false)
  })
})
