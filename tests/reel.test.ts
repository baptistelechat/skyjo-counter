import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { grilleDeBoites, type Mirage } from '../src/lib/skyjo/grille'
import { valeurCarte } from '../src/lib/skyjo/lecture'

// Photos prises au téléphone (18/11/2026), JSON produit par le moteur WASM sur le téléphone.
const wasm = (nom: string): Mirage =>
  JSON.parse(readFileSync(new URL(`./fixtures/${nom}.wasm.json`, import.meta.url), 'utf8')) as Mirage

// largeur / hauteur de l'image analysée (meta.image), indispensable pour juger la forme 2:3 d'une carte
const ratio = (nom: string): number => {
  const { image } = JSON.parse(readFileSync(new URL(`./fixtures/${nom}.meta.json`, import.meta.url), 'utf8')) as { image: [number, number] }
  return image[0] / image[1]
}

describe('photos réelles', () => {
  it.each(['reel-48-mwmloid8', 'reel-48-mwmlrnvn', 'reel-48-mwmmakzd', 'reel-66-mwmmd09y', 'reel-34-mwmn4rfp', 'reel-61-mwmozhev'])('%s donne une grille 3 × 4', (nom) => {
    expect(grilleDeBoites(wasm(nom), ratio(nom)).map((l) => l.length)).toEqual([4, 4, 4])
  })

  it('estime la case d’une carte que Mirage a ratée (ptxh) à partir du quadrillage', () => {
    const m = wasm('reel-48-mwmlptxh')
    const g = grilleDeBoites(m, ratio('reel-48-mwmlptxh'))
    const deMirage = (b: unknown) => m.objects.some((o) => o.bbox === b)
    expect(g.map((l) => l.map((b) => (deMirage(b) ? 'o' : 'e')).join(''))).toEqual(['oooo', 'oeoo', 'oooo'])
  })

  it('reconstruit la grille 3 × 4 de cartes collées (reel-61, boîtes fragmentées)', () => {
    const g = grilleDeBoites(wasm('reel-61-mwmo01e1'), ratio('reel-61-mwmo01e1'))
    expect(g.map((l) => l.length)).toEqual([4, 4, 4])
  })

  it('lit un « 2 » sur une carte rouge comme un 12 (le « 1 » perdu)', () => {
    const t = (s: string) => ({ string: s, bbox: [0, 0, 1, 1] as [number, number, number, number], score: 0.5 })
    expect(valeurCarte([t('2')], 'rouge')).toBe(12)
    expect(valeurCarte([t('2')], 'vert')).toBe(2)
    expect(valeurCarte([t('6')], 'rouge')).toBe(9)
    expect(valeurCarte([t('2')], 'bleu foncé')).toBe(-2) // reel-32 : signe moins perdu
  })
})

describe('relecture d’une carte recadrée', () => {
  it('garde la valeur permise par la couleur (reel-66 : « 7 », « L », « 4 » sur jaune → 7)', async () => {
    const { relire } = await import('../src/lib/skyjo')
    const t = (s: string) => ({ string: s, bbox: [0, 0, 1, 1] as [number, number, number, number], score: 0.4 })
    const carte = { boite: [0, 0, 1, 1] as [number, number, number, number], couleur: 'jaune' as const, valeur: null, textes: [] }
    expect(relire(carte, [t('7'), t('L'), t('4')]).valeur).toBe(7)
    expect(relire(carte, [t('L')])).toBe(carte) // rien de lisible : la carte reste illisible
  })

  it('recadre une boîte avec sa marge', async () => {
    const { recadrer } = await import('../src/lib/image')
    const rgba = new Uint8ClampedArray(10 * 10 * 4).map((_, i) => i % 4 === 0 ? Math.floor(i / 40) : 0)
    const c = recadrer({ rgb: new Uint8Array(300), rgba, width: 10, height: 10 }, [200, 300, 600, 700], 0)
    expect([c.width, c.height]).toEqual([4, 4])
    expect(c.rgb[0]).toBe(3) // 1re ligne du recadrage = ligne 3 de l'image (rouge = n° de ligne)
  })
})
