import type { Couleur } from '@/lib/skyjo/couleur'

// Fond et texte d'une carte selon sa famille de couleur (dos : arc-en-ciel).
export const FOND: Record<NonNullable<Couleur>, string> = {
  rouge: 'bg-red-600 text-white',
  jaune: 'bg-yellow-400 text-black',
  vert: 'bg-green-600 text-white',
  'bleu clair': 'bg-cyan-300 text-black',
  'bleu foncé': 'bg-blue-900 text-white',
  dos: 'bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] text-white',
}
