import { familleCarte, type Couleur } from './couleur'
import { centre, contient, grilleDeBoites, type Boite, type Mirage, type Texte } from './grille'
import { valeurCarte } from './lecture'
import { score, type Grille, type Score } from './score'

export interface Carte {
  boite: Boite | null // null = carte que Mirage n'a pas détectée
  couleur: Couleur
  valeur: number | null
  textes: string[]
  relue?: boolean // valeur obtenue en relisant la carte recadrée
}

export interface Analyse {
  cartes: Carte[][]
  grille: Grille
  score: Score
  illisibles: number // carte visible (pas un dos) sans chiffre lu, ou non détectée : à corriger à la main
}

export const estIllisible = (c: Carte): boolean => c.valeur === null && c.couleur !== 'dos'

// Grille, score et alertes à partir des cartes lues.
export const resumer = (cartes: Carte[][]): Analyse => {
  const grille = cartes.map((l) => l.map((c) => c.valeur))
  return { cartes, grille, score: score(grille), illisibles: cartes.flat().filter(estIllisible).length }
}

// Pipeline complet : JSON Mirage + pixels → grille lue + score.
export const analyser = (m: Mirage, rgba: Uint8ClampedArray | null, w: number, h: number): Analyse =>
  resumer(
    grilleDeBoites(m, w / h).map((ligne) =>
      ligne.map((boite): Carte => {
        if (!boite) return { boite, couleur: null, valeur: null, textes: [] }
        const textes = m.text.filter((t) => contient(boite, centre(t.bbox)))
        const couleur = rgba ? familleCarte(rgba, w, h, boite) : null
        return { boite, couleur, valeur: valeurCarte(textes, couleur), textes: textes.map((t) => t.string) }
      }),
    ),
  )

// Relecture d'une carte illisible : tous les textes du recadrage, contraints par la couleur déjà connue.
export const relire = (carte: Carte, textes: Texte[]): Carte => {
  const valeur = valeurCarte(textes, carte.couleur)
  return valeur === null
    ? carte
    : { ...carte, valeur, relue: true, textes: [...carte.textes, ...textes.map((t) => `${t.string} (relu)`)] }
}

export type { Mirage } from './grille'
