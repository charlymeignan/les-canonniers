# Les Canonniers — transcription du livret de règles

Transcription fidèle du livret **« Règle du jeu — les canonniers, jeu de football »**,
Éditions Edmond Dujardin, Arcachon.

**Source.** Les pages ont été extraites du scan `assets/user-files/canon_rg.pdf` en
récupérant les flux JPEG bruts qu'il contient, soit **1150 × 1638 px** — nettement
plus lisibles que les photographies du livret prises à part. Les pages 4 à 16
sont transcrites depuis cette source. Les pages 2 et 3 (sommaire et introduction)
proviennent des photographies, seule source disponible pour elles.

Le texte est reproduit **tel quel**, y compris ses tournures et sa ponctuation
d'époque. Les mises en évidence (gras, italique) suivent celles de l'imprimé.
Les seuls ajouts sont les titres de niveau markdown et les numéros de page.

> Ce document est la référence à laquelle confronter `js/rules.js`. Les écarts
> assumés entre le livret et le moteur sont recensés séparément dans
> [`regles-implementees.md`](regles-implementees.md).

---

## Couverture

**Règle du jeu**
**les canonniers**
**jeu de football**

Editions Edmond Dujardin — Arcachon - France

---

## Page 2 — Sommaire

| Section | Page |
|---|--:|
| Petit lexique du football | 4 |
| Composition du jeu | 6 |
| But du jeu | 7 |
| Préparation du jeu : nombre de joueurs, choix des équipes, position des joueurs, distribution des cartes, le terrain | 8 |
| Le jeu : avant de jouer, coup d'envoi, déroulement du jeu, buts marqués, cartes spéciales, mouvements du ballon | 9 à 12 |
| Succession des cartes | 13 |

---

## Page 3 — les canonniers, un nouveau jeu Edmond Dujardin

Originaire du vieux jeu français de la « soule », puis réinventé et rebaptisé au
siècle dernier en Angleterre, le football actuel est plus jeune que jamais malgré
ses cent ans passés. Aucun autre sport n'a plus vite conquis la faveur des joueurs
et du public, et n'a mieux su la conserver. Le football est le jeu le plus
populaire du monde.

Comment expliquer ce succès durable, sinon par la principale caractéristique du
football ? À première vue, pour se saisir d'un ballon, le geste le plus naturel
serait de l'attraper avec les mains. Les inventeurs du football ont délibérément
écarté cette possibilité. Le torse, la tête, et bien sûr les pieds et les jambes
peuvent entrer en contact avec le ballon : les mains et les bras, jamais, sous
peine de déchaîner les foudres de l'arbitre.

Nous vous proposons, nous, de jouer avec les mains, et aussi avec la tête. Le jeu
des CANONNIERS vous permet d'adresser à vos adversaires des « boulets de canon »
imparables, en respectant les règles du jeu réel. Simultanément, vous serez
gardien de buts, avant, arrière, et même arbitre !

Si vous n'y connaissez rien en football, ce jeu vous amusera et, qui sait ?
peut-être vous donnera-t-il la passion du ballon rond… Si, au contraire, vous êtes
amateur ou joueur chevronné, vous tirerez le plus grand plaisir de vos parties de
CANONNIERS en organisant des compétitions inter-clubs. Et maintenant, bonne
chance !

---

## Pages 4-5 — PETIT LEXIQUE

**TERRAIN** : rectangle long d'une centaine de mètres, comportant
principalement :

- deux buts, défendus par un gardien ; chaque équipe s'efforcera d'introduire le
  ballon dans les buts des adversaires ;
- devant chaque but, une surface de réparation, qui a une grande importance si
  une faute y est commise.

**BALLON** : boule sphérique, en cuir, d'un poids de 400 g environ.

**ÉQUIPE** : groupe de 11 joueurs, dont un gardien de but et un capitaine.

**ARBITRE** : juge suprême, qui fait rigoureusement appliquer la règle du jeu.

**JUGE DE TOUCHE.** — Il indique à l'arbitre :

- que le ballon est sorti (« touche » ou « corner ») ;
- à quelle équipe revient la touche.

**CORNER** (ou *COUP DE PIED DE COIN*) : lorsqu'une équipe fait franchir
accidentellement au ballon sa propre ligne de but, l'un des joueurs de l'équipe
adverse le remet en jeu à partir du coin du terrain le plus proche de la sortie.

**BUT MARQUÉ** : le ballon est entré dans l'un des buts. L'arbitre peut refuser le
but si le ballon y est entré de façon irrégulière (hors jeu).

**HORS JEU** : un joueur est « hors jeu » s'il y a moins de deux adversaires
(gardien de but compris) entre lui et la ligne de but adverse.

