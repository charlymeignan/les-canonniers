// deck.js — Définition du deck jouable de "Les Canonniers" : 108 cartes.
// Quantités et intitulés d'après docs/inventaire-materiel.md (exemplaire observé).
//
// Les champs visuels décrivent la mise en page relevée sur les photos macro des
// cartes réelles. Cinq traitements d'en-tête coexistent sur le matériel :
//
//   'solid' : lettrine dans un carré de couleur plein   → D égagement, I nterception
//   'frame' : le mot entier cerné d'un filet de couleur → A rrêt, F aute
//   'stack' : deux lettres empilées, sans cadre         → C/F oup franc
//   'icon'  : pictogramme à la place de la lettrine     → passe, tir au but, touche…
//   'band'  : bandeau de couleur pleine largeur         → contre-attaque
//
// `head` porte la lettrine (ou le pictogramme), `rest` la suite du mot : sur la
// carte, la lettrine EST la première lettre de l'intitulé, elle ne se répète pas.
//
// La boîte documentée contenait une 109ᵉ carte vierge. Le livret ne lui donne
// aucune fonction : c'est une carte de remplacement, pas une carte de jeu. Elle
// n'est donc pas distribuée — le deck jouable compte 108 cartes.

export const CARD_DEFS = {
  passe: {
    id: 'passe', name: 'Passe', qty: 12,
    badge: 'icon', icon: 'ballon-carre', head: null, rest: 'Passe',
    illus: 'passe',
  },
  contre_attaque: {
    id: 'contre_attaque', name: 'Contre-attaque', qty: 6,
    badge: 'band', color: 'gold', head: null, rest: 'contre-attaque',
    illus: 'ballon-fleches',
  },
  interception: {
    id: 'interception', name: 'Interception', qty: 13,
    badge: 'solid', color: 'gold', head: 'I', rest: 'nterception',
    illus: 'interception',
  },
  degagement: {
    id: 'degagement', name: 'Dégagement', qty: 10,
    badge: 'solid', color: 'green', head: 'D', rest: 'égagement',
    illus: 'degagement',
  },
  touche: {
    id: 'touche', name: 'Touche', qty: 2,
    badge: 'icon', icon: 'fanion', head: null, rest: 'touche',
    illus: 'touche',
  },
  tir_au_but: {
    id: 'tir_au_but', name: 'Tir au but', qty: 10,
    badge: 'icon', icon: 'cible', head: null, rest: 'tir au but',
    illus: 'tir-au-but',
  },
  boulet_de_canon: {
    id: 'boulet_de_canon', name: 'Boulet de canon', qty: 3,
    badge: 'solid', color: 'gold', head: 'B', rest: 'oulet de canon',
    illus: 'boulet-de-canon',
  },
  coup_de_chance: {
    id: 'coup_de_chance', name: 'Coup de chance', qty: 4,
    badge: 'icon', icon: 'trefle', head: null, rest: 'coup de chance',
    illus: 'coup-de-chance',
  },
  but: {
    id: 'but', name: 'But', qty: 10,
    // Le seul intitulé en capitales du jeu, dans un cartouche noir aux lettres or.
    badge: 'solid', color: 'ink', head: 'BUT', rest: '',
    illus: 'but',
  },
  but_refuse: {
    id: 'but_refuse', name: 'But refusé', qty: 1,
    badge: 'icon', icon: 'cage-croix', head: null, rest: 'but refusé',
    illus: 'but-refuse',
    subtitle: 'Passe',
  },
  arret: {
    id: 'arret', name: 'Arrêt', qty: 11,
    badge: 'frame', color: 'green', head: 'A', rest: 'rrêt',
    illus: 'arret',
  },
  sortie_de_but: {
    id: 'sortie_de_but', name: 'Sortie de but', qty: 2,
    badge: 'icon', icon: 'cage', head: null, rest: 'sortie de but',
    illus: 'sortie-de-but',
    subtitle: 'Dégagement',
  },
  hors_jeu: {
    id: 'hors_jeu', name: 'Hors-jeu', qty: 2,
    badge: 'solid', color: 'red', head: 'HJ', rest: 'hors jeu',
    illus: 'hors-jeu',
    subtitle: 'Coup franc indirect',
  },
  faute: {
    id: 'faute', name: 'Faute', qty: 10,
    badge: 'frame', color: 'red', head: 'F', rest: 'aute',
    illus: 'faute',
  },
  coup_franc: {
    id: 'coup_franc', name: 'Coup franc', qty: 8,
    badge: 'stack', color: 'green', head: 'CF', rest: 'oup franc',
    illus: 'coup-franc',
  },
  corner: {
    id: 'corner', name: 'Corner', qty: 2,
    badge: 'icon', icon: 'coin', head: null, rest: 'corner',
    illus: 'corner',
  },
  penalty: {
    id: 'penalty', name: 'Penalty', qty: 2,
    badge: 'solid', color: 'green', head: 'P', rest: 'enalty',
    illus: 'penalty',
  },
};

export const CARD_ORDER = [
  'passe', 'contre_attaque', 'interception', 'degagement', 'touche',
  'tir_au_but', 'boulet_de_canon', 'coup_de_chance', 'but', 'but_refuse',
  'arret', 'sortie_de_but', 'hors_jeu', 'faute', 'coup_franc', 'corner',
  'penalty',
];

export function totalCardCount() {
  return CARD_ORDER.reduce((sum, id) => sum + CARD_DEFS[id].qty, 0);
}

/** Construit les 108 cartes jouables (instances uniques) sous forme de tableau. */
export function buildFullDeck() {
  const deck = [];
  let uid = 0;
  for (const id of CARD_ORDER) {
    const def = CARD_DEFS[id];
    for (let i = 0; i < def.qty; i++) {
      deck.push({ uid: `c${uid++}`, cardId: id });
    }
  }
  return deck;
}

/** Mélange en place (Fisher-Yates) — rng() doit renvoyer un flottant [0,1). */
export function shuffle(array, rng = Math.random) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
