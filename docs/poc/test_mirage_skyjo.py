"""Test de Mirage (Cactus Compute) sur une photo de grille Skyjo.

Installation (une seule fois) :
    python -m venv .venv
    .venv/bin/pip install -U cactus-compute      # Windows : .venv\\Scripts\\pip

Lancement :
    .venv/bin/python test_mirage_skyjo.py skyjo.png

Le script affiche la réponse brute de Mirage et l'enregistre dans
<nom_image>_mirage.json. Au premier lancement, le modèle (~22 Mo) est
téléchargé depuis Hugging Face puis gardé en cache.
"""

import json
import os
import re
import sys
import time

os.environ.setdefault("CACTUS_TELEMETRY", "0")  # coupe la télémétrie anonyme

import cactus


def main() -> None:
    image = sys.argv[1] if len(sys.argv) > 1 else "skyjo.png"

    debut = time.perf_counter()
    mirage = cactus.Mirage()
    print(f"Modèle chargé en {time.perf_counter() - debut:.1f} s")

    debut = time.perf_counter()
    try:
        resultat = mirage.describe(image)
    except json.JSONDecodeError as erreur:
        # Mirage a renvoyé un JSON invalide : on récupère le texte brut pour comprendre
        brut = mirage._buffer.value.decode("utf-8", errors="replace")
        nom_brut = os.path.splitext(os.path.basename(image))[0] + "_mirage_brut.txt"
        with open(nom_brut, "w", encoding="utf-8") as f:
            f.write(brut)
        print(f"JSON invalide renvoyé par Mirage ({erreur}).")
        print(f"Texte brut enregistré dans {nom_brut}")
        print("Autour de l'erreur :", repr(brut[max(0, erreur.pos - 60): erreur.pos + 60]))
        # tentative de réparation : nan, -nan(ind) (Windows), inf -> null
        repare = re.sub(r"-?(nan|inf|infinity)(\(ind\))?(?![\w\"])", "null", brut, flags=re.IGNORECASE)
        try:
            resultat = json.loads(repare)
            print("Réparation automatique réussie, on continue.\n")
        except json.JSONDecodeError:
            print("Réparation impossible : envoie-moi le fichier brut.")
            sys.exit(1)
    print(f"Analyse faite en {(time.perf_counter() - debut) * 1000:.0f} ms\n")

    texte = json.dumps(resultat, indent=2, ensure_ascii=False, default=str)
    print(texte)

    sortie = os.path.splitext(os.path.basename(image))[0] + "_mirage.json"
    with open(sortie, "w", encoding="utf-8") as f:
        f.write(texte)
    print(f"\nRésultat enregistré dans {sortie}")


if __name__ == "__main__":
    main()
