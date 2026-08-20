# Kit de génération des illustrations — Les Canonniers

19 illustrations à produire : les **17 cartes** du jeu, plus **2 visuels hors
cartes** (le tireur de la couverture, le dos de carte).

Le format n'a pas d'importance côté code : PNG, WebP, JPG ou SVG, tout passe.
Ce qui compte, c'est la **cohérence des 19 entre elles**.

---

## 1. La règle qui décide de tout

Le risque n'est pas de rater une carte, c'est que les 19 ne forment pas une
famille. Une illustration superbe mais isolée abîme l'ensemble plus qu'un dessin
moyen mais cohérent.

**Méthode :** générer d'abord `passe` (la plus simple, un joueur seul de profil).
La retoucher jusqu'à ce qu'elle soit juste. Puis la **fournir en image de
référence** à chaque génération suivante, avec la mention :

> Même style graphique, même palette, même épaisseur de contour et mêmes
> proportions de personnage que l'image de référence.

Sans ça, la carte 12 n'aura plus rien à voir avec la carte 1.

---

## 2. Préambule — à répéter mot pour mot à chaque carte

> Illustration pour une carte à jouer française des années 1960, dans le style
> des jeux édités par Edmond Dujardin. Dessin vectoriel à plat : aucun dégradé,
> aucune ombre portée, aucune texture, aucun effet de matière. Contour noir
> épais et d'épaisseur constante autour de chaque forme. Palette strictement
> limitée à ces six couleurs et à aucune autre : noir #171310, rouge brique
> #b5312f, vert bouteille #1b6b3d, ocre doré #d3a03c, chair #e0a86b, crème
> #f2ecd8. Fond entièrement transparent. Un seul sujet, isolé, dont la
> silhouette reste lisible à très petite taille. Personnage aux proportions
> allongées et athlétiques, pose sportive franche et immédiatement lisible.
> Maillot à larges bandes horizontales. Visage réduit à quelques traits
> simples. Aucun texte, aucun chiffre, aucun logo, aucun cadre, aucune bordure.
> Cadrage portrait, le sujet repose sur le bord inférieur de l'image.

**Contraintes techniques :** portrait, environ 600 × 800 px, fond transparent,
moins de 60 Ko une fois converti en WebP.

---

## 3. Les 17 cartes

Une photo de la carte d'origine correspondante est fournie dans
`refs-cartes/<nom>.jpg`. Elle sert à caler la pose et l'esprit — **ce n'est pas
un modèle à décalquer** : le but est une illustration nouvelle dans la même
manière, pas une copie.

Ces vignettes sont petites (~160 × 220 px), c'est la limite de la source. Pour
donner au modèle une meilleure idée du style d'ensemble, joindre aussi la
planche entière `refs-materiel/planche-cartes-1.jpg` ou `-2.jpg`.

| Fichier à produire | Sujet |
|---|---|
| `passe.webp` | Joueur de profil qui pousse le ballon du pied intérieur, jambe d'appui fléchie, ballon au sol devant lui. Maillot cerclé vert-blanc-rouge. |
| `contre_attaque.webp` | Pas de personnage : un ballon seul, en gros, encadré par deux grosses flèches noires opposées, l'une vers le haut, l'autre vers le bas. |
| `interception.webp` | Joueur lancé en pleine course qui dévie le ballon du pied, buste très penché en avant, traits de vitesse derrière lui. |
| `degagement.webp` | Joueur qui frappe une demi-volée, jambe de frappe très haute, corps basculé en arrière, ballon partant au loin. Maillot vert. |
| `touche.webp` | Joueur de face, pieds au sol, qui lance le ballon à deux mains au-dessus de la tête. Maillot vert. |
| `tir_au_but.webp` | Joueur en extension arrière qui arme sa frappe, un but esquissé derrière lui, ballon quittant le pied. |
| `boulet_de_canon.webp` | Retourné acrobatique : corps à l'horizontale, tête en bas, jambes en ciseaux, ballon fusant avec traits de vitesse. |
| `coup_de_chance.webp` | Joueur déséquilibré, presque en train de tomber, qui touche le ballon par accident. Petites étoiles autour du point de contact. |
| `but.webp` | Gardien battu, en plongeon horizontal complet, bras tendus dans le vide, le ballon passe hors d'atteinte. Quelques étoiles d'impact. |
| `but_refuse.webp` | Deux personnages : un arbitre tout en noir qui pointe le doigt vers le côté, et un joueur face à lui qui proteste, buste penché. |
| `arret.webp` | Gardien en détente verticale qui capte le ballon à deux mains au-dessus de la tête, filet de but suggéré derrière lui. Maillot rouge. |
| `sortie_de_but.webp` | Gardien qui plonge hors de sa cage et manque le ballon, corps à l'horizontale, montant de but visible. Maillot rouge. |
| `hors_jeu.webp` | Arbitre en noir, immobile, un bras levé bien droit à la verticale, sifflet à la bouche, l'autre bras pointant le sol. |
| `faute.webp` | Joueur fauché qui bascule en vrille, jambes en l'air, étoiles de choc autour de lui, ballon échappé au sol. |
| `coup_franc.webp` | Joueur qui reprend le ballon de la tête, ballon juste au-dessus du front, corps tendu vers le haut. Maillot vert. |
| `corner.webp` | Deux joueurs qui sautent en duel aérien, épaule contre épaule, et un drapeau de corner rouge au premier plan à gauche. |
| `penalty.webp` | Gardien seul sur sa ligne, bras et jambes écartés en étoile, cage et filet derrière lui. Maillot vert. |

