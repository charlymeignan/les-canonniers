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
- **Lire une carte.** Le texte imprimé sur le carton d'origine est minuscule : le
  bouton **Lire** — ou une pression sur une carte injouable, ou sur la carte
  exposée — ouvre sa fiche, avec ses deux listes de succession au corps du texte
  courant.

L'écran **Règles** contient un aide-mémoire, la table de succession complète et
la galerie des 108 cartes avec leurs quantités.

### Installer l'application

Le jeu est une PWA : « Ajouter à l'écran d'accueil » sur iOS, « Installer »
sur Android et sur Chrome de bureau. Il s'ouvre alors en plein écran, sans barre
d'adresse, et **fonctionne sans réseau** — un service worker garde en cache la
page, les styles, les modules et les illustrations. Rien n'est envoyé nulle part :
il n'y a pas de serveur.

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
sw.js                 service worker : installation et jeu hors ligne
manifest.webmanifest  déclaration d'application installable
assets/cards/         illustrations optionnelles, qui remplacent les dessins SVG
assets/icons/         icônes d'application, dessinées par tools/build-icons.py
tools/scan-cards.mjs  recense ces illustrations et écrit leur manifeste
```

Les couches ne se mélangent pas : `rules.js` ne connaît que des identifiants de
cartes, `state.js` ne touche jamais au DOM, `ui.js` ne contient aucune règle. La
même fonction `aiTurn()` de `match.js` alimente l'affichage pas-à-pas dans le
navigateur et les simulations headless.

## Tests

```sh
node test/rules.test.mjs        # 50 tests, chacun citant sa cellule du livret
node test/simulation.mjs 300    # 300 parties ordinateur contre ordinateur
node test/ui.test.mjs           # parcours navigateur (serveur requis)
node test/humain-vs-ia.test.mjs # partie complète pilotée depuis l'interface (serveur requis)
SEATS=human,human node test/humain-vs-ia.test.mjs   # la même en pass-and-play
node test/pwa.test.mjs          # installable et jouable hors ligne (serveur requis)
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

### Remplacer une illustration

Les dessins SVG ne sont qu'un repli. Déposer un fichier nommé d'après la carte
dans `assets/cards/` (par exemple `boulet_de_canon.webp`), lancer
`npm run cards:scan`, et l'image remplace le dessin — carte par carte, sans
jamais casser le reste. Le format attendu est dans
[`docs/illustrations.md`](docs/illustrations.md).

Pour générer ces illustrations, `npm run kit` produit un dossier de briefing
**PDF** — le seul format qu'un modèle d'image lit d'un seul tenant, sans
décompression — et une archive ZIP des références individuelles. Le contenu et
la méthode sont décrits dans
[`docs/kit-illustrations/`](docs/kit-illustrations/README.md).

## Mise en ligne

Le jeu est un site statique : aucune compilation, aucun serveur applicatif.

`tools/build-site.sh` assemble dans `_site/` ce que le navigateur charge
réellement — `index.html`, `css/`, `js/`, `assets/`, le manifeste et le service
worker — et rien d'autre. Ce
détour n'est pas cosmétique : les hébergeurs statiques publient par défaut la
racine du dépôt, ce qui exposerait `assets/user-files/`, c'est-à-dire le scan du
livret et les photos du matériel. Ce dossier reste documentation de travail et
n'est jamais mis en ligne.

**Netlify ou Cloudflare Pages** — gratuits, y compris sur un dépôt privé. C'est
l'option la plus simple ici. `netlify.toml` est déjà configuré ; sur Cloudflare
Pages, renseigner à la main : commande de build `bash tools/build-site.sh`,
répertoire de sortie `_site`.

**GitHub Pages** — `.github/workflows/pages.yml` lance les tests du moteur puis
déploie. À activer dans *Settings → Pages → Source : GitHub Actions*. Gratuit
sur un dépôt public seulement ; sur un dépôt privé il faut un compte payant.

Les chemins du projet sont tous relatifs, service worker compris : le site
fonctionne aussi bien à la racine d'un domaine que dans un sous-répertoire, et
l'installation en application suit le même chemin.

Le service worker sert la coquille **réseau d'abord** : une mise en ligne est
reprise dès le premier chargement en ligne, sans que personne ait à vider son
cache. Seules les illustrations et les polices, qui ne changent pas, sont servies
depuis le cache en priorité. `VERSION` en tête de `sw.js` force au besoin la mise
à jour d'un appareil déjà équipé.

## Les règles font foi

[`docs/regles-reference.md`](docs/regles-reference.md) est la **transcription
verbatim du livret**, page par page, faite depuis le scan en 1150 × 1638. C'est
la source unique : `js/rules.js` en est la traduction en code, et chacun des 46
tests cite la cellule qu'il vérifie. Si un test échoue, c'est le moteur qui a
tort.

Le tableau des pages 13 à 16 croise **deux** critères — la carte exposée (et qui
l'a posée) *et* la position du ballon — et le moteur reproduit les deux axes.

[`docs/regles-implementees.md`](docs/regles-implementees.md) recense les cinq
points où le passage du livret au code a demandé une décision — pour l'essentiel
des endroits où le texte se contredit lui-même. Aucun n'ajoute de règle : rien
dans le moteur ne vient d'ailleurs que du livret.

## Sources

Ce projet a été reconstruit à partir d'un exemplaire physique : le scan du
livret de règles et des photos de la boîte, du plateau et des cartes.

**Ces documents ne sont pas versionnés.** Le livret et les cartes sont l'œuvre
des Éditions Edmond Dujardin ; cette reconstruction personnelle n'a pas à en
rediffuser le contenu. Le dossier `assets/user-files/` est donc vide dans le
dépôt — son `README.md` explique quoi y déposer pour régénérer le kit
d'illustrations en local.

`docs/` conserve en revanche le travail dérivé : transcription des règles,
inventaire du matériel, table de succession implémentée et briefs
d'illustration.
