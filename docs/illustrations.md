# Remplacer les illustrations des cartes

Chaque carte est dessinée en SVG par défaut (`js/assets-mapping.js`). Ce dessin
n'est qu'un **repli** : si un fichier image porte le nom de la carte dans
`assets/cards/`, il le remplace.

## Marche à suivre

1. Déposer l'image dans `assets/cards/` en la nommant d'après l'identifiant de
   la carte, par exemple `assets/cards/boulet_de_canon.webp`.
2. Régénérer le manifeste :
   ```sh
   node tools/scan-cards.mjs
   ```
3. Recharger la page. La carte affiche l'image ; toutes les autres gardent leur
   dessin SVG.

On peut donc y aller **carte par carte** : le jeu reste cohérent et jouable à
chaque étape, il n'y a jamais de moment où l'application est cassée.

### Visuels hors cartes

Deux emplacements ne correspondent pas à une carte (voir `js/art-slots.js`) :

- `cover` — le tireur de la couverture de la boîte, sur l'écran d'accueil.
  Portrait ~4:5, fond transparent, personnage calé en bas à gauche.
- `dos-de-carte` — le motif bleu au dos des cartes. Portrait 5:7, **sans**
  transparence, motif à fond perdu.

### Identifiants des 17 cartes

`passe` · `contre_attaque` · `interception` · `degagement` · `touche` ·
`tir_au_but` · `boulet_de_canon` · `coup_de_chance` · `but` · `but_refuse` ·
`arret` · `sortie_de_but` · `hors_jeu` · `faute` · `coup_franc` · `corner` ·
`penalty`

### Format attendu

- **WebP** de préférence (PNG, JPG et SVG acceptés).
- Fond **transparent** : la carte fournit déjà son fond crème, son cartouche et
  son intitulé. L'image ne doit contenir **que le personnage ou la scène**.
- Format **portrait**, environ 3:4, autour de **600 × 800 px**. L'image est
  recadrée en `contain`, calée en bas — le personnage doit donc « poser » sur le
  bord inférieur de l'image, sans marge morte en dessous.
- Viser **moins de 60 Ko** par carte.

## Prompt de référence

Le risque principal quand on génère 17 illustrations est la **dérive de style** :
chaque carte part dans sa direction et l'ensemble ne tient plus. Deux garde-fous :
générer la première carte, la valider, puis **la fournir en image de référence**
pour toutes les suivantes ; et garder le même préambule mot pour mot.

### Préambule (invariable, à répéter à chaque carte)

> Illustration de carte à jouer française des années 1960, dans le style des jeux
> Edmond Dujardin. Dessin vectoriel à plat, sans dégradé, sans ombrage, sans
> texture. Contour noir épais et régulier. Palette strictement limitée à cinq
> couleurs : rouge brique #b5312f, vert bouteille #1b6b3d, ocre doré #d3a03c,
> chair #e0a86b, noir d'encre #171310. Fond entièrement transparent. Un seul
> sujet, silhouette lisible en très petit format. Personnage aux proportions
> allongées et athlétiques, pose sportive dynamique et nettement lisible.
> Maillot à larges bandes horizontales. Aucun texte, aucun logo, aucun cadre.
> Format portrait, sujet reposant sur le bord inférieur.

### Sujet par carte

| Carte | Sujet |
|---|---|
| `passe` | Joueur de profil qui pousse le ballon du pied intérieur, jambe d'appui fléchie |
| `contre_attaque` | Ballon seul, en gros, entre deux grosses flèches noires opposées (haut et bas) |
| `interception` | Joueur lancé en course qui dévie le ballon du pied, traits de vitesse derrière lui |
| `degagement` | Joueur qui frappe une demi-volée, jambe très haute, ballon partant au loin |
| `touche` | Joueur de face qui lance le ballon à deux mains au-dessus de la tête |
| `tir_au_but` | Joueur en extension arrière qui frappe, but esquissé derrière lui |
| `boulet_de_canon` | Retourné acrobatique, corps à l'horizontale, ballon fusant |
| `coup_de_chance` | Joueur déséquilibré qui marque par hasard, petites étoiles autour du ballon |
| `but` | Gardien battu, en plongeon horizontal, le ballon passe hors d'atteinte |
| `but_refuse` | Arbitre en noir qui pointe du doigt, joueur qui proteste face à lui |
| `arret` | Gardien en détente verticale qui capte le ballon à deux mains, filet derrière |
| `sortie_de_but` | Gardien qui plonge hors de sa cage et manque le ballon |
| `hors_jeu` | Arbitre de touche, bras levé bien droit, sifflet à la bouche |
| `faute` | Joueur fauché qui bascule, étoiles de choc, tacle par-derrière |
| `coup_franc` | Joueur qui reprend le ballon de la tête, ballon au-dessus du front |
| `corner` | Deux joueurs qui sautent en duel aérien, drapeau de corner au premier plan |
| `penalty` | Gardien bras écartés sur sa ligne, cage et filet derrière lui |

### Contrôle avant de valider une carte

- Lisible en **110 px de large** (la taille réelle en main sur mobile) ?
- Aucune couleur hors palette, aucun dégradé qui se serait glissé ?
- Le fond est-il **réellement** transparent, sans halo blanc sur les contours ?
- Posée à côté des cartes déjà validées, tient-elle dans la même famille ?

C'est ce dernier point qui décide. Une carte magnifique mais isolée abîme
l'ensemble plus qu'un dessin moyen mais cohérent.
