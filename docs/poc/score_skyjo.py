"""Calcule le score Skyjo à partir du JSON renvoyé par Mirage.

Usage : python score_skyjo.py skyjo_mirage.json [photo.jpg]
Avec la photo, la COULEUR de chaque carte sert de contrôle (sans IA) :
  arc-en-ciel = dos, bleu foncé = -2/-1, bleu clair = 0, vert = 1-4,
  jaune = 5-8, rouge = 9-12.
Coordonnées Mirage : boîtes [x1, y1, x2, y2] normalisées sur 0-1000.
"""

import colorsys
import json
import re
import sys
from collections import Counter, defaultdict

VALEURS_SKYJO = set(range(-2, 13))
# lettres que l'OCR confond avec des chiffres
CORRECTIONS = {"O": "0", "o": "0", "D": "0", "I": "1", "l": "1"}
# lectures typiques d'une carte vue à l'envers (le 10 retourné ressemble à "OT")
RETOURNEES = {"OT": 10, "OL": 10, "0T": 10, "0L": 10, "T": 1}


def centre(b):
    return ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)


def contient(carte, point):
    return carte[0] <= point[0] <= carte[2] and carte[1] <= point[1] <= carte[3]


def lire(chaine):
    """Transforme un texte OCR en valeur Skyjo, ou None (ex. logo "SKYJO")."""
    if chaine in RETOURNEES:
        return RETOURNEES[chaine]
    s = "".join(CORRECTIONS.get(c, c) for c in chaine)
    if re.fullmatch(r"-?\d{1,2}", s) and int(s) in VALEURS_SKYJO:
        return int(s)
    return None


# ---------- contrôle par la couleur ----------
# teintes regroupées par tranches de 30° (0 = rouge, 6 = cyan, 7 = bleu…)
FAMILLES = {
    "rouge": ({11, 0}, set(range(9, 13))),
    "jaune": ({1, 2}, set(range(5, 9))),
    "vert": ({3, 4}, set(range(1, 5))),
    "bleu clair": ({5, 6}, {0}),
    "bleu foncé": ({7, 8}, {-2, -1}),
}
RETOURNE = {6: 9, 9: 6}


def couleur_carte(image, boite):
    """Renvoie "dos", le nom d'une famille de couleur, ou None si indécis."""
    w, h = image.size
    x1, y1, x2, y2 = boite
    dx, dy = (x2 - x1) * 0.12, (y2 - y1) * 0.12  # on évite le bord blanc
    zone = image.crop((int((x1 + dx) / 1000 * w), int((y1 + dy) / 1000 * h),
                       int((x2 - dx) / 1000 * w), int((y2 - dy) / 1000 * h))).resize((40, 60))
    tranches = [0] * 12
    zone = zone.convert("RGB")
    pixels = zone.get_flattened_data() if hasattr(zone, "get_flattened_data") else zone.getdata()
    for r, g, b in pixels:
        teinte, saturation, luminosite = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if saturation > 0.35 and luminosite > 0.25:  # pixels vraiment colorés
            tranches[int(teinte * 12) % 12] += 1
    total = sum(tranches)
    if total < 50:
        return None
    if max(tranches) / total < 0.5:
        return "dos"  # plusieurs couleurs mélangées = dos arc-en-ciel
    return max(FAMILLES, key=lambda f: sum(tranches[i] for i in FAMILLES[f][0]))


def valeur_carte(textes, famille=None):
    """Vote entre les 3 chiffres d'une carte (2 coins + centre), pondéré par le score OCR.
    Si la famille de couleur est connue, seules les valeurs compatibles sont gardées."""
    if famille == "dos":
        return None
    permises = FAMILLES[famille][1] if famille in FAMILLES else VALEURS_SKYJO
    votes = defaultdict(float)
    for t in textes:
        v = lire(t["string"])
        if v is not None and v not in permises:
            v = RETOURNE.get(v)  # un 6 sur une carte rouge est un 9 retourné
        if v is not None and v in permises:
            votes[v] += t.get("score") or 0.1
    if not votes:
        if len(permises) == 1:
            return next(iter(permises))  # bleu clair = forcément 0
        if famille in FAMILLES:
            print(f"  ⚠️ carte {famille} illisible, comptée comme cachée")
        return None  # aucun chiffre lisible : carte face cachée
    # le signe moins se perd souvent mais n'apparaît jamais par erreur
    negatifs = [v for v in votes if v < 0]
    if negatifs:
        return max(negatifs, key=votes.get)
    return max(votes, key=votes.get)


def main():
    chemin = sys.argv[1] if len(sys.argv) > 1 else "mirage_resultat.json"
    data = json.load(open(chemin, encoding="utf-8"))
    image = None
    if len(sys.argv) > 2:
        from PIL import Image, ImageOps
        image = ImageOps.exif_transpose(Image.open(sys.argv[2])).convert("RGB")

    # 1. les cartes = la catégorie d'objets la plus fréquente ("patch", "game tile"…)
    nom_cartes = Counter(o["name"] for o in data["objects"]).most_common(1)[0][0]
    boites = [o["bbox"] for o in data["objects"] if o["name"] == nom_cartes]
    boites = [b for b in boites if (b[2] - b[0]) * (b[3] - b[1]) < 200_000]  # sans la boîte "toute la grille"

    # 2. regroupement en lignes (par y), puis on garde les lignes de taille habituelle
    boites.sort(key=lambda b: centre(b)[1])
    lignes, ligne = [], [boites[0]]
    for b in boites[1:]:
        if abs(centre(b)[1] - centre(ligne[-1])[1]) < 100:
            ligne.append(b)
        else:
            lignes.append(ligne)
            ligne = [b]
    lignes.append(ligne)
    # taille de ligne qui regroupe le plus de cartes (évite les lignes d'1 objet parasite)
    compte = Counter(len(l) for l in lignes)
    taille = max(compte, key=lambda n: (n * compte[n], n))
    ecartees = [l for l in lignes if len(l) != taille]
    lignes = [l for l in lignes if len(l) == taille]
    if ecartees:
        print(f"({sum(map(len, ecartees))} objet(s) hors grille ignoré(s), ex. carnet de scores)")

    # 3. lecture de chaque carte
    grille = []
    for l in lignes:
        l.sort(key=lambda b: centre(b)[0])
        valeurs = []
        for b in l:
            textes = [t for t in data["text"] if contient(b, centre(t["bbox"]))]
            valeurs.append(valeur_carte(textes, couleur_carte(image, b) if image else None))
        grille.append(valeurs)

    print("Grille lue (? = carte cachée) :")
    for l in grille:
        print("  " + "  ".join(f"{'?' if v is None else v:>3}" for v in l))

    # 4. règle Skyjo : colonne de 3 cartes visibles identiques = défaussée
    score = 0
    for i, col in enumerate(zip(*grille), 1):
        if len(col) == 3 and None not in col and len(set(col)) == 1:
            print(f"Colonne {i} : trois {col[0]} → défaussée")
            continue
        score += sum(v for v in col if v is not None)
    cachees = sum(v is None for l in grille for v in l)
    print(f"\nScore des cartes visibles : {score}  ({cachees} carte(s) cachée(s))")


if __name__ == "__main__":
    main()
