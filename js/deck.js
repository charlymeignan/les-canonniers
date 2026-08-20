// deck.js — Définition du deck "Les Canonniers" (109 cartes : 108 jouables + 1 vierge)
// Quantités et intitulés d'après docs/inventaire-materiel.md (exemplaire observé).
// Les propriétés visuelles (monogram, badgeColor, icon) servent à js/assets-mapping.js
// pour dessiner les cartes en s'inspirant fidèlement des photos du matériel réel.

export const CARD_DEFS = {
  passe: {
    id: 'passe', name: 'Passe', qty: 12,
    monogram: null, icon: 'ballon-carre', badgeColor: 'ink',
    illus: 'passe',
  },
  contre_attaque: {
    id: 'contre_attaque', name: 'Contre-attaque', qty: 6,
    monogram: null, icon: 'arrows-vertical', badgeColor: 'gold',
    illus: 'ballon-fleches',
  },
  arret: {
    id: 'arret', name: 'Arrêt', qty: 11,
    monogram: 'A', icon: null, badgeColor: 'green',
    illus: 'arret',
  },
  coup_franc: {
    id: 'coup_franc', name: 'Coup franc', qty: 8,
    monogram: 'CF', icon: null, badgeColor: 'green',
    illus: 'coup-franc',
  },
  hors_jeu: {
    id: 'hors_jeu', name: 'Hors-jeu', qty: 2,
    monogram: 'HJ', icon: null, badgeColor: 'red',
    illus: 'hors-jeu',
    subtitle: 'Coup franc indirect',
  },
  sortie_de_but: {
    id: 'sortie_de_but', name: 'Sortie de but', qty: 2,
    monogram: null, icon: 'cage', badgeColor: 'red',
    illus: 'sortie-de-but',
    subtitle: 'Dégagement',
  },
  but_refuse: {
    id: 'but_refuse', name: 'But refusé', qty: 1,
    monogram: null, icon: 'cage-croix', badgeColor: 'red',
    illus: 'but-refuse',
    subtitle: 'Passe',
  },
  interception: {
    id: 'interception', name: 'Interception', qty: 13,
    monogram: 'I', icon: null, badgeColor: 'gold',
    illus: 'interception',
  },
  tir_au_but: {
    id: 'tir_au_but', name: 'Tir au but', qty: 10,
    monogram: null, icon: 'cible', badgeColor: 'green',
    illus: 'tir-au-but',
  },
  boulet_de_canon: {
    id: 'boulet_de_canon', name: 'Boulet de canon', qty: 3,
    monogram: 'B', icon: null, badgeColor: 'gold',
    illus: 'boulet-de-canon',
  },
  touche: {
    id: 'touche', name: 'Touche', qty: 2,
    monogram: null, icon: 'fanion', badgeColor: 'red',
    illus: 'touche',
  },
  coup_de_chance: {
    id: 'coup_de_chance', name: 'Coup de chance', qty: 4,
    monogram: null, icon: 'trefle', badgeColor: 'green',
    illus: 'coup-de-chance',
  },
  faute: {
    id: 'faute', name: 'Faute', qty: 10,
    monogram: 'F', icon: null, badgeColor: 'red',
    illus: 'faute',
  },
  corner: {
    id: 'corner', name: 'Corner', qty: 2,
    monogram: '2', icon: null, badgeColor: 'green',
    illus: 'corner',
  },
  penalty: {
    id: 'penalty', name: 'Penalty', qty: 2,
    monogram: 'P', icon: null, badgeColor: 'green',
    illus: 'penalty',
  },
  but: {
    id: 'but', name: 'But', qty: 10,
    monogram: 'BUT', icon: null, badgeColor: 'ink',
    illus: 'but',
  },
  degagement: {
    id: 'degagement', name: 'Dégagement', qty: 10,
    monogram: 'D', icon: null, badgeColor: 'green',
    illus: 'degagement',
  },
  carte_vierge: {
    id: 'carte_vierge', name: 'Carte vierge', qty: 1,
    monogram: '?', icon: null, badgeColor: 'ink',
    illus: null,
    subtitle: 'Joker — remplace la carte de votre choix',
    isJoker: true,
  },
};

export const CARD_ORDER = [
  'passe', 'contre_attaque', 'interception', 'degagement', 'touche',
  'tir_au_but', 'boulet_de_canon', 'coup_de_chance', 'but', 'but_refuse',
  'arret', 'sortie_de_but', 'hors_jeu', 'faute', 'coup_franc', 'corner',
  'penalty', 'carte_vierge',
];

export function totalCardCount() {
  return CARD_ORDER.reduce((sum, id) => sum + CARD_DEFS[id].qty, 0);
}

/** Construit les 109 cartes physiques (instances uniques) sous forme de tableau. */
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
