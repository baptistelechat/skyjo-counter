"""Compteur Skyjo, version "formulaire" : Mirage choisit la valeur dans une liste fermée.

Étapes :
  1. describe() sur la photo entière pour trouver les 12 cartes (boîtes) ;
  2. on découpe chaque carte avec Pillow ;
  3. extract() sur chaque découpe : Mirage doit CHOISIR parmi "dos", "-2" … "12" ;
  4. on applique la règle des colonnes et on additionne.

Usage :
    .venv\\Scripts\\python skyjo_extract.py skyjo-3.jpg
    .venv\\Scripts\\python skyjo_extract.py skyjo-3.jpg --debug   (affiche la réponse brute de chaque carte)

Les découpes sont enregistrées dans le dossier decoupes/ pour vérifier ce que Mirage a vu.
"""

import json
import os
import re
import sys
from collections import Counter

os.environ.setdefault("CACTUS_TELEMETRY", "0")

import cactus
from PIL import Image, ImageOps

DOS = "dos"
CHOIX = [DOS] + [str(v) for v in range(-2, 13)]
FORMULAIRE = {"carte": {"enum": CHOIX}}
MARGE = 0.04  # on agrandit un peu chaque boîte pour ne pas couper les coins


# ---------- appels Mirage robustes (bug "-nan(ind)" sous Windows) ----------

def appel_mirage(fonction, *args, **kwargs):
    try:
        return fonction(*args, **kwargs)
    except json.JSONDecodeError:
        brut = MIRAGE._buffer.value.decode("utf-8", errors="replace")
        repare = re.sub(r"-?(nan|inf|infinity)(\(ind\))?(?![\w\"])", "null", brut, flags=re.IGNORECASE)
        return json.loads(repare)


# ---------- 1. trouver les cartes ----------

def centre(b):
    return ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)


def trouver_cartes(description):
    objets = description.get("objects", [])
    if not objets:
        sys.exit("Mirage n'a détecté aucun objet sur la photo.")
    nom = Counter(o["name"] for o in objets).most_common(1)[0][0]
    boites = [o["bbox"] for o in objets if o["name"] == nom]
    boites = [b for b in boites if (b[2] - b[0]) * (b[3] - b[1]) < 200_000]

    boites.sort(key=lambda b: centre(b)[1])
    lignes, ligne = [], [boites[0]]
    for b in boites[1:]:
        if abs(centre(b)[1] - centre(ligne[-1])[1]) < 100:
            ligne.append(b)
        else:
            lignes.append(ligne)
            ligne = [b]
    lignes.append(ligne)
    taille = Counter(len(l) for l in lignes).most_common(1)[0][0]
    lignes = [sorted(l, key=lambda b: centre(b)[0]) for l in lignes if len(l) == taille]
    return lignes


# ---------- 2. découper ----------

def decouper(image, boite):
    w, h = image.size
    x1, y1, x2, y2 = boite
    mx, my = (x2 - x1) * MARGE, (y2 - y1) * MARGE
    zone = (
        max(0, int((x1 - mx) / 1000 * w)),
        max(0, int((y1 - my) / 1000 * h)),
        min(w, int((x2 + mx) / 1000 * w)),
        min(h, int((y2 + my) / 1000 * h)),
    )
    return image.crop(zone)


# ---------- 3. lire le formulaire ----------

def chercher_reponse(resultat):
    """Le format de sortie d'extract() n'est pas documenté : on cherche "carte" partout."""
    if isinstance(resultat, dict):
        for cle, valeur in resultat.items():
            if cle == "carte":
                if isinstance(valeur, dict):
                    for k in ("value", "choice", "answer", "label"):
                        if k in valeur:
                            return valeur[k], valeur.get("confidence", valeur.get("score"))
                return valeur, None
            trouve = chercher_reponse(valeur)
            if trouve[0] is not None:
                return trouve
    elif isinstance(resultat, list):
        for element in resultat:
            trouve = chercher_reponse(element)
            if trouve[0] is not None:
                return trouve
    return None, None


def main():
    global MIRAGE
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    debug = "--debug" in sys.argv
    chemin = args[0] if args else "skyjo.png"

    MIRAGE = cactus.Mirage()
    image = ImageOps.exif_transpose(Image.open(chemin)).convert("RGB")

    lignes = trouver_cartes(appel_mirage(MIRAGE.describe, image))
    print(f"{sum(map(len, lignes))} cartes trouvées ({len(lignes)} lignes)\n")

    os.makedirs("decoupes", exist_ok=True)
    grille = []
    for i, ligne in enumerate(lignes, 1):
        valeurs = []
        for j, boite in enumerate(ligne, 1):
            carte = decouper(image, boite)
            carte.save(f"decoupes/carte_L{i}C{j}.png")
            resultat = appel_mirage(MIRAGE.extract, carte, FORMULAIRE)
            reponse, confiance = chercher_reponse(resultat)
            if debug or reponse is None:
                print(f"[L{i}C{j}] réponse brute : {json.dumps(resultat, ensure_ascii=False)[:500]}")
            if reponse is None or str(reponse) == DOS:
                valeurs.append(None)
            else:
                try:
                    valeurs.append(int(reponse))
                except ValueError:
                    print(f"[L{i}C{j}] valeur inattendue : {reponse!r}, comptée comme cachée")
                    valeurs.append(None)
            if confiance is not None and confiance < 0.5:
                print(f"[L{i}C{j}] ⚠️ confiance faible ({confiance:.2f}) pour {reponse}")
        grille.append(valeurs)

    print("\nGrille lue (? = carte cachée) :")
    for l in grille:
        print("  " + "  ".join(f"{'?' if v is None else v:>3}" for v in l))

    score = 0
    for k, col in enumerate(zip(*grille), 1):
        if len(col) == 3 and None not in col and len(set(col)) == 1:
            print(f"Colonne {k} : trois {col[0]} → défaussée")
            continue
        score += sum(v for v in col if v is not None)
    cachees = sum(v is None for l in grille for v in l)
    print(f"\nScore des cartes visibles : {score}  ({cachees} carte(s) cachée(s))")


if __name__ == "__main__":
    main()
