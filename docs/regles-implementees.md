# Du livret au moteur

`docs/regles-reference.md` est la **transcription verbatim** du livret : c'est la
source unique. `js/rules.js` en est la traduction en code, table par table,
cellule par cellule. Ce document ne recense que les points où le passage de l'une
à l'autre a demandé une décision.

> Règle de travail : en cas de désaccord entre ce fichier, le code et la
> transcription, **c'est la transcription qui a raison**. Les deux autres se
> corrigent.

## Comment la table est encodée

Le tableau des pages 13 à 16 croise **deux** critères :

1. la carte exposée — et, pour `passe`, `interception`, `touche` et
   `coup de chance`, *qui* l'a posée : votre équipe ou vos adversaires ;
2. la position du ballon, vue du joueur qui doit jouer :
   « LE BALLON EST DANS LE CAMP ADVERSE : ATTAQUEZ ! » → clé `attaque` ;
   « LE BALLON EST DANS VOTRE CAMP : RIPOSTEZ ! » → clé `riposte`.

`SUCCESSION` reproduit exactement ces deux axes. Les entrées `split: true`
distinguent le poseur ; les autres valent quel que soit le poseur.

## Les quatre points arbitrés

### 1. Les cellules priment sur les mentions en tête de ligne

Deux mentions du livret sont plus restrictives que des cellules qui les
contredisent :

- *« Corner : ne peut être joué que si l'adversaire possède le ballon »*, alors
  que la cellule **passe / posée par vos adversaires / attaquez** l'offre ;
- *« Dégagement doit être précédée d'une INTERCEPTION ou de TOUCHE »*, alors que
  plusieurs cellules l'offrent après une passe.

**Retenu :** les cellules font foi. Elles énumèrent les coups situation par
situation ; les mentions en tête de ligne décrivent le cas général et l'esprit de
la carte. Appliquer les deux rendrait certaines cellules imprimées inatteignables.

### 2. Une carte qui menace le but rend la main

Page 10 : *« ce sera à son coéquipier vert de marquer le but […] si l'adversaire
blanc **qui doit jouer entre temps** ne s'empare pas du ballon »*, et pour le
boulet de canon *« il la pose sur la pile de jeu, et **son équipier marquera** »*.

**Retenu :** poser `tir_au_but`, `boulet_de_canon`, `penalty` ou un
`coup_franc` direct **termine le tour**. La défense a toujours sa fenêtre.

**L'exception explicite est le coup de chance**, énoncée deux fois : *« Le joueur
vert possède coup de chance et but : **il marque** »* (page 10) et *« interdiction
de marquer un but tout de suite, **sauf si la carte coup de chance intervient** »*
(page 11). Il ne rend donc pas la main.

### 3. Une seule carte se joue hors tour

Page 12 : *« Le joueur qui possède la carte "but refusé", **même si ce n'est pas
son tour de jouer**, doit l'annoncer à voix haute et l'abattre au moment précis
où l'adversaire marque un but. »*

Cette précision n'est donnée que pour `but refusé`. Partout ailleurs le livret
décrit une rotation normale : *« l'adversaire qui doit jouer entre temps »*,
*« à moins que l'adversaire n'ait déposé auparavant 2 cartes arrêt »*.

**Retenu :** `but refusé` est la seule carte jouable hors tour. La « riposte »
des colonnes du tableau est ce qu'on joue **quand son tour vient**, face à la
carte exposée par l'adversaire.

### 4. Déblocage de la pile — extrapolation assumée

Certaines cellules sont vides d'un côté (`arrêt` et `sortie de but` ne laissent
rien à l'adversaire, `hors-jeu` rien à l'équipe sanctionnée). Si le camp concerné
n'a pas non plus les cartes attendues en main, plus personne ne peut enchaîner.

Le livret ne traite ce cas que pour le coup d'envoi (page 10 : on se défausse de
proche en proche jusqu'à ce qu'un joueur puisse jouer « passe »).

**Retenu :** la procédure de la page 9 s'applique d'abord — le joueur bloqué se
défausse, complète sa main au talon, et son voisin tente sa chance. Elle dénoue
presque tous les cas, puisque les mains se renouvellent à chaque tour.

Pour le reste, la même logique est étendue à toute la partie : après **deux tours
de table complets** sans qu'une seule carte ait été posée, la pile part à la
défausse, le ballon revient au centre et la partie repart sur un coup d'envoi.
**C'est le seul ajout au livret.** Deux tours de table et non un seul : un joueur
momentanément démuni ne doit pas suffire à effacer une action en cours.

Le retour au centre se produit donc sans qu'un but ait été marqué. L'interface
l'annonce explicitement (« Situation bloquée »), faute de quoi il passe pour un
défaut du jeu.

## La défausse, seul moteur de fin de partie

Page 9 : *« Si, après avoir pris une carte au talon, vous vous apercevez qu'il
vous est impossible de jouer, débarrassez-vous de celle de vos cartes que vous
jugez la moins utile. »* Page 10 applique la même mécanique au coup d'envoi :
sans carte « passe », on se défausse et le voisin devient bénéficiaire.