---

## 4. Les 2 visuels hors cartes

### `cover.webp` — le tireur de la couverture

C'est l'illustration la plus visible du projet : elle occupe la moitié gauche de
l'écran d'accueil, sur un aplat vert.

Référence : `refs-materiel/boite-couverture.jpg`.

> Même préambule que ci-dessus, avec ces différences : joueur de football vu de
> trois quarts, grande figure occupant toute la hauteur, corps très étiré en
> diagonale. Jambe droite lancée à l'horizontale dans le geste de frappe, jambe
> gauche repliée sous le corps, les deux bras largement écartés pour
> l'équilibre. Maillot rouge à bandes blanches, culotte blanche, bas rouges à
> anneaux blancs, chaussures noires. Ballon ocre doré propulsé vers la droite,
> avec un court sillage de traits nets derrière lui. Fond transparent.

Cadrage : portrait, environ **4:5**, le personnage calé **en bas à gauche** du
cadre. Le ballon doit rester dans l'image, à droite.

### `dos-de-carte.webp` — le dos des cartes

Seul visuel **sans transparence** : il remplit toute la carte.

Référence : `refs-materiel/interieur-boite-dos-de-cartes.jpg`.

> Dos de carte à jouer, motif géométrique plat en bleu marine #213e73 sur fond
> blanc cassé. Terrain de football vu du dessus, très schématique : ligne
> médiane, rond central, deux surfaces de réparation, le tout en trait blanc sur
> aplat bleu, avec une trame régulière de petits points blancs. Composition
> symétrique, lisible tête-bêche. Aucun texte. Bord franc, pas d'ombre.

Cadrage : portrait **5:7**, motif à fond perdu.

---

## 5. Contrôle avant de valider une carte

1. **Réduire l'image à 110 px de large** — c'est sa taille réelle dans la main
   sur mobile. Reconnaît-on encore le sujet ?
2. **Le fond est-il vraiment transparent ?** Pas de halo blanc sur les contours,
   pas de damier aplati en blanc.
3. **Une couleur hors palette s'est-elle glissée ?** Les modèles ajoutent
   volontiers un bleu de ciel ou un vert de pelouse qui n'ont rien à faire là.
4. **Posée à côté des cartes déjà validées, tient-elle dans la famille ?**
   C'est ce point qui décide, pas la beauté de la carte prise isolément.

---

## 6. Intégration dans le jeu

```sh
# 1. déposer les fichiers
cp mes-illustrations/*.webp assets/cards/

# 2. recenser
npm run cards:scan

# 3. recharger la page
```

Chaque fichier remplace le dessin par défaut de la carte correspondante. Les
cartes sans fichier gardent leur dessin actuel : **on peut y aller une carte à
la fois**, le jeu reste cohérent et jouable à chaque étape.

Les noms de fichiers doivent correspondre **exactement** à ceux du tableau,
sinon `cards:scan` les signale comme ignorés.
