// ai.js — Joueur artificiel.
//
// L'IA ne connaît que ce qu'un joueur assis à la table connaît : sa propre main,
// la carte exposée, le camp du ballon et le score. Elle n'inspecte ni le talon ni
// les mains adverses.
//
// La politique est délibérément lisible plutôt qu'optimale : on veut un
// adversaire crédible qui respecte l'esprit du jeu (attaquer quand le ballon est
// dans le camp adverse, défendre quand on est menacé, ne pas gâcher les cartes
// rares), et qui serve de banc d'essai au moteur de règles.

import { CARD_DEFS } from './deck.js';
import { getLegalCardIds } from './rules.js';

/** Valeur d'usage de chaque carte, hors contexte. Plus haut = plus précieux. */
const RARITY = {
  but_refuse: 100, // exemplaire unique, ne se défausse jamais
  carte_vierge: 90,
  penalty: 70,
  boulet_de_canon: 65,
  corner: 55,
  touche: 50,
  hors_jeu: 50,
  sortie_de_but: 45,
  coup_de_chance: 40,
  but: 35,
  coup_franc: 25,
  arret: 22,
  faute: 18,
  degagement: 15,
  tir_au_but: 15,
  contre_attaque: 14,
  interception: 10,
  passe: 8,
};

/**
 * Note un coup candidat dans le contexte courant. Le score le plus élevé gagne.
 *
 * @param {string} cardId - carte envisagée (déjà validée comme légale)
 * @param {object} ctx - { state, teamId, hand, exposed, isOwnTurn }
 */
function scorePlay(cardId, ctx) {
  const { hand, exposed, teamId, state } = ctx;
  const counts = tally(hand);
  let score = 0;

  // 1. Marquer prime sur tout le reste.
  if (cardId === 'but') return 1000;

  // 2. Enchaînements gagnants : ne déclencher un tir que si on peut le conclure.
  const canFinish = counts.but > 0;
  const isShot = ['tir_au_but', 'boulet_de_canon', 'penalty'].includes(cardId);
  if (isShot) {
    score += canFinish ? 120 : 35;
    // Le boulet de canon est quasi imparable : on le garde pour un tir décisif.
    if (cardId === 'boulet_de_canon') score += canFinish ? 60 : -25;
    if (cardId === 'penalty') score += canFinish ? 50 : -20;
  }

  // 3. Le coup de chance vaut "tir au but" en attaque, "arrêt" en défense.
  if (cardId === 'coup_de_chance') {
    score += ctx.underThreat ? 90 : (canFinish ? 110 : 20);
  }

  // 4. Défendre : face à un tir, parer est prioritaire (sinon l'adversaire marque).
  //    Le hors-jeu passe avant l'arrêt : il annule l'attaque *et* rend le coup
  //    franc à son équipe avec le ballon, là où l'arrêt ne fait que stopper le tir.
  if (ctx.underThreat) {
    if (cardId === 'hors_jeu') score += 175;
    if (cardId === 'arret') score += 150;
    if (cardId === 'sortie_de_but') score += 110; // le dégagement qui suit rend le ballon
    if (['interception', 'contre_attaque'].includes(cardId)) score += 70;
    if (cardId === 'faute') score += 40;          // sanctionné, mais stoppe l'action
  }

  // 5. Reprendre le ballon quand l'adversaire a l'initiative.
  if (!ctx.isOwnTurn) {
    if (cardId === 'interception') score += 45;
    if (cardId === 'contre_attaque') score += 55;
    if (cardId === 'touche') score += 30;
  }

  // 6. Faire circuler quand rien de mieux ne se présente.
  if (cardId === 'passe') score += 12;
  if (cardId === 'degagement') score += 18;

  // 7. Ne pas dilapider les cartes rares pour un coup anodin.
  score -= (RARITY[cardId] ?? 20) * 0.25;

  // 8. Léger bonus si on possède plusieurs exemplaires : on peut se le permettre.
  score += Math.min(counts[cardId] ?? 0, 4) * 2;

  // 9. Ne pas ouvrir sur une faute quand on mène l'action : c'est se pénaliser.
  if (cardId === 'faute' && ctx.isOwnTurn && !ctx.underThreat) score -= 40;

  return score;
}

