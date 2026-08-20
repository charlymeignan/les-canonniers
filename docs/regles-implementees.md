# Table de succession implémentée

Ce document est la source de vérité utilisée par le moteur de règles (`js/rules.js`).
Il a été reconstruit en croisant trois sources du kit :

1. Le tableau **« Succession des cartes »**, pages 13 à 15 du livret (photos des pages).
2. Le texte imprimé sur **chaque carte** elle-même : en noir la liste des cartes que
   *la même équipe* peut jouer pour poursuivre son action, en rouge la liste des cartes
   que *l'équipe adverse* peut jouer pour riposter (règle explicite donnée en page 10 :
   « noir : la série de cartes parmi lesquelles les équipiers peuvent choisir pour
   continuer l'action entreprise » / « rouge : la série de cartes parmi lesquelles les
   adversaires peuvent choisir pour gêner l'action »).
3. Les pages 4-5 (petit lexique), 6-9 (composition/but du jeu/préparation) et 12
   (cartes spéciales, mouvements du ballon).

Les deux sources (tableau pages 13-15 et texte imprimé sur les cartes) se recoupent à
95 % ; quand elles diffèrent légèrement, le texte imprimé sur la carte a été retenu
car il est plus lisible sur les photos macro et car c'est la référence que le joueur a
sous les yeux pendant la partie.

## Principe général du moteur

Pour une carte exposée (le dessus de la pile de jeu) appartenant à une équipe
« propriétaire » (celle qui vient de la poser) :

- **`own`** : cartes que la même équipe peut poser ensuite pour poursuivre l'action.
- **`rival`** : cartes que l'équipe adverse peut poser pour riposter / intercepter /
  s'emparer du ballon.

Le joueur actif (à tour de rôle, pass-and-play) doit poser une carte de la liste qui
correspond à son équipe (`own` si son équipe est propriétaire de la carte exposée,
`rival` sinon). S'il n'a aucune carte valide en main, il pioche.

## Table