La condition du livret est *« impossible de jouer »*, pas *« neuf cartes en
main »*. Tant que le talon est garni les deux coïncident — on pioche, on ne pose
rien, on redescend à huit. Une fois le talon vide il n'y a plus de pioche, donc
plus de neuvième carte, et la seule lecture correcte est celle du livret :
**un tour sans carte posée coûte une carte**, quel que soit l'effectif de la
main. C'est aussi ce qui garantit que la partie se termine : sans cela deux
joueurs bloqués se rendent la main indéfiniment.

Une défausse par tour, pas plus.

## La carte vierge

La boîte contenait une 109ᵉ carte vierge, qu'aucune page du livret ne décrit.
Traitée comme une carte de remplacement, sans fonction de jeu : elle n'est pas
distribuée. Le deck jouable compte **108 cartes**.

## Ce qui est vérifié, et comment

- `test/rules.test.mjs` — 49 tests, chacun citant la cellule de la transcription
  qu'il vérifie. Un échec signifie que le moteur a tort, pas le livret.
- `test/simulation.mjs` — parties ordinateur contre ordinateur. À chaque tour :
  conservation et unicité des 108 cartes, taille des mains, validité du camp du
  ballon, progression vers la fin. Signale toute carte **jamais posée**, ce qui
  trahit une branche morte de la table.
- `test/ui.test.mjs` — parcours réels en navigateur, dont une partie complète.
- `test/humain-vs-ia.test.mjs` — une partie complète pilotée depuis l'interface,
  du coup d'envoi à l'épuisement des cartes. `SEATS=human,human` rejoue la même
  partie en pass-and-play. Elle échoue si le nombre de cartes en circulation
  cesse de décroître, si un bouton reste sans effet, si un marqueur humain ne
  reprend pas la main comme le veut la page 11, ou si la fin de partie n'est pas
  annoncée : c'est le test qui attrape les blocages.

## Bugs que ces vérifications ont attrapés

- **`penalty` injouable.** La table interdisait à une faute d'en suivre une
  autre ; la « double faute » du livret ne pouvait donc jamais se produire, et
  avec elle ni penalty ni coup franc direct. Détecté par la simulation, qui
  signalait la carte comme jamais posée.
- **Coup franc direct dégradé en indirect.** Poser la carte réinitialisait son
  mode, rendant le but impossible à marquer au coup suivant.
- **Défense impossible.** L'attaquant enchaînait tir puis but dans le même tour ;
  la défense n'avait jamais la main. Signalé en jouant, corrigé par le point 2.
- **Blocage complet.** `endTurn()` sortait sans rien faire quand la main comptait
  neuf cartes : le bouton « Fin du tour » restait sans effet et la partie était
  définitivement figée. La défausse prévue page 9 n'était pas branchée sur
  l'interface.
- **Boucle infinie en fin de partie.** Talon vide, pile vide, une main sans
  carte « passe » : aucune défausse n'était réclamée (la main ne dépassait pas
  huit cartes), rien ne sortait donc du jeu et les deux joueurs se renvoyaient la
  main sans fin. Détecté par `test/humain-vs-ia.test.mjs`, qui mesure la
  décroissance des cartes en circulation.
- **Tour de l'ordinateur rendu trop tôt.** `endTurn()` s'exécutait avant le
  dernier pas du générateur : l'interface désignait déjà l'humain comme joueur
  actif alors que l'animation de l'ordinateur courait encore, et tous les clics
  étaient silencieusement ignorés.
- **L'ordinateur bradait ses « passe ».** La table de rareté de l'IA classait la
  passe au plus bas — c'est la carte la plus commune — et la sacrifiait donc en
  premier à la défausse. Or c'est la **seule** carte jouable quand la pile est
  vide : une fois ses passes parties, l'ordinateur ne pouvait plus donner le coup
  d'envoi et se défaussait tour après tour. Un tiers des tours de simulation se
  passaient ainsi. L'IA garde désormais toujours une passe.
- **Retour au centre inexpliqué.** La pile était remisée dès qu'un seul tour de
  table passait sans carte posée, et l'interface n'en disait rien : le plateau
  revenait au coup d'envoi sans but marqué, ce qui se lit comme un bug. Le seuil
  est passé à deux tours de table et la remise en jeu est annoncée.
- **Le tour du marqueur escamoté.** Page 11 : le joueur qui marque « rejoue
  immédiatement ». Le moteur clôturait pourtant le tour derrière la résolution du
  but, ce qui rendait la main à l'adversaire ; côté interface, un marqueur humain
  se retrouvait devant des dos de cartes, sans autre bouton actif que la
  défausse. Même défaut pour l'auteur d'un « but refusé », à qui la page 12 donne
  le coup d'envoi suivant. Le marqueur ne prenait par ailleurs qu'une seule carte
  au talon, là où le livret demande de compléter à huit.
- **Fin de partie invisible.** Le message « Fin de la partie » s'affichait dans
  le même bandeau que les autres annonces et pouvait être recouvert par celle qui
  suivait ; une fois le bandeau refermé, le plateau restait en place, les boutons
  répondaient encore et la partie semblait ne jamais s'achever. La fin est
  désormais un état de l'interface : plus rien ne se joue, et le bouton principal
  propose une nouvelle partie.
- **Moteur bâti sur un résumé.** Les premières versions s'appuyaient sur une
  synthèse des règles et non sur le texte, et manquaient l'axe « position du
  ballon » du tableau. Le moteur a été réécrit sur la transcription.
