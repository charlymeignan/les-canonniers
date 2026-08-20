# Kit illustrations — Les Canonniers

Tout ce qu'il faut pour générer les 19 illustrations du jeu et les intégrer.

## Contenu

```
PROMPT.md       le préambule, les 19 briefs, la méthode et la grille de contrôle
palette.png     les six couleurs autorisées, avec leurs codes
refs-cartes/    la photo de chaque carte d'origine, nommée comme le fichier à produire
```

Les photos du matériel — boîte, plateau, dos de cartes, livret, planches
complètes — sont dans `assets/user-files/` à la racine du dépôt. L'archive
distribuable, elle, les embarque dans un dossier `refs-materiel/` pour être
autonome.

## Par où commencer

1. Lire `PROMPT.md`, en particulier la section 1 : elle explique pourquoi il faut
   générer `passe` en premier et s'en servir de référence pour les 18 autres.
   C'est le seul vrai risque de l'exercice.
2. Garder `palette.png` sous les yeux : c'est la contrainte que les modèles
   violent le plus souvent.
3. Générer, contrôler avec la section 5, déposer dans `assets/cards/`, lancer
   `npm run cards:scan`.

## Sur la qualité des références

`refs-cartes/` est découpé automatiquement dans les deux planches photographiées,
qui ne font que 960 px de large : chaque vignette est donc peu définie, et
quelques-unes sont rognées ou vues de biais. Elles suffisent à caler la pose et
l'esprit. Pour relire une carte en détail, ouvrir la planche entière
correspondante dans `assets/user-files/`.

## Régénérer ce kit

```sh
python3 tools/build-kit.py            # met à jour docs/kit-illustrations/
python3 tools/build-kit.py --archive  # produit en plus l'archive distribuable
```