function tally(hand) {
  const c = {};
  for (const card of hand) c[card.cardId] = (c[card.cardId] ?? 0) + 1;
  return c;
}

/** L'équipe active est-elle sous la menace d'un tir cadré ? */
function isUnderThreat(state, teamId) {
  const top = state.pileDeJeu[state.pileDeJeu.length - 1];
  if (!top || top.teamId === teamId) return false;
  if (['tir_au_but', 'boulet_de_canon', 'penalty'].includes(top.cardId)) return true;
  if (top.cardId === 'coup_franc' && state.freeKickMode === 'direct') return true;
  if (top.cardId === 'coup_de_chance') return true;
  return false;
}

/**
 * Choisit la carte à poser parmi celles de la main.
 *
 * @param {object} state - état de partie
 * @param {object} player - joueur actif
 * @param {function} isLegal - (cardId) => bool, fourni par la couche état
 * @returns {{card: object, declaredAs: string|null}|null} null = ne rien poser
 */
export function chooseCard(state, player, isLegal) {
  const hand = state.hands[player.id];
  const top = state.pileDeJeu[state.pileDeJeu.length - 1];
  const ctx = {
    state,
    teamId: player.teamId,
    hand,
    exposed: top?.cardId ?? null,
    isOwnTurn: !top || top.teamId === player.teamId,
    underThreat: isUnderThreat(state, player.teamId),
  };

  let best = null;
  for (const card of hand) {
    if (card.cardId === 'carte_vierge') continue; // traité séparément ci-dessous
    if (!isLegal(card.cardId)) continue;
    const s = scorePlay(card.cardId, ctx);
    if (!best || s > best.score) best = { card, declaredAs: null, score: s };
  }

  // La carte vierge sert de joker : on ne la sort que si elle débloque un coup
  // vraiment décisif (marquer, ou parer un tir imparable), jamais pour meubler.
  const joker = hand.find((c) => c.cardId === 'carte_vierge');
  if (joker) {
    const { legalIds } = getLegalCardIds({ ...state, activeTeamId: player.teamId });
    const options = legalIds.filter((id) => id !== 'carte_vierge');
    for (const id of options) {
      const decisive = id === 'but' || (ctx.underThreat && id === 'arret');
      if (!decisive) continue;
      const s = scorePlay(id, ctx) - 5;
      if (!best || s > best.score) best = { card: joker, declaredAs: id, score: s };
    }
  }

  return best ? { card: best.card, declaredAs: best.declaredAs } : null;
}

/**
 * Après avoir posé une carte, l'IA continue-t-elle sa série (jusqu'à trois
 * cartes consécutives) ou rend-elle la main ?
 */
export function shouldContinue(state, player, cardsPlayed) {
  if (cardsPlayed >= 3) return false;
  const top = state.pileDeJeu[state.pileDeJeu.length - 1];
  if (!top) return false;
  // On enchaîne tant qu'on tient l'action et qu'on peut la conclure.
  if (top.teamId !== player.teamId) return false;
  const hand = state.hands[player.id];
  const counts = tally(hand);
  if (['tir_au_but', 'boulet_de_canon', 'penalty'].includes(top.cardId)) {
    return counts.but > 0 || counts.carte_vierge > 0;
  }
  if (top.cardId === 'coup_franc' && state.freeKickMode === 'direct') return counts.but > 0;
  if (top.cardId === 'passe') return counts.tir_au_but > 0 || counts.boulet_de_canon > 0;
  return false;
}

/** L'IA conteste-t-elle un but avec « but refusé » ? Toujours : la carte est unique. */
export function shouldRefuseGoal() {
  return true;
}

/** Carte à défausser quand le joueur ne peut rien poser : la moins précieuse. */
export function chooseDiscard(state, player) {
  const hand = state.hands[player.id];
  if (hand.length === 0) return null;
  const counts = tally(hand);
  return [...hand].sort((a, b) => {
    const ra = (RARITY[a.cardId] ?? 20) - Math.min(counts[a.cardId], 5) * 3;
    const rb = (RARITY[b.cardId] ?? 20) - Math.min(counts[b.cardId], 5) * 3;
    return ra - rb;
  })[0];
}

export function describeCard(cardId) {
  return CARD_DEFS[cardId]?.name ?? cardId;
}
