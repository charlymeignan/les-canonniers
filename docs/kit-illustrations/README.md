# Kit illustrations — Les Canonniers

De quoi générer les 19 illustrations du jeu et les intégrer.

## Contenu

Dans le dépôt :

```
PROMPT.md       le préambule, les 19 briefs, la méthode et la grille de contrôle
palette.png     les six couleurs autorisées, avec leurs codes
refs-cartes/    chaque carte d'origine, découpée et nommée comme le fichier à produire
```

Dans l'archive distribuable (`--archive`), en plus :

```
refs-materiel/  boîte, plateau, dos de cartes, livret, planches de cartes entières
refs-livret/    les 16 pages du livret, extraites du PDF
```

## Qualité des sources — à lire avant de générer

Rien n'est recompressé ni agrandi dans ce kit :

- **Les photos du matériel** sont copiées **à l'octet près** depuis
  `assets/user-files/`. Ce sont les originaux, pas des versions ré-encodées.
- **Les pages du livret** sont les flux JPEG récupérés tels quels dans le PDF :
  **1150 × 1638**, nettement plus nets que les photos du livret prises à part.
- **Les vignettes de cartes** sont découpées à leur **résolution native**, avec
  un cadrage resserré détecté automatiquement. Aucun agrandissement : cela
  n'ajouterait rien à la source.

**Le point important :** les deux planches de cartes ont été photographiées en
960 × 720, et chaque carte n'y occupe qu'un huitième à un dixième de l'image.
Une vignette fait donc environ **160 × 220 px**. C'est le plafond de ce qui
existe — il n'y a pas de version plus définie ailleurs, le PDF ne contient
aucune image de carte.

En pratique : donner à un modèle la **planche entière**
(`refs-materiel/planche-cartes-1.jpg`, 960 × 720, non recompressée) marche
souvent mieux pour caler le style d'ensemble, et la vignette individuelle sert à
préciser la pose d'une carte donnée. Des macros refaites au téléphone
amélioreraient nettement les références, mais ce n'est pas bloquant pour
démarrer.

## Par où commencer

1. Lire `PROMPT.md`, en particulier la section 1 : générer `passe` en premier et
   s'en servir de référence pour les 18 autres. C'est le seul vrai risque de
   l'exercice — la cohérence de la série, pas la qualité d'une carte isolée.
2. Garder `palette.png` sous les yeux : c'est la contrainte que les modèles
   violent le plus souvent.
3. Générer, contrôler avec la section 5, déposer dans `assets/cards/`, lancer
   `npm run cards:scan`.

## Deux formats de sortie, deux usages

Un modèle d'image ne décompresse ni `.zip` ni `.tar.gz`. En revanche il lit un
**PDF** nativement, d'un seul envoi.

- **`BRIEFING.pdf`** — le document à donner au modèle. Il contient la consigne,
  la palette, les 19 briefs et les planches de cartes en pleine page. Le texte y
  est du vrai texte, pas une capture : il est lu tel quel.
- **`canonniers-kit-illustrations.zip`** — les fichiers individuels, pour joindre
  la référence précise d'une carte au moment de la générer.

En pratique : donner le PDF une fois en début de session pour poser le style,
puis joindre la vignette de la carte en cours à chaque génération.

## Régénérer ce kit

```sh
npm run kit                           # kit + PDF + ZIP
python3 tools/build-kit.py            # met à jour docs/kit-illustrations/ seulement
python3 tools/build-pdf.py sortie.pdf # le PDF seul
```

Dépendances : `pip install pillow numpy fpdf2`.