| Carte exposée | own (même équipe continue) | rival (équipe adverse riposte) | Ballon change de camp | Notes |
|---|---|---|---|---|
| **passe** | tir_au_but, coup_de_chance, boulet_de_canon, contre_attaque, degagement, passe | faute, touche, interception, contre_attaque | seulement si le rival répond | Carte obligatoire au coup d'envoi et après un but. |
| **contre_attaque** | tir_au_but, coup_de_chance, boulet_de_canon, passe | interception, touche, faute | oui, immédiatement | S'emparer du ballon *sans* interception préalable. |
| **interception** | tir_au_but, coup_de_chance, boulet_de_canon, passe, degagement | faute, interception, contre_attaque | non (le ballon reste où l'interception l'a saisi) | |
| **degagement** | tir_au_but, coup_de_chance, boulet_de_canon, passe | contre_attaque, interception, touche, faute | oui, immédiatement | Doit être précédée d'une interception ou d'une touche. |
| **touche** | tir_au_but, coup_de_chance, boulet_de_canon, passe | degagement, contre_attaque, interception, faute | oui si le rival riposte | Rentrée en touche : l'équipe qui pose la carte reprend le ballon. |
| **tir_au_but** | but, boulet_de_canon, coup_de_chance | interception, contre_attaque, arret, coup_de_chance, sortie_de_but, hors_jeu, faute | non | `boulet_de_canon`/`coup_de_chance` en `own` « renforcent » le tir. |
| **boulet_de_canon** | but | arret, coup_de_chance | non | Défense restreinte : arrêt+arrêt ou arrêt+coup de chance, obligatoirement 2 cartes consécutives. Aucune autre parade. |
| **coup_de_chance** | but | arret, coup_de_chance | non | Carte double usage : remplace un `tir_au_but` en attaque, ou un `arret` en défense (compte alors comme `degagement`). |
| **but** | *(spécial : ramasse pile, pioche au talon, complète à 8, rejoue immédiatement une carte `passe`)* | but_refuse | oui (recentrage puis passe vers le camp adverse) | Score +1 pour l'équipe qui marque, sauf `but_refuse`. |
| **but_refuse** | passe *(l'équipe qui a annulé le but relance comme à un coup d'envoi)* | — | ballon remis au centre | Jouable hors tour, uniquement dans l'instant qui suit un `but`. |
| **arret** | interception, contre_attaque | — | oui (l'arrêt vaut dégagement) | Le gardien capte : son équipe relance. |
| **sortie_de_but** | degagement *(obligatoire)* | — | oui | « Raté ! » |
| **hors_jeu** | coup_franc (mode indirect) | — | oui | Ne peut être jouée que par l'équipe menacée par l'attaque. Le coup franc revient à **celle qui a signalé le hors-jeu** (page 15, colonne « le ballon est dans votre camp »), pas à celle qui était en position illicite. |
| **faute** (1ʳᵉ) | faute *(seconde faute possible)* | coup_franc (mode indirect) | si commise par l'équipe qui attaquait | Coup franc indirect obligatoire pour l'équipe lésée. |
| **faute** (2ᵉ coup sur coup) | — *(pas de 3ᵉ)* | coup_franc (mode direct) ou penalty *(choix de l'équipe lésée)* | idem | Faute grave répétée. |
| **coup_franc** (indirect) | tir_au_but, boulet_de_canon, passe | interception, contre_attaque, touche | non | Le botteur ne peut pas marquer directement. |
| **coup_franc** (direct) | but | arret, coup_de_chance | non | Mêmes pouvoirs qu'un boulet de canon. |
| **penalty** | but | arret, coup_de_chance | non | Défense restreinte identique au boulet de canon / coup franc direct. |
| **corner** | tir_au_but, passe | interception, faute, contre_attaque | non | « Ne peut être joué que si l'adversaire possède le ballon » : implémenté comme une option de riposte toujours disponible pour l'équipe qui ne possède pas l'initiative, quelle que soit la carte exposée. |

## Deux points de lecture qui ont demandé un arbitrage

### Le tableau des pages 13-15 n'est pas organisé comme les cartes

Le tableau du livret classe les suites selon **la position du ballon** (« le ballon
est dans le camp adverse : attaquez ! » / « le ballon est dans votre camp :
ripostez ! »), tandis que le texte imprimé sur chaque carte les classe selon
**qui joue** (noir = les équipiers, rouge = les adversaires, convention donnée en
page 10). Les deux découpages coïncident dans la très grande majorité des cas,
mais pas partout.

Le moteur suit la convention **noir/rouge des cartes**, parce que c'est celle que
le joueur a physiquement sous les yeux pendant la partie. Là où le tableau est
plus précis que la carte — notamment pour `hors_jeu` — c'est le tableau qui
tranche, et le choix est signalé dans la colonne « Notes » ci-dessus.

### La double faute doit être possible

Le livret sanctionne « 2 fautes coup sur coup » par un coup franc direct ou un
penalty. Pour que ce cas existe, une équipe doit pouvoir poser **deux cartes
`faute` d'affilée** — ce qu'elle peut faire puisqu'un joueur pose de une à trois
cartes consécutives à son tour. La table donne donc `faute → faute` en suite
« own ». Sans cette suite, les cartes `penalty` et `coup franc direct` seraient
strictement injouables : le banc d'essai (`test/simulation.mjs`) l'a détecté en
signalant que `penalty` n'était jamais posé sur 300 parties.

## Blocage de la pile : règle de déblocage ajoutée

Certaines cartes n'ouvrent aucune suite pour l'un des deux camps (`arret` et
`sortie_de_but` ne laissent rien à l'adversaire, `hors_jeu` rien à l'équipe prise
en défaut). Si, en plus, le camp concerné n'a aucune des cartes attendues en main,
plus personne ne peut enchaîner sur la carte exposée.

Le livret ne décrit ce cas que pour le coup d'envoi (page 10 : on se défausse de
proche en proche jusqu'à ce qu'un joueur puisse jouer « passe »). Le moteur étend
la même logique à toute la partie : **quand tous les joueurs ont passé leur tour
à la suite, la pile de jeu part à la défausse, le ballon revient au centre et la
partie repart sur un coup d'envoi.** C'est une extrapolation assumée, sans
laquelle une partie sur deux se figerait.

## Fin de la partie

« Le jeu continue jusqu'à épuisement des cartes en main » (page 11). La partie
s'achève donc quand le talon est vide et que plus aucun joueur n'a de carte ;
l'équipe qui a ramassé le plus de piles — c'est-à-dire marqué le plus de buts —
l'emporte.

## Mouvements du ballon (page 12)

Le ballon change de camp dans les cas suivants, listés explicitement page 12 et
recoupés avec le tableau ci-dessus :

- après une **contre-attaque** (immédiat) ;
- après un **dégagement** (immédiat, car il doit suivre une interception ou une touche) ;
- après un **hors-jeu** (le coup franc indirect qui suit est joué dans l'autre sens) ;
- après une **faute** simple ou double commise par l'équipe qui attaquait ;
- après une **touche** posée par l'adversaire, si celui-ci rejoue ensuite « passe » ;
- au **coup d'envoi** et après chaque **but** (la carte `passe` obligatoire envoie le
  ballon dans le camp adverse).

## Cartes spéciales à défense restreinte

`boulet_de_canon`, `coup_franc` (mode direct) et `penalty` partagent la même défense
très étroite décrite en page 12 : uniquement deux `arret` consécutifs, ou un `arret`
suivi d'un `coup_de_chance`. Aucune autre carte ne peut interrompre ces trois-là.

## Carte vierge

La boîte documentée contenait une 109ᵉ carte vierge, qu'aucune page du livret ne
décrit. **Elle n'est pas une carte de jeu** : c'est une carte de remplacement,
comme il s'en glissait couramment dans les jeux de cartes français de l'époque.
Elle n'est donc pas distribuée, et le deck jouable compte **108 cartes**.

## Comment ces règles sont vérifiées

- `test/rules.test.mjs` — 27 tests unitaires sur le deck, chaque branche de la
  table de succession, et des séquences de partie complètes.
- `test/simulation.mjs` — parties ordinateur contre ordinateur en série. À chaque
  tour, le banc d’essai vérifie que les 108 cartes sont toutes présentes et
  uniques, qu'aucune main ne dépasse la taille autorisée, que le camp du ballon
  reste valide et que la partie progresse vers sa fin. Il signale aussi toute
  carte du deck **jamais posée**, ce qui trahit une branche morte de la table.
- `test/ui.test.mjs` — parcours réels dans un navigateur, y compris une partie
  ordinateur contre ordinateur menée à son terme.
