import { recadrer, tourner, versRGB, type ImageRGB } from '@/lib/image'
import { analyser, estIllisible, relire, resumer, type Analyse, type Mirage } from '@/lib/skyjo'
import { cartesCouchees, largeurCarte, zoneGrille, type Boite } from '@/lib/skyjo/grille'
import type { WorkerResponse } from '@/worker/cactus.worker'

let worker: Worker | undefined
export const getWorker = (): Worker =>
  (worker ??= new Worker(new URL('../worker/cactus.worker.ts', import.meta.url), { type: 'module' }))

const decrire = ({ rgb, width, height }: ImageRGB): Promise<{ mirage: Mirage; ms: number }> =>
  new Promise((resolve, reject) => {
    const w = getWorker()
    w.onmessage = (e: MessageEvent<WorkerResponse>) => {
      if (e.data.type === 'result') resolve({ mirage: e.data.mirage as Mirage, ms: e.data.ms })
      else if (e.data.type === 'error') reject(new Error(e.data.message))
    }
    const copie = rgb.slice() // le tampon transféré devient inutilisable côté page
    w.postMessage({ rgb: copie, width, height }, [copie.buffer])
  })

export interface Scan {
  analyse: Analyse
  mirage: Mirage
  image: ImageRGB
  tournee: boolean
  recadrage: Boite | null // zone de la photo d'origine analysée en 2e passe (grille trop petite)
  relues: number // cartes illisibles relues avec succès sur un recadrage
  passes: number // passes Mirage effectuées
  ms: number
}

// Résultat provisoire envoyé après chaque passe Mirage (le Scan final reste la seule vérité).
export interface Progression {
  etape: 'premiere' | 'recadrage' | 'relecture'
  analyse: Analyse
  image: ImageRGB // image sur laquelle portent les boîtes de l'analyse
  passes: number // passes faites
  prevues: number // passes prévues à ce stade (minimum : les relectures ne sont connues qu'après le recadrage)
}

const aRelire = (a: Analyse): number => a.cartes.flat().filter((c) => estIllisible(c) && c.boite).length

// Photo → grille lue. Si les cartes sont couchées (photo en paysage), on tourne de 90° et on relance :
// l'OCR ne lit pas les chiffres à 90° (à 180° oui, cf. RETOURNEES et 6↔9).
export const scanner = async (
  photo: Blob,
  max = Infinity,
  onProgression?: (p: Progression) => void,
): Promise<Scan> => {
  let image = await versRGB(photo, max)
  let { mirage, ms } = await decrire(image)
  let passes = 1
  const tournee = cartesCouchees(mirage, image.width, image.height)
  // Grille petite dans la photo : Mirage réduit l'image entière, les cartes n'ont plus assez de pixels.
  // On recadre sur la grille (et on tourne si les cartes sont couchées) avant une seule 2e passe.
  // ponytail: seuil = carte < 15 % du petit côté de la photo, réglé sur 11 photos (POC 21 %, échecs à 10 %).
  const zone = zoneGrille(mirage, image.width / image.height)
  const recadrage = zone && largeurCarte(mirage, image.width, image.height) < 0.15 ? zone : null
  const deuxieme = Boolean(tournee || recadrage)
  // ponytail: avec 2e passe, la 1re analyse n'est calculée que pour l'affichage provisoire (quelques ms).
  let analyse = deuxieme ? null : analyser(mirage, image.rgba, image.width, image.height)
  if (onProgression) {
    const provisoire = analyse ?? analyser(mirage, image.rgba, image.width, image.height)
    onProgression({ etape: 'premiere', analyse: provisoire, image, passes, prevues: deuxieme ? 2 : 1 + aRelire(provisoire) })
  }
  if (deuxieme) {
    if (recadrage) image = recadrer(image, recadrage, 0)
    if (tournee) image = tourner(image)
    const second = await decrire(image)
    mirage = second.mirage
    ms += second.ms
    passes++
  }
  if (!analyse) {
    analyse = analyser(mirage, image.rgba, image.width, image.height)
    onProgression?.({ etape: 'recadrage', analyse, image, passes, prevues: passes + aRelire(analyse) })
  }
  const lue = analyse
  const prevues = passes + aRelire(lue)

  // Carte visible sans chiffre lu : Mirage réduit la photo entière, un recadrage sur la carte seule
  // lui donne bien plus de pixels pour l'OCR. Une passe par carte illisible, en série (worker unique).
  // ponytail: une passe par carte ; regrouper les recadrages en une mosaïque si elles deviennent nombreuses.
  let relues = 0
  const cartes: Analyse['cartes'] = []
  for (const ligne of lue.cartes) {
    const nouvelle: Analyse['cartes'][number] = []
    for (const c of ligne) {
      if (!estIllisible(c) || !c.boite) {
        nouvelle.push(c)
        continue
      }
      const passe = await decrire(recadrer(image, c.boite))
      ms += passe.ms
      passes++
      const relue = relire(c, passe.mirage.text)
      if (relue.relue) relues++
      nouvelle.push(relue)
      if (onProgression) {
        // Cartes déjà relues + reste de la grille tel que lu avant les relectures.
        const l = cartes.length
        const enCours = lue.cartes.map((li, i) => (i < l ? cartes[i] : i === l ? [...nouvelle, ...li.slice(nouvelle.length)] : li))
        onProgression({ etape: 'relecture', analyse: resumer(enCours), image, passes, prevues })
      }
    }
    cartes.push(nouvelle)
  }
  if (relues) analyse = resumer(cartes)

  return { analyse, mirage, image, tournee, recadrage, relues, passes, ms }
}
