// Sous Windows le moteur peut écrire `-nan(ind)` : on remplace nan/inf par null avant JSON.parse.
export const parseMirage = (brut: string): unknown =>
  JSON.parse(brut.replace(/-?(nan|inf|infinity)(\(ind\))?(?![\w"])/gi, 'null'))
