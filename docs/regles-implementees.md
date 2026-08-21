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

## Les cinq points arbitrés

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

### 4. Quand plus personne ne peut enchaîner — aucun ajout

Certaines cellules sont vides d'un côté (`arrêt` et `sortie de but` ne laissent
rien à l'adversaire, `hors-jeu` rien à l'équipe sanctionnée), et d'autres
n'offrent qu'une seule carte : après une `faute`, seul un `coup franc`. Si
personne n'a en main ce que la table réclame, l'action s'arrête.

**Retenu :** la procédure de la page 9, et rien d'autre. Le joueur bloqué se
défausse, complète sa main au talon, son voisin tente sa chance. Les mains se
renouvellent à chaque tour : l'action repart, ou les cartes s'épuisent et la
partie s'achève.

Une version antérieure remisait la pile après plusieurs tours sans coup joué, par
crainte d'une partie figée. La crainte était infondée : **chaque tour sans carte
posée retire une carte du jeu**, donc la partie converge toujours. Mesuré sur 120
parties simulées, avec et sans cette remise en jeu : *aucune* partie bloquée dans
les deux cas, même longueur (104 contre 106 tours), mais **2,67 buts par partie
avec, 1,71 sans**. L'ajout ne servait à rien et faussait le score de moitié. Il a
été supprimé.

**Le livret n'est donc complété sur aucun point.** La pile de jeu n'est jamais
remise à zéro en cours d'action ; le ballon ne revient au centre que sur un but,
un but refusé, ou au coup d'envoi.

### 5. Qui abat une carte d'arbitre, et qui en profite

Quatre cartes désignent une infraction ou un arrêt de jeu — `faute`, `hors-jeu`,
`sortie de but`, `but refusé`. Pour chacune, les deux cellules du tableau
s'adressent à des camps opposés, et le livret dit lequel :

- **Faute.** Page 10 : *« l'adversaire blanc qui doit jouer entre temps s'empare
  du ballon en abattant : soit "faute", ou deux fautes coup sur coup, qui seront
  suivies d'une sanction : coup franc ou penalty. »* Elle y figure au même rang
  que *« touche, suivie de dégagement »* et *« contre-attaque »* : ce sont les
  manières de **reprendre le ballon**. C'est donc l'équipe qui **subit** la faute
  qui abat la carte, et c'est elle qui botte. Page 7 décrit la séquence d'un seul
  tenant : *« une carte "faute" exposée sera suivie d'un "coup franc" indirect,
  lui-même suivi d'un "tir au but", puis d'un "but" »* — un seul camp, du début à
  la fin. L'équipe sanctionnée, elle, n'a rien à jouer.
- **Hors-jeu.** *« Ne peut être joué que par les adversaires menacés »* : la
  défense l'abat et botte le coup franc.
- **Sortie de but.** *« Raté ! »* s'adresse à l'attaquant, *« Vous devez jouer
  DÉGAGEMENT »* à la défense qui l'a posée.
- **But refusé.** *« Si vous avez joué "but refusé" […] jouez "passe", et attaquez
  à votre tour. »* La cellule se lit sur le poseur, et non sur la position du
  ballon — lequel est au centre à cet instant, ce qui ne désignerait aucune des
  deux colonnes.

Reste la question de la seconde faute : aucune cellule ne dit qui la pose. Elle se
déduit de la première — c'est le même camp qui réclame deux fois, et les
parenthèses de la ligne *« 2 FAUTES coup sur coup »* attribuent bien les deux
fautes à un seul camp fautif, *« (commises par les défenseurs) »* ou
*« (commises par les attaquants) »*. Le botteur peut donc aggraver sa réclamation
d'une seconde carte, jamais d'une troisième. Sans cela la double faute serait
inatteignable, et avec elle le penalty et le coup franc direct : trois cartes
imprimées, douze exemplaires, resteraient lettre morte.

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

- `test/rules.test.mjs` — 50 tests, chacun citant la cellule de la transcription
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
- **Retour au centre injustifié.** La pile était remisée dès qu'un tour de table
  passait sans carte posée : le plateau revenait au coup d'envoi sans but marqué,
  ce qui se lit comme un bug — et n'était nulle part dans le livret. Supprimé
  après mesure (voir le point 4).
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
- **Sanctions attribuées au mauvais camp.** Le moteur tenait la carte `faute`
  pour l'aveu de celui qui commet la faute, et donnait donc le coup franc à
  l'adversaire. Page 10 dit le contraire : on abat la faute pour *« s'emparer du
  ballon »*, et la sanction est pour soi. Trois cartes suivaient la même lecture
  inversée — `hors-jeu`, `sortie de but`, `but refusé` — cette dernière ne
  laissant même plus rien à personne, le ballon étant au centre. Le défaut se
  voyait sur les cartes elles-mêmes : le texte imprimé annonçait « Coup franc »
  en noir, c'est-à-dire jouable par son propre camp, quand le moteur le réservait
  à l'adversaire. Le déplacement du ballon en découlait faux lui aussi.
- **Moteur bâti sur un résumé.** Les premières versions s'appuyaient sur une
  synthèse des règles et non sur le texte, et manquaient l'axe « position du
  ballon » du tableau. Le moteur a été réécrit sur la transcription.
