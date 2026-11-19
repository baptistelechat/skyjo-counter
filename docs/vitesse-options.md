# Vitesse du scan : options pour le futur

> **Décision (19/11/2026)** : on reste sur l'**option A** pour le MVP (E3). Les options B et C sont documentées ici pour être reprises plus tard, quand le MVP tournera chez de vrais joueurs.

## Constat

Le temps d'un scan se compte **en passes Mirage**, pas en pixels :

| Mesure                                      | Valeur                                                        |
| ------------------------------------------- | ------------------------------------------------------------- |
| Une passe sur PC (4 cœurs, Chrome)          | ~10 s (plancher ~3,5 s : encodeur d'image + OCR)              |
| Une passe sur téléphone (Xiaomi 24090RA29G) | ~7 s                                                          |
| Passes par photo                            | 1 à 4 (photo, recadrage ou rotation, une par carte illisible) |
| Scan complet                                | 6 à 45 s                                                      |
| Objectif du PRD                             | < 3 s                                                         |

Pourquoi c'est lent dans le navigateur :

- **Build WASM mono-thread**, sans WebGPU (Cactus 4.1.4, le seul publié). Cactus est rapide sur les petits appareils **en natif** : NEON (ARM), plusieurs cœurs, NPU. Le navigateur n'accède à aucun des trois.
- **Moteur C fermé** : le repo GitHub `cactus-compute/cactus` ne contient que le Python (binaires précompilés sur Hugging Face). Impossible de recompiler le WASM avec `-pthread` ou WebGPU.
- **Modèle généraliste** : Mirage (~54 M paramètres, quantifié 2 bits, 21 Mo) réduit l'image à 512 px et génère les noms des objets token par token (2-3 s par passe). D'où les passes en plus (recadrage, relecture).
- Les latences annoncées par Cactus (74 ms NPU, 107 ms CPU) sont mesurées en natif sur un Galaxy S26. Leur démo web « live » utilise le même WASM et relance l'analyse en boucle.

Ce qui ne marche pas : réduire la photo (Mirage redimensionne lui-même), `max_tokens` bas (supprime les objets), relire plus de cartes (+21 % de temps mesuré en A/B).

## Option A — Assumer l'attente (✅ retenue pour le MVP)

- Grille provisoire affichée dès la 1re passe (6-20 s), mise à jour ensuite (`scanner(…, onProgression)`).
- Correction manuelle en un tap, saisie complète possible si le scan échoue.
- Consignes photo (grille droite, cadrée, vue de dessus) pour éviter les passes de recadrage et de rotation : 1 passe ≈ 7 s sur téléphone.
- **Bonus pour C** : chaque grille validée après correction peut être conservée (photo + vérité) et devenir le jeu de données de l'option C.

**Gain** : 6-10 s dans le cas courant. **Coût** : faible, c'est le chemin actuel.

## Option B — App native (Capacitor + SDK Cactus)

- Emballer l'app React existante avec **Capacitor**, et appeler `libcactus.a` (Android arm64, iOS arm64, publiés en 4.1.4) via un plugin natif à la place du Web Worker.
- Le moteur tourne alors sur CPU ARM multi-cœurs et NPU : ~10× plus rapide d'après les chiffres Cactus (à mesurer).
- La logique Skyjo (`src/lib/skyjo/`) et l'UI restent identiques ; seul `src/lib/moteur.ts` change de transport.

**Gain** : ~1 s estimé. **Coût** : moyen (plugin natif Kotlin/Swift, builds Android/iOS, distribution APK ou stores). **Inconvénient** : contredit l'esprit du PRD (« une URL, rien à installer ») ; la PWA peut rester en repli.

À vérifier avant de se lancer : licence de redistribution des binaires, présence d'un SDK mobile officiel Cactus (sinon binding C à écrire).

## Option C — Pipeline spécialisé dans le navigateur

Remplacer Mirage par trois étapes légères :

1. **Détection des cartes** : petit détecteur (type YOLO-nano) ou vision classique (contours + quadrillage, déjà en partie dans `grille.ts`).
2. **Couleur** : déjà faite (`couleur.ts`), elle réduit chaque carte à 1-4 valeurs possibles (bleu foncé -2/-1, bleu clair 0, vert 1-4, jaune 5-8, rouge 9-12) ou « dos ».
3. **Chiffre** : minuscule classifieur (15 classes + dos, entrée ~64 px) exécuté avec **ONNX Runtime Web** (WebGPU ou WASM multi-thread avec en-têtes COOP/COEP sur Vercel).

**Gain** : < 1 s estimé, reste 100 % web et hors ligne, modèle de quelques Mo. **Coût** : élevé, il faut un jeu de données annoté (plusieurs centaines de cartes), entraîné hors navigateur.

Jeu de données : les 12 fixtures (`tests/fixtures/verite.json`, 144 cartes) + les grilles corrigées collectées par l'option A. Les boîtes de Mirage peuvent servir d'annotation automatique pour démarrer.

## Recommandation

A maintenant (MVP), collecte des grilles corrigées, puis **C** quand le jeu de données dépasse ~500 cartes. B seulement si l'app doit absolument descendre sous 2 s avant que C soit prêt.
