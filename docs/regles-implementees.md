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

**Retenu :** la même logique est étendue à toute la partie. Quand tous les
joueurs ont passé à la suite, la pile part à la défausse, le ballon revient au
centre et la partie repart sur un coup d'envoi. **C'est le seul ajout au livret.**

## La carte vierge

La boîte contenait une 109ᵉ carte vierge, qu'aucune page du livret ne décrit.
Traitée comme une carte de remplacement, sans fonction de jeu : elle n'est pas
distribuée. Le deck jouable compte **108 cartes**.

## Ce qui est vérifié, et comment

- `test/rules.test.mjs` — 46 tests, chacun citant la cellule de la transcription
  qu'il vérifie. Un échec signifie que le moteur a tort, pas le livret.
- `test/simulation.mjs` — parties ordinateur contre ordinateur. À chaque tour :
  conservation et unicité des 108 cartes, taille des mains, validité du camp du
  ballon, progression vers la fin. Signale toute carte **jamais posée**, ce qui
  trahit une branche morte de la table.
- `test/ui.test.mjs` — parcours réels en navigateur, dont une partie complète.

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
- **Moteur bâti sur un résumé.** Les premières versions s'appuyaient sur une
  synthèse des règles et non sur le texte, et manquaient l'axe « position du
  ballon » du tableau. Le moteur a été réécrit sur la transcription.
