import { describe, expect, it } from "vitest";
import { relire, resumer, type Carte } from "../src/lib/skyjo";
import type { Couleur } from "../src/lib/skyjo/couleur";
import { lireCarte, PLANCHER_COULEUR } from "../src/lib/skyjo/lecture";
import { valider } from "../src/lib/skyjo/validation";

const t = (s: string, score = 0.8) => ({
  string: s,
  bbox: [0, 0, 1, 1] as [number, number, number, number],
  score,
});
const carte = (
  valeur: number | null,
  couleur: Couleur,
  confiance = 0.9,
): Carte => ({ boite: [0, 0, 1, 1], couleur, valeur, textes: [], confiance });

describe("confiance d’une lecture", () => {
  it("vote unanime à 3 lectures → confiance haute", () => {
    const l = lireCarte([t("7"), t("7"), t("7")], "jaune");
    expect(l.valeur).toBe(7);
    expect(l.confiance).toBeGreaterThanOrEqual(0.9);
  });

  it("une seule lecture faible sans couleur → confiance basse", () => {
    const l = lireCarte([t("6", 0.1)], null);
    expect(l.valeur).toBe(6);
    expect(l.confiance).toBeLessThan(0.5);
    expect(l.raisons).toContain("une seule lecture");
  });

  it("lecture unique cohérente avec la couleur → au moins le plancher (reel-34 : « 7 » à 0,32 sur jaune)", () => {
    const l = lireCarte([t("7", 0.32)], "jaune");
    expect(l.confiance).toBe(PLANCHER_COULEUR);
    expect(l.raisons).toContain("cohérente avec la couleur");
    // Une valeur obtenue par correction ou un vote partagé ne profitent pas du plancher.
    expect(lireCarte([t("2", 0.37)], "rouge").confiance).toBeLessThan(0.5);
    expect(
      lireCarte([t("9", 0.34), t("2", 0.33)], null).confiance,
    ).toBeLessThan(0.5);
    // Une case estimée reste à vérifier.
    expect(
      lireCarte([t("7", 0.32)], "jaune", { estimee: true }).confiance,
    ).toBeLessThan(0.5);
  });

  it("correction +10 → confiance moyenne", () => {
    const directe = lireCarte([t("12", 0.6), t("12", 0.6)], "rouge");
    const corrigee = lireCarte([t("2", 0.6), t("2", 0.6)], "rouge");
    expect(corrigee.valeur).toBe(12);
    expect(corrigee.confiance).toBeLessThan(directe.confiance);
    expect(corrigee.confiance).toBeGreaterThan(0.5);
    expect(corrigee.confiance).toBeLessThan(0.8);
  });

  it("vote partagé, case estimée, défaut bleu clair et dos baissent ou fixent la confiance", () => {
    expect(lireCarte([t("3"), t("4")], "vert").confiance).toBeLessThan(0.5);
    expect(
      lireCarte([t("7"), t("7")], "jaune", { estimee: true }).confiance,
    ).toBeLessThan(lireCarte([t("7"), t("7")], "jaune").confiance);
    expect(lireCarte([], "bleu clair")).toMatchObject({
      valeur: 0,
      confiance: 0.5,
    });
    expect(lireCarte([], "dos")).toMatchObject({
      valeur: null,
      confiance: 0.8,
    });
    expect(lireCarte([], "vert").confiance).toBe(0);
  });

  it("relire recalcule la confiance", () => {
    const r = relire(carte(null, "jaune", 0), [t("7")]);
    expect(r.valeur).toBe(7);
    expect(r.confiance).toBeGreaterThan(0);
  });
});

describe("validation métier", () => {
  it("incohérence couleur/valeur → alerte et confiance plafonnée", () => {
    const [[c]] = valider([[carte(3, "rouge")]]);
    expect(c.alertes?.[0]).toMatch(/impossible/);
    expect(c.confiance).toBe(0.3);
  });

  it("quantité impossible : 6 cartes -2 → alerte sur la moins sûre", () => {
    const ligne = [0.9, 0.8, 0.7, 0.95, 0.85, 0.4].map((k) =>
      carte(-2, "bleu foncé", k),
    );
    const sortie = valider([ligne]).flat();
    expect(
      sortie.filter((c) => c.alertes?.length).map((c) => c.confiance),
    ).toEqual([0.4]);
  });

  it("colonne presque défaussée → alerte sur la carte différente peu sûre", () => {
    const a = resumer([
      [carte(5, "jaune")],
      [carte(5, "jaune")],
      [carte(6, "jaune", 0.3)],
    ]);
    expect(a.cartes[2][0].alertes?.[0]).toMatch(/presque défaussée/);
    expect(a.cartes[0][0].alertes).toBeUndefined();
    expect(a.aVerifier).toBe(1);
    // carte différente sûre : pas d’alerte
    expect(
      resumer([[carte(5, "jaune")], [carte(5, "jaune")], [carte(6, "jaune")]])
        .aVerifier,
    ).toBe(0);
  });
});