**FAUTES** : elles sont multiples.

Sont pénalisées par un **coup franc indirect** les fautes suivantes :

- hors jeu ;
- jeu dangereux ;
- charge hors de propos ;
- critique de l'arbitre par un joueur, etc.

par un **coup franc direct** les fautes graves :

- brutalités et crocs-en-jambe ;
- contacts de la main ou du bras avec le ballon ;

par un **penalty** :

- toute faute commise par un défenseur dans la surface de réparation.

**COUP FRANC** : le joueur qui en bénéficie envoie un « boulet de canon » dans les
buts adverses. Ses adversaires n'ont pas le droit de l'approcher de plus de
9,15 mètres.

Le coup franc peut être :

- **direct** : le « canonnier » a le droit de marquer directement ;
- **indirect** : le botteur n'a pas le droit de marquer directement et doit passer
  le ballon à l'un de ses coéquipiers.

**PENALTY** (ou *COUP DE PIED DE RÉPARATION*) : tous les joueurs, sauf le gardien
de but — qui doit rester immobile — et le « canonnier », sont obligatoirement à
une distance d'au moins 9,15 mètres de ce dernier, et hors de la surface de
réparation.

---

## Page 6 — COMPOSITION DU JEU

Chaque partenaire, selon les cartes qu'il possède, jouera tour à tour le rôle :

**Des joueurs,** qui attaquent ou ripostent au moyen des cartes suivantes :

- passe,
- interception,
- dégagement,
- contre-attaque,
- tir au but,
- boulet de canon,
- coup de chance,
- but.

**Du gardien de but,** qui tente de stopper tir au but, boulet de canon, penalty
ou coup franc en abattant :

- arrêt,
- coup de chance,
- sortie de but.

**De l'arbitre,** qui apprécie, juge et punit avec les cartes :

- but refusé,
- touche,
- corner,
- hors jeu,
- faute, sanctionnée par un coup franc (indirect),
- deux fautes coup sur coup, sanctionnées par :
  - coup franc (direct),
  - penalty.

---

## Page 7 — BUT DU JEU

Il faut marquer le plus de buts possible.

La carte « but » sera toujours précédée :

- d'un « tir au but »,
- ou d'un « boulet de canon ».

S'il y a eu double faute préalable, de :

- « coup franc » direct,
- ou « penalty ».

Et, si la chance a bien servi les attaquants :

- d'un « coup de chance ».

De même, toutes les cartes du jeu seront précédées ou suivies de cartes bien
définies, de façon à respecter l'enchaînement des actions du jeu réel. Ainsi, une
carte « faute » exposée sera suivie d'un « coup franc » indirect, lui-même suivi
d'un « tir au but », puis d'un « but », etc.

Le joueur qui vient de marquer un but ramasse la pile de jeu. À la fin de la
partie, le nombre de piles exposées représente le nombre de buts marqués.
L'équipe gagnante est bien sûr celle qui a le plus de piles alignées devant elle.

\* \*

Plus le rythme du jeu sera vif, plus vous (ou vos adversaires !) marquerez de
buts, et plus vous vous amuserez ; « feintez », dribblez, gardez l'adversaire en
haleine ! Pilonnez-le de boulets de canon !

Auparavant, lisez soigneusement les pages suivantes. Nous avons essayé de
simplifier au maximum les règles du jeu réel, pour que les débutants n'éprouvent
pas trop de difficultés. La suite logique des cartes et les mouvements du ballon,
carte par carte, sont expliqués dans les dernières pages de la brochure.

Si vous connaissez à fond le football, n'hésitez pas : allez au-delà des règles
codifiées dans cette notice. Tous les coups vous sont permis, dès lors qu'ils
suivent la logique du vrai football.

---

## Page 8 — PRÉPARATION DU JEU

### Nombre de joueurs

Les parties les plus intéressantes se font à quatre (deux équipes de deux). On
peut aussi jouer à six, en deux équipes de trois, ou à deux, chacun pour soi.

### Choix des équipes

Tous les joueurs jettent le dé.

Celui qui obtient le plus haut point donnera les cartes. En contrepartie, il a le
droit :

- de choisir son ou ses équipiers ;
- de choisir la couleur de son camp : blanc ou vert ;
- de donner le coup d'envoi.

Les joueurs qui n'ont pas été choisis formeront la deuxième équipe.

### Position des joueurs

Il doit toujours y avoir un joueur d'une équipe adverse entre deux membres d'une
même équipe.

### Distribution des cartes

Le donneur :

