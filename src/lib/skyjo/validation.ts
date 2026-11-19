import { FAMILLES } from "./couleur";
import type { Carte } from "./index";

export const SEUIL_CONFIANCE = 0.5;
// Paquet Skyjo (150 cartes) : -2 ×5, -1 ×10, 0 ×15, 1 à 12 ×10.
export const EXEMPLAIRES = (v: number): number =>
  v === -2 ? 5 : v === 0 ? 15 : 10;

const confianceDe = (c: Carte): number => c.confiance ?? 1; // sans confiance = saisie à la main

export const aVerifier = (c: Carte): boolean =>
  confianceDe(c) < SEUIL_CONFIANCE || !!c.alertes?.length;

// Règles métier sur la grille lue : remplit `alertes` (recalculées à chaque appel)
// et plafonne à 0,3 la confiance d'une valeur impossible pour sa couleur.
export const valider = (cartes: Carte[][]): Carte[][] => {
  const alertes = new Map<Carte, string[]>();
  const alerter = (c: Carte, a: string) =>
    alertes.set(c, [...(alertes.get(c) ?? []), a]);
  const incoherentes = new Set<Carte>();
  const toutes = cartes.flat();

  // Couleur ↔ valeur
  for (const c of toutes)
    if (
      c.couleur &&
      c.couleur !== "dos" &&
      c.valeur !== null &&
      !FAMILLES[c.couleur].valeurs.includes(c.valeur)
    ) {
      incoherentes.add(c);
      alerter(c, `${c.valeur} impossible sur une carte ${c.couleur}`);
    }

  // Quantités du paquet : les exemplaires en trop sont les lectures les moins sûres.
  for (const v of new Set(toutes.map((c) => c.valeur))) {
    if (v === null) continue;
    const liste = toutes.filter((c) => c.valeur === v);
    const trop = liste.length - EXEMPLAIRES(v);
    if (trop > 0)
      for (const c of liste
        .sort((a, b) => confianceDe(a) - confianceDe(b))
        .slice(0, trop))
        alerter(c, `plus de ${EXEMPLAIRES(v)} cartes « ${v} » dans le paquet`);
  }

  // Colonne presque défaussée : une seule carte différente, peu sûre, change le score de toute la colonne.
  for (let i = 0; cartes.length === 3 && i < cartes[0].length; i++) {
    const col = cartes.map((l) => l[i]);
    if (col.some((c) => !c || c.valeur === null)) continue;
    for (const c of col) {
      const [a, b] = col.filter((o) => o !== c);
      if (
        a.valeur === b.valeur &&
        c.valeur !== a.valeur &&
        confianceDe(c) < SEUIL_CONFIANCE
      )
        alerter(
          c,
          `colonne presque défaussée : si c'est un ${a.valeur}, la colonne disparaît`,
        );
    }
  }

  return cartes.map((l) =>
    l.map(
      (c): Carte => ({
        ...c,
        alertes: alertes.get(c),
        ...(incoherentes.has(c)
          ? { confiance: Math.min(confianceDe(c), 0.3) }
          : {}),
      }),
    ),
  );
};
