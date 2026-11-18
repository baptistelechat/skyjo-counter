import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { grilleDeBoites, type Boite, type Mirage } from '../src/lib/skyjo/grille'

const fixture = (nom: string): Mirage =>
  JSON.parse(readFileSync(new URL(`./fixtures/${nom}.mirage.json`, import.meta.url), 'utf8')) as Mirage

describe('grilleDeBoites', () => {
  // largeur / hauteur des photos du POC
  it.each([['grille-moins1', 1], ['grille-21', 1], ['grille-6', 2147 / 2392]] as const)('%s donne une grille 3 × 4', (nom, ratio) => {
    const g = grilleDeBoites(fixture(nom), ratio)
    expect(g.map((l) => l.length)).toEqual([4, 4, 4])
  })

  it('redresse une grille penchée et ignore les boîtes imbriquées', () => {
    // 3 × 4 cartes 140 × 180 tournées de 15°, + un coin chiffré et un logo DANS des cartes
    const t = (15 * Math.PI) / 180
    const objets: Mirage['objects'] = []
    const ids: string[] = []
    for (let l = 0; l < 3; l++)
      for (let c = 0; c < 4; c++) {
        const x = 150 + c * 170
        const y = 150 + l * 220
        const cx = 500 + (x - 500) * Math.cos(t) - (y - 500) * Math.sin(t)
        const cy = 500 + (x - 500) * Math.sin(t) + (y - 500) * Math.cos(t)
        objets.push({ name: 'patch', bbox: [cx - 70, cy - 90, cx + 70, cy + 90] })
        ids.push(`${l}${c}`)
      }
    const [x1, y1] = objets[3].bbox
    const [x5, y5] = objets[5].bbox
    objets.push({ name: 'patch', bbox: [x1 + 5, y1 + 5, x1 + 35, y1 + 40] as Boite })
    objets.push({ name: 'patch', bbox: [x5 + 10, y5 + 60, x5 + 120, y5 + 150] as Boite })

    const g = grilleDeBoites({ objects: objets, text: [] }, 1)
    const nom = (b: Boite) => ids[objets.findIndex((o) => o.bbox === b)]
    expect(g.map((l) => l.map(nom))).toEqual([
      ['00', '01', '02', '03'],
      ['10', '11', '12', '13'],
      ['20', '21', '22', '23'],
    ])
  })
})