- mélange bien les cartes ;
- fait couper par son voisin de droite ;
- commence la distribution (une seule carte à la fois, sans les faire voir) par
  son voisin de gauche.

La distribution est terminée lorsque chaque joueur a huit cartes en main.

La pile de cartes restantes est posée au milieu du tapis, face dessous, et
constitue **le talon**, dans lequel les joueurs puiseront en cours de partie.

### Le terrain

Il sera posé à proximité du talon, de façon que tous les joueurs puissent
atteindre sans difficulté le ballon aimanté et le déplacer.

---

## Page 9 — LE JEU

**Avant de jouer,** prenez une carte au talon. Ensuite, vous pourrez abattre une,
deux ou **au maximum trois** cartes consécutives, face visible, qui formeront la
**pile de jeu**, à côté du talon.

Après avoir joué, vous compléterez à huit vos cartes en main, en vous servant au
talon.

Si, après avoir pris une carte au talon, vous vous apercevez qu'il vous est
impossible de jouer, débarrassez-vous de celle de vos cartes que vous jugez la
moins utile. Vous la déposez, face visible, de l'autre côté du talon. Il se forme
ainsi une troisième pile, appelée **pile de défausse**.

Enfin, vous devrez **modifier la position du ballon sur le terrain** en fonction
de la situation provoquée par les cartes que vous venez d'abattre.

*(Schéma : « Disposition de la table de jeu » — Blanc et Vert se font face ; au
centre, le terrain et le ballon, puis en ligne la pile de jeu, le talon et la pile
de défausse.)*

---

## Page 10 — Coup d'envoi

Au commencement de la partie, le ballon est placé au centre du terrain.

Le joueur qui a obtenu le plus haut point en jetant le dé prend une carte au talon
et joue le premier. Pour cela, il doit commencer la pile de jeu **par une carte
« passe »**. Simultanément, il fera entrer le ballon dans le camp adverse.

*Il n'est pas permis de marquer un but dès le coup d'envoi, sauf si l'on peut
abattre de suite : « passe » - « coup de chance » - « but ».*

Si le joueur qui doit donner le coup d'envoi ne peut jouer « passe », il dépose
une carte sur la pile de défausse et c'est son voisin de gauche (donc, un
adversaire) qui devient bénéficiaire du coup d'envoi. Si ce dernier ne possède pas
non plus de carte « passe », il se défausse à son tour, et ainsi de suite jusqu'à
ce que l'un des partenaires puisse jouer « passe ».

### Déroulement du jeu

Le coup d'envoi vient d'être donné, et l'un des joueurs verts, par exemple, a
commencé la pile de jeu avec une carte « passe ». Le ballon est alors dans le camp
blanc.

Plusieurs possibilités se présentent, qui dépendent :

- des cartes possédées par le joueur ;
- de la suite qui leur sera donnée par l'adversaire ou par son équipier.

**1 -** Le joueur vert possède « coup de chance » et « but » : il marque, et essaye
de donner un nouveau coup d'envoi avec une « passe ».

**2 -** Le joueur vert a une carte « boulet de canon » : il la pose sur la pile de
jeu, et son équipier marquera, s'il possède la carte « but », à moins que
l'adversaire n'ait déposé auparavant 2 cartes « arrêt », ou un « arrêt » et un
« coup de chance ».

**3 -** Le joueur vert possède une carte « tir au but » : il la joue, et ce sera à
son coéquipier vert de marquer le but, s'il possède lui-même cette carte et si
l'adversaire blanc **qui doit jouer entre temps** ne s'empare pas du ballon en
abattant :

- soit « faute », ou deux fautes coup sur coup, qui seront suivies d'une sanction :
  coup franc ou penalty ;
- soit « touche », suivie de « dégagement », ou encore « contre-attaque », ou
  « interception » suivie de « passe », dont l'effet sera de renvoyer le ballon
  dans le camp vert.

---

## Page 11 — suite du déroulement, et Buts marqués

**4 -** Le joueur vert ne possède qu'une autre carte « passe » : il peut la jouer
(ce qui lui permettra de reprendre une carte au talon pour compléter sa main),
dans l'espoir que l'adversaire sera dans l'incapacité de s'emparer du ballon… et
que son équipier pourra continuer l'attaque.

**5 -** Le joueur vert n'a aucune carte utile : comme dans le cas précédent, ce sera
à son équipier d'essayer de continuer l'attaque, dans la mesure où l'adversaire ne
pourra rien faire entre temps.

Ainsi, chaque action du jeu, représentée par une carte, est appuyée par une ou
plusieurs cartes qui la complètent et permettent de marquer un but. En
contrepartie, d'autres cartes, jouées par l'adversaire, lui permettront de
s'emparer du ballon et de retourner la situation — si elles sont jouées au bon
moment. Le jeu continue jusqu'à épuisement du talon et des cartes en main.

