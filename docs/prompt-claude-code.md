# Prompt pour Claude Code

Tu dois reconstruire une webapp mobile-first très fidèle du jeu de société vintage **Les Canonniers** des éditions Edmond Dujardin, à partir d'un kit de référence contenant un scan PDF des règles, des photos du matériel et un inventaire manuel du deck.[file:42][file:40][file:41]

## Ta mission

Construis une **webapp HTML/CSS/JS** de haute qualité, pensée d'abord pour smartphone, visuellement très proche de l'objet d'origine, avec un moteur de règles sérieux. Le résultat doit être élégant, lisible, et exploitable comme base de produit.

## Fichiers à utiliser

- `assets/user-files/canon_rg.pdf` : scan complet des règles.[file:42]
- `assets/user-files/*.jpg` : photos de la boîte, du plateau, du livret et des cartes.[file:34][file:35][file:36][file:37][file:40][file:41]
- `docs/regles-reference.md` : transcription structurée de référence.[file:42]
- `docs/inventaire-materiel.md` : inventaire du contenu de la boîte et du deck.[file:35][file:40][file:41]
- `docs/spec-dev.md` : base d'architecture et contraintes fonctionnelles.[file:42]

## Contraintes fortes

- Respecter la logique du livret papier, surtout la table de succession des cartes pages 13 à 15.[file:42]
- Utiliser le deck observé suivant : 109 cartes au total, 108 cartes jouables + 1 carte vierge.[file:42]
- Réaliser un rendu visuel inspiré très fortement du vrai matériel : plateau vert/blanc minimaliste, cartes crème avec illustrations football rétro, accent orange/rouge, dos bleu motif terrain.[file:35][file:36][file:37][file:40][file:41]
- Prévoir un mode pass-and-play local avant toute IA.
- Créer un code propre et modulaire : `deck`, `rules`, `state`, `ui`, `assets mapping`.

## Inventaire du deck

- Tir au but ×10
- Boulet de canon ×3
- Touche ×2
- Coup de chance ×4
- Sortie de but ×2
- Faute ×10
- Corner ×2
- Penalty ×2
- But ×10
- Dégagement ×10
- Interception ×13
- But refusé ×1
- Hors-jeu ×2
- Passe ×12
- Coup franc ×8
- Arrêt ×11
- Carte vierge ×1
- Contre-attaque ×6

## Ce qu'il faut produire

1. Une app jouable mobile-first.
2. Une interface fidèle et soignée.
3. Un moteur de règles robuste et testable.
4. Un écran d'aide / règles résumées.
5. Une structure de code propre pour itérations futures.

## Logique de règles à implémenter

- Coup d'envoi avec `passe`.[file:29][file:42]
- Pioche, pose de 1 à 3 cartes, remise à 8 cartes en main.[file:42]
- Gestion du ballon et des changements de camp selon la page 12.[file:28][file:42]
- Succession stricte des cartes selon les pages 13, 14 et 15.[file:28][file:38][file:39][file:42]
- Gestion spéciale de `but refusé`, jouable hors tour.[file:28][file:42]
- Différence entre `coup franc` indirect, `coup franc direct` et `penalty` dans les séquences.[file:32][file:38][file:42]

## Attendu design

Le design ne doit pas ressembler à un template SaaS moderne. Il doit évoquer un objet édité dans les années 60 : graphisme plat, contraste fort, composition simple, cartes très lisibles, plateau quasi abstrait, typographie sobre, sensation de jeu de table plutôt que d'app de startup.[file:34][file:35][file:36][file:37][file:40][file:41]

## Stratégie de réalisation recommandée

1. Lire le PDF et les images.
2. Écrire un JSON du deck.
3. Écrire une machine à états ou une table de transitions.
4. Créer l'UI mobile.
5. Brancher les règles.
6. Tester plusieurs séquences clés.
7. Affiner le design pour coller au matériel source.

