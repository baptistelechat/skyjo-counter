export type Grille = (number | null)[][] // null = carte cachée

export interface Score {
  total: number
  defaussees: number[]
  cachees: number
}

// Colonne de 3 cartes visibles identiques = défaussée, puis somme des cartes visibles.
export const score = (grille: Grille): Score => {
  if (!grille.length) return { total: 0, defaussees: [], cachees: 0 }
  const colonnes = grille[0].map((_, c) => grille.map((ligne) => ligne[c]))
  const defaussees = colonnes.flatMap((col, i) =>
    col.length === 3 && col.every((v) => v !== null) && new Set(col).size === 1 ? [i] : [],
  )
  const total = colonnes
    .filter((_, i) => !defaussees.includes(i))
    .flat()
    .reduce<number>((a, v) => a + (v ?? 0), 0)
  return { total, defaussees, cachees: grille.flat().filter((v) => v === null).length }
}