Chacune des cartes du jeu comporte une suite logique de cartes successives, qui
est détaillée à la fin de la brochure. Très vite, vous les connaîtrez toutes par
cœur. Cependant, pour vous faciliter l'assimilation de cette suite, nous avons
imprimé, sur les cartes elles-mêmes :

- **En noir :** la série de cartes parmi lesquelles les **équipiers** peuvent
  choisir pour continuer l'action entreprise ;
- **En rouge :** la série des cartes parmi lesquelles les **adversaires** peuvent
  choisir pour gêner l'action entreprise, s'emparer du ballon et essayer de
  marquer un but.

### Buts marqués

Le joueur qui vient de marquer un but ramasse la pile de jeu, la pose devant lui,
complète à huit ses cartes en main et rejoue immédiatement (sauf si un adversaire
lui oppose la carte « but refusé »), dans les mêmes conditions que pour le coup
d'envoi :

- le ballon est déposé au centre du terrain ;
- obligation de jeter une carte « passe » (le ballon passe alors dans le camp
  adverse) ;
- interdiction de marquer un but tout de suite, sauf si la carte « coup de chance »
  intervient.

---

## Page 12 — Cartes spéciales

**Boulet de canon :** Ce tir presque imparable ne peut être stoppé que par :

- deux arrêts successifs ;
- ou un arrêt suivi d'un coup de chance.

Les cartes « faute », « hors-jeu », « touche » et « interception » **ne peuvent
pas** être jouées sur un « boulet de canon ».

En revanche, « boulet de canon » peut être joué sur « tir au but » pour renforcer
le tir.

**Penalty et coup franc direct :** ont les mêmes pouvoirs que le « boulet de
canon » ; toutefois, ces cartes doivent être obligatoirement précédées de deux
fautes coup sur coup.

**But refusé :** décision sans appel de l'arbitre ; le « but refusé » est valable
même sur un « penalty », un « coup franc » direct ou un « boulet de canon » suivi
de « but ».

Le joueur qui possède la carte « but refusé », **même si ce n'est pas son tour de
jouer**, doit l'annoncer à voix haute et l'abattre au moment précis où l'adversaire
marque un but. Ce dernier complète alors à huit ses cartes en main et perd le
bénéfice du but et de la remise en jeu. L'auteur du « but refusé » prend **deux
cartes** au talon — l'une pour remplacer la carte « but refusé » qu'il vient de
jouer, l'autre comme d'habitude avant de jouer — et joue immédiatement un nouveau
coup d'envoi.

### Mouvements du ballon

Le ballon change de camp :

**1 -** Si une équipe expose la carte « contre-attaque » ;

**2 -** Si une équipe joue la carte « interception », suivie de :

- dégagement,
- boulet de canon,
- deux passes successives ;

**3 -** Après une « touche », suivie de passe, ou dégagement, ou contre-attaque ;

**4 -** Si l'équipe menacée (le ballon étant alors dans son propre camp) joue
« faute » ou double faute, sanctionnée par :

- coup franc indirect (faute simple),
- coup franc direct ou penalty (double faute).

---

## Pages 13 à 16 — SUCCESSION DES CARTES

Le tableau croise **deux** critères, et non un seul :

- **en ligne**, la carte exposée — et, pour plusieurs d'entre elles, *qui* l'a
  posée : votre équipe ou vos adversaires ;
- **en colonne**, la position du ballon : *« LE BALLON EST DANS LE CAMP ADVERSE :
  ATTAQUEZ ! »* ou *« LE BALLON EST DANS VOTRE CAMP : RIPOSTEZ ! »*

### Page 13

**PASSE — si la carte a été posée par votre équipe :**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Tir au but<br>ou Coup de chance<br>ou Boulet de canon<br>ou Autre passe | Contre-attaque<br>Dégagement<br>Autre passe<br>→ **le ballon change de camp** |

**PASSE — si la carte a été posée par vos adversaires :**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Faute<br>2 fautes coup sur coup<br>Corner<br>Interception<br>Contre-attaque | Faute<br>2 fautes coup sur coup<br>Touche<br>Interception<br>Contre-attaque |

**INTERCEPTION — si la carte a été posée par votre équipe :**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Tir au but<br>Coup de chance<br>Boulet de canon<br>Passe | Contre-attaque<br>Dégagement<br>2 passes de suite<br>→ **le ballon change de camp** |

