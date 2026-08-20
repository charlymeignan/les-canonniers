# Spécification développeur — base de reconstruction

## Objectif

Créer une webapp mobile-first jouable, très fidèle au jeu **Les Canonniers**, à partir du livret scanné, des photos de la boîte et des cartes, et de l'inventaire observé dans l'exemplaire documenté.[file:42][file:40][file:41]

## Contraintes de fidélité

- Reprendre l'ambiance visuelle du matériel physique : palette vert, blanc cassé, noir, orange-rouge, bleu pour le dos des cartes.[file:35][file:36][file:37][file:40][file:41]
- Préserver les intitulés de cartes observés et la logique de succession décrite dans le livret.[file:42]
- Utiliser comme base le deck réel observé : 109 cartes total, dont 108 jouables et 1 vierge.[file:42]

## Matériel à modéliser

- Plateau avec 2 camps : blanc et vert.[file:36][file:42]
- Ballon matérialisé par une position sur le terrain et un état logique de camp.[file:36][file:42]
- Talon, pile de jeu, pile de défausse.[file:30][file:42]
- Main de 8 cartes par joueur.[file:30][file:42]
- Score par équipe, les buts marqués correspondant aux piles remportées.[file:31][file:42]

## Modes de jeu à viser

1. Mode 2 joueurs local sur un seul appareil.
2. Mode 4 joueurs local pass-and-play.
3. IA simple plus tard.

## États logiques minimaux

- camp_du_ballon : `centre | blanc | vert`
- carte_exposee : dernière carte de la pile de jeu
- pile_de_jeu
- pile_de_defausse
- talon
- mains_joueurs
- score
- joueur_actif
- equipe_active
- fenetre_but_refuse
- compteur_fautes_consecutives
- historique

## Règles structurelles importantes

- Début de partie : coup d'envoi avec `passe`, ballon placé au centre puis envoyé dans le camp adverse.[file:29][file:42]
- Chaque joueur pioche avant de jouer, puis peut poser 1 à 3 cartes consécutives, puis complète à 8 cartes.[file:42]
- La table de succession des pages 13 à 15 doit servir de source de vérité pour les coups autorisés.[file:42]
- `boulet de canon`, `coup franc direct` et `penalty` ont une défense très restreinte : deux `arrêt` ou `arrêt` + `coup de chance`.[file:28][file:42]
- `but refusé` peut être joué hors tour au moment exact où le but est marqué.[file:28][file:42]
- Le ballon change de camp dans les cas explicitement listés page 12.[file:28][file:42]

## Priorité de développement

1. Encodeur complet des règles de succession.
2. Représentation fidèle du deck et des quantités.
3. UX mobile : lisibilité des cartes, état du terrain, main scrollable, historique.
4. Rendu visuel fidèle au matériel scanné.
5. Tests de séquences de règles.

## Références visuelles clés

- Couverture de boîte.[file:37]
- Plateau.[file:36]
- Intérieur de boîte et dos de cartes.[file:35]
- Face des cartes, première série.[file:40]
- Face des cartes, deuxième série.[file:41]

