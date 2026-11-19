import { familleCarte, type Couleur } from './couleur'
import { centre, contient, grilleDeBoites, type Boite, type Mirage, type Texte } from './grille'
import { lireCarte } from './lecture'
import { score, type Grille, type Score } from './score'
import { aVerifier, valider } from './validation'

export interface Carte {
  boite: Boite | null // null = carte que Mirage n'a pas détectée
  couleur: Couleur
  valeur: number | null
  textes: string[]
  relue?: boolean // valeur obtenue en relisant la carte recadrée
  confiance?: number // 0 à 1 (absente = saisie à la main)
  alertes?: string[] // règles métier non respectées (validation.ts)
}

export interface Analyse {
  cartes: Carte[][]
  grille: Grille
  score: Score
  illisibles: number // carte visible (pas un dos) sans chiffre lu, ou non détectée : à corriger à la main
  aVerifier: number // cartes de confiance < 0,5 ou avec au moins une alerte
}

export const estIllisible = (c: Carte): boolean => c.valeur === null && c.couleur !== 'dos'

// Grille, score et alertes à partir des cartes lues.
export const resumer = (lues: Carte[][]): Analyse => {
  const cartes = valider(lues)
  const grille = cartes.map((l) => l.map((c) => c.valeur))
  return {
    cartes,
    grille,
    score: score(grille),
    illisibles: cartes.flat().filter(estIllisible).length,
    aVerifier: cartes.flat().filter(aVerifier).length,
  }
}

// Pipeline complet : JSON Mirage + pixels → grille lue + score.
export const analyser = (m: Mirage, rgba: Uint8ClampedArray | null, w: number, h: number): Analyse =>
  resumer(
    grilleDeBoites(m, w / h).map((ligne) =>
      ligne.map((boite): Carte => {
        if (!boite) return { boite, couleur: null, valeur: null, textes: [], confiance: 0 }
        const textes = m.text.filter((t) => contient(boite, centre(t.bbox)))
        const couleur = rgba ? familleCarte(rgba, w, h, boite) : null
        const estimee = !m.objects.some((o) => o.bbox === boite) // case déduite du quadrillage
        const { valeur, confiance } = lireCarte(textes, couleur, { estimee })
        return { boite, couleur, valeur, confiance, textes: textes.map((t) => t.string) }
      }),
    ),
  )

// Relecture d'une carte illisible : tous les textes du recadrage, contraints par la couleur déjà connue.
export const relire = (carte: Carte, textes: Texte[]): Carte => {
  const { valeur, confiance } = lireCarte(textes, carte.couleur, { relue: true })
  return valeur === null
    ? carte
    : { ...carte, valeur, confiance, relue: true, textes: [...carte.textes, ...textes.map((t) => `${t.string} (relu)`)] }
}

export type { Mirage } from './grille'