**INTERCEPTION — si la carte a été posée par vos adversaires :**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Faute<br>2 fautes coup sur coup<br>Autre interception | Faute<br>2 fautes<br>Autre interception<br>Contre-attaque |

### Page 14

**DÉGAGEMENT** *(doit être précédée d'une INTERCEPTION ou de TOUCHE)* — *Le ballon
change de camp.*

*Le ballon a changé de camp, vous pouvez jouer :*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Tir au but<br>Coup de chance<br>Boulet de canon<br>Passe | Contre-attaque<br>Interception<br>Touche<br>Faute ou double faute |

**CONTRE-ATTAQUE** — *Vous vous emparez du ballon sans jouer « interception »
auparavant.*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| *Le ballon a changé de camp, jouez :*<br>Tir au but<br>Coup de chance<br>Boulet de canon<br>Passe | Interception<br>Touche<br>Faute, ou double faute |

**TIR AU BUT**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Jouez : **BUT**<br>ou, pour renforcer votre tir au but :<br>— boulet de canon<br>— coup de chance | Jouez : Interception<br>Contre-attaque<br>Arrêt<br>Coup de chance<br>Sortie de but<br>Hors-jeu<br>Faute, ou 2 fautes |

**BOULET DE CANON**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Jouez : **BUT** | Jouez :<br>— 2 arrêts coup sur coup, ou<br>— 1 arrêt et 1 coup de chance<br>*(il n'y a pas d'autres parades possibles)* |

**COUP DE CHANCE**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Un « coup de chance » peut remplacer un « tir au but ».<br><br>Jouez : **BUT** | Le « coup de chance » a été joué par votre équipe : il peut remplacer un « arrêt » et vaut dégagement.<br>Si le coup de chance a été joué par les adversaires, jouez : arrêt, ou un autre coup de chance. |

### Page 15

**BUT**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| **BRAVO !** Ramassez la pile de jeu, prenez une carte au talon, et rejouez. | Votre seule possibilité : Jouer **BUT REFUSÉ** |

**ARRÊT** *valant dégagement*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Dommage ! Jouez : Interception, Contre-attaque | 1 arrêt vaut dégagement : le ballon change de camp. |

**SORTIE DE BUT**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Raté ! | Vous **devez** jouer DÉGAGEMENT ; le ballon change de camp. |

**BUT REFUSÉ**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Décision de l'arbitre : tant pis pour vous ! | Si vous avez joué « but refusé », le ballon est remis en jeu : jouez « passe », et attaquez à votre tour. |

**TOUCHE** *valant rentrée en touche* — *La carte TOUCHE est jouée par votre
équipe : vous reprenez le contrôle du ballon.*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Tir au but<br>Coup de chance<br>Boulet de canon<br>Passe | Dégagement<br>Contre-attaque<br>Passe<br>et **le ballon change de camp**. |

*La carte TOUCHE est posée par l'adversaire :*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Interception<br>Faute | Contre-attaque<br>Interception<br>Faute |

### Page 16

**CORNER**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Ne peut être joué que si l'adversaire possède le ballon. Faites suivre de :<br>Tir au but<br>Passe | Le corner vous a été imposé par vos adversaires. Jouez :<br>Interception<br>Faute<br>Double faute<br>Contre-attaque |

**HORS-JEU** *(doit être suivi de coup franc indirect)*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Le HORS-JEU, qui ne peut être joué que par les adversaires menacés, vous a été imposé. | Jouez obligatoirement : Coup franc (indirect). Le ballon change de camp. |

**1 seule FAUTE** *(doit être obligatoirement suivie d'un coup franc indirect)*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| *(faute commise par les défenseurs)*<br>Jouez : coup franc indirect. | *(faute commise par les attaquants)*<br>Jouez : coup franc indirect. Le ballon change de camp. |

**COUP FRANC** *(indirect si une seule carte faute est exposée)*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| Jouez : Tir au but<br>Boulet de canon<br>Passe | Jouez : Interception<br>Contre-attaque<br>Touche |

**2 FAUTES coup sur coup** *(doivent être suivies de coup franc direct ou de
penalty)*

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| *(commises par les défenseurs)*<br>Jouez :<br>— coup franc (direct)<br>— penalty | *(commises par les attaquants)*<br>Jouez : coup franc (direct)<br>Le ballon change de camp. |

**COUP FRANC** *(direct si deux cartes « faute » sont exposées)* **et PENALTY**

| Ballon dans le camp adverse : attaquez ! | Ballon dans votre camp : ripostez ! |
|---|---|
| **BUT** | — 2 arrêts<br>— 1 arrêt et 1 coup de chance |

*IMPRIMÉ EN FRANCE*
