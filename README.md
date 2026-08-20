# Les Canonniers — webapp

Reconstruction web, mobile-first, du jeu de cartes **Les Canonniers** (« un jeu de
football »), édité par les Éditions Edmond Dujardin à Arcachon dans les
années 1960.

Le projet est une reconstruction personnelle et non commerciale, faite à partir
d'un exemplaire physique documenté : scan du livret de règles, photos de la
boîte, du plateau métallique et des cartes, et inventaire du deck.

## Lancer le jeu

Aucune dépendance, aucune étape de compilation. Il faut simplement servir le
dossier en HTTP (les modules ES ne se chargent pas depuis `file://`) :

```sh
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Jouer

- **2 ou 4 joueurs.** En mode 4 joueurs, les équipes alternent autour de la
  table : vert, blanc, vert, blanc.
- **Chaque siège est humain ou tenu par l'ordinateur**, librement. Humain contre
  ordinateur, deux humains en pass-and-play, ou ordinateur contre ordinateur pour
  regarder une partie se dérouler.
- Entre deux joueurs humains, l'écran se masque : chacun ne voit que sa main.
- À son tour, on pioche une carte, on pose de une à trois cartes consécutives sur
  la pile de jeu, puis on complète sa main à huit cartes.
- Les cartes jouables sont cerclées d'or ; les autres restent lisibles mais en
  retrait. Le bandeau de consigne rappelle ce que la carte exposée autorise.

L'écran **Règles** contient un aide-mémoire, la table de succession complète et
la galerie des 108 cartes avec leurs quantités.

## Ce que contient le deck

108 cartes jouables, conformes à l'exemplaire documenté. La boîte contenait aussi
une carte vierge : c'est une carte de remplacement, sans fonction de jeu, et elle
n'est pas distribuée.

| Carte | Nb | Carte | Nb | Carte | Nb |
|---|--:|---|--:|---|--:|
| Interception | 13 | Faute | 10 | Touche | 2 |
| Passe | 12 | Dégagement | 10 | Corner | 2 |
| Arrêt | 11 | Coup franc | 8 | Penalty | 2 |
| Tir au but | 10 | Contre-attaque | 6 | Hors-jeu | 2 |
| But | 10 | Coup de chance | 4 | Sortie de but | 2 |
| | | Boulet de canon | 3 | But refusé | 1 |

## Organisation du code

```
index.html            structure des trois écrans (accueil, jeu, règles)
css/style.css         direction artistique : palette et gabarits relevés du matériel
js/deck.js            les 108 cartes, quantités et attributs visuels
js/rules.js           table de succession et légalité des coups — source de vérité
js/state.js           état de partie et transitions (aucun DOM)
js/match.js           déroulement d'un tour, partagé par l'interface et les tests
js/ai.js              joueur artificiel
js/assets-mapping.js  pictogrammes et illustrations SVG
js/ui.js              rendu et interactions
js/main.js            point d'entrée
```

Les couches ne se mélangent pas : `rules.js` ne connaît que des identifiants de
cartes, `state.js` ne touche jamais au DOM, `ui.js` ne contient aucune règle. La
même fonction `aiTurn()` de `match.js` alimente l'affichage pas-à-pas dans le
navigateur et les simulations headless.

## Tests

```sh
node test/rules.test.mjs        # 26 tests unitaires du moteur
node test/simulation.mjs 300    # 300 parties ordinateur contre ordinateur
node test/ui.test.mjs           # parcours navigateur (serveur requis)
node test/screenshot.mjs /tmp/shots   # captures mobiles (serveur requis)
```

La simulation est le test le plus sévère : à chaque tour, elle vérifie que les
108 cartes sont toutes présentes et uniques, qu'aucune main ne déborde, que le
camp du ballon reste valide et que la partie progresse. Elle signale aussi toute
carte **jamais posée** sur l'ensemble des parties — c'est ainsi qu'a été détecté
un vrai bug de transcription : la carte `penalty` était strictement injouable
parce que la table interdisait à une faute d'en suivre une autre, rendant la
« double faute » du livret impossible.

## Fidélité au matériel d'origine

**Ce qui vient directement des sources :** les intitulés et quantités des cartes,
la table de succession, la palette (vert du plateau, crème du carton, rouge des
cartouches, or du ballon, bleu du dos de carte), la composition bicolore du
plateau, et la structure imprimée des cartes — monogramme en cartouche de
couleur, intitulé en bas de casse, listes de succession en noir et rouge,
répétition tête-bêche.

**Ce qui a été redessiné :** les illustrations. Ce sont de nouveaux dessins SVG,
faits dans l'esprit graphique du matériel des années 60 (aplats francs cernés de
noir, maillots à larges bandes, poses sportives lisibles), et non des
reproductions des dessins imprimés d'origine.

## Points de règle arbitrés

Trois points ont demandé une interprétation, tous documentés en détail dans
[`docs/regles-implementees.md`](docs/regles-implementees.md) :

1. **Le tableau des pages 13-15 et le texte des cartes ne se découpent pas
   pareil** — le premier classe par position du ballon, le second par équipe
   (noir/rouge). Le moteur suit la convention des cartes, sauf là où le tableau
   est plus précis : après un hors-jeu, le coup franc revient à l'équipe qui l'a
   signalé, c'est-à-dire celle qui défendait.
2. **La carte vierge** n'est décrite nulle part dans le livret. Traitée comme une
   carte de remplacement sans fonction de jeu : elle n'est pas distribuée.
3. **Le déblocage de la pile** : quand plus personne ne peut enchaîner sur la
   carte exposée, la pile part à la défausse et la partie repart sur un coup
   d'envoi. Le livret ne prévoit ce cas que pour le coup d'envoi ; la règle a été
   étendue à toute la partie.

## Sources

Le dossier `assets/user-files/` contient le scan du livret (`canon_rg.pdf`) et
les photos du matériel qui ont servi de référence. `docs/` regroupe la
transcription des règles, l'inventaire du matériel et la spécification initiale.
