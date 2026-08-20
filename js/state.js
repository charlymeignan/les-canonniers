// state.js — État de partie et transitions (reducers) pour "Les Canonniers".
// Ne contient aucune logique DOM : uniquement des structures de données et des
// fonctions pures/quasi-pures qui mutent l'état de jeu de façon contrôlée.

import { buildFullDeck, shuffle, CARD_DEFS } from './deck.js';
import { getLegalCardIds, isLegalPlay, resolvePlay, threatensGoal } from './rules.js';

export const TEAM_VERT = 'vert';
export const TEAM_BLANC = 'blanc';

/**
 * Crée une nouvelle partie.
 * @param {Array<string|{name: string, isAI: boolean}>} seats - 2 ou 4 joueurs, dans
 *   l'ordre d'assise autour de la table. En mode 4 joueurs, les équipes alternent :
 *   [vert, blanc, vert, blanc]. Chaque siège peut être humain ou tenu par
 *   l'ordinateur.
 * @param {function} rng - générateur pseudo-aléatoire injectable (tests).
 */
export function createGame(seats, rng = Math.random) {
  const playerNames = seats.map((s) => (typeof s === 'string' ? s : s.name));
  const mode = playerNames.length === 4 ? '4p' : '2p';
  const players = playerNames.map((name, i) => ({
    id: `p${i}`,
    name,
    isAI: typeof seats[i] === 'object' ? !!seats[i].isAI : false,
    teamId: mode === '4p' ? (i % 2 === 0 ? TEAM_VERT : TEAM_BLANC) : (i === 0 ? TEAM_VERT : TEAM_BLANC),
  }));

  const deck = shuffle(buildFullDeck(), rng);
  const hands = {};
  for (const p of players) hands[p.id] = [];

  // Distribution : 8 cartes chacun, une à la fois, en commençant par la gauche du
  // donneur (page 8). On simplifie ici en distribuant en rotation sur tous les joueurs.
  let cursor = 0;
  for (let round = 0; round < 8; round++) {
    for (const p of players) {
      hands[p.id].push(deck[cursor++]);
    }
  }
  const talon = deck.slice(cursor);

  return {
    mode,
    players,
    teams: {
      [TEAM_VERT]: { id: TEAM_VERT, name: 'Vert', score: 0 },
      [TEAM_BLANC]: { id: TEAM_BLANC, name: 'Blanc', score: 0 },
    },
    hands,
    talon,
    defausse: [],
    pileDeJeu: [],
    ballCamp: 'centre',
    currentPlayerIndex: null, // fixé par resolveKickoff()
    freeKickMode: null,
    consecutiveFautes: 0,
    pendingGoal: null,
    consecutivePasses: 0,
    turnCardsPlayed: 0,
    turnMustEnd: false,
    turnPhase: 'kickoff', // 'kickoff' | 'draw' | 'play' | 'refill' | 'but-refuse-window' | 'over'
    history: [],
    kickoffCandidates: null,
    winner: null,
  };
}

export function activePlayer(state) {
  return state.players[state.currentPlayerIndex];
}

export function playerTeam(state, playerId) {
  return state.players.find((p) => p.id === playerId)?.teamId;
}

export function otherTeam(teamId) {
  return teamId === TEAM_VERT ? TEAM_BLANC : TEAM_VERT;
}

export function playersOfTeam(state, teamId) {
  return state.players.filter((p) => p.teamId === teamId);
}

/** Pendant la fenêtre but-refuse-window : qui, côté adverse, peut jouer but_refuse ? */
export function butRefuseHolders(state) {
  if (!state.pendingGoal) return [];
  const rival = otherTeam(state.pendingGoal.teamId);
  return playersOfTeam(state, rival).filter((p) =>
    state.hands[p.id].some((c) => c.cardId === 'but_refuse')
  );
}

/** Joue but_refuse hors tour, pour un joueur donné (pas nécessairement le joueur actif). */
export function playButRefuseOutOfTurn(state, playerId, cardUid) {
  if (!state.pendingGoal) throw new Error('Aucun but en attente');
  const hand = state.hands[playerId];
  const idx = hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) throw new Error('Carte absente de la main');
  const card = hand[idx];
  if (card.cardId !== 'but_refuse') {
    throw new Error('Seule but_refuse peut être jouée hors tour ici');
  }
  hand.splice(idx, 1);
  const teamId = playerTeam(state, playerId);
  state.pileDeJeu.push({ uid: card.uid, cardId: 'but_refuse', teamId, playerId });
  logEvent(state, { type: 'play', cardId: 'but_refuse', teamId, playerId });

  const scorerId = state.pendingGoal.playerId;
  resolveButRefuse(state);

  // Page 12 : « L'auteur du but refusé prend deux cartes au talon — l'une pour
  // remplacer la carte but refusé, l'autre comme d'habitude avant de jouer — et
  // joue immédiatement un nouveau coup d'envoi. »
  for (let i = 0; i < 2 && state.talon.length > 0; i++) hand.push(state.talon.pop());

  // « Ce dernier complète alors à huit ses cartes en main et perd le bénéfice
  // du but et de la remise en jeu. »
  const scorerHand = state.hands[scorerId];
  while (scorerHand.length < 8 && state.talon.length > 0) scorerHand.push(state.talon.pop());

  state.ballCamp = 'centre';
  state.currentPlayerIndex = state.players.findIndex((pl) => pl.id === playerId);
  state.turnCardsPlayed = 0;
  state.turnMustEnd = false;
  state.turnPhase = 'play';
}

/** Lance les dés (page 10) : le score le plus haut obtient le coup d'envoi. */
export function rollDiceForKickoff(state, rng = Math.random) {
  const rolls = state.players.map((p) => ({ playerId: p.id, roll: 1 + Math.floor(rng() * 6) }));
  const max = Math.max(...rolls.map((r) => r.roll));
  const winners = rolls.filter((r) => r.roll === max);
  state.kickoffCandidates = { rolls, tie: winners.length > 1 };
  if (winners.length === 1) {
    state.currentPlayerIndex = state.players.findIndex((p) => p.id === winners[0].playerId);
    state.turnPhase = 'draw';
    logEvent(state, { type: 'kickoff', rolls });
  }
  return state.kickoffCandidates;
}

function logEvent(state, entry) {
  state.history.push({ ...entry, ts: state.history.length });
}

function nextSeatIndex(state, fromIndex) {
  return (fromIndex + 1) % state.players.length;
}

/** Étape "pioche" du tour : le joueur actif tire une carte du talon. */
export function drawForTurn(state) {
  const p = activePlayer(state);
  if (state.talon.length > 0) {
    state.hands[p.id].push(state.talon.pop());
    logEvent(state, { type: 'draw', playerId: p.id });
  }
  state.turnPhase = 'play';
  state.turnCardsPlayed = 0;
  state.turnMustEnd = false;
}

/** Cartes jouables par le joueur actif dans son état actuel (main filtrée). */
export function legalHandCards(state) {
  const p = activePlayer(state);
  if (!p) return [];
  const hand = state.hands[p.id];
  const seen = new Set();
  const result = [];
  for (const card of hand) {
    if (seen.has(card.uid)) continue;
    if (isLegalForActivePlayer(state, card.cardId)) {
      result.push(card);
      seen.add(card.uid);
    }
  }
  return result;
}

export function isLegalForActivePlayer(state, cardId) {
  const p = activePlayer(state);
  const check = { ...state, activeTeamId: p.teamId };
  return isLegalPlay(check, cardId);
}

/** Joue une carte de la main du joueur actif. Retourne les effets appliqués. */
export function playCard(state, cardUid) {
  const p = activePlayer(state);
  const hand = state.hands[p.id];
  const idx = hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) throw new Error('Carte absente de la main');
  const card = hand[idx];
  const effectiveId = card.cardId;

  if (!isLegalForActivePlayer(state, card.cardId)) {
    throw new Error(`Coup illégal : ${card.cardId}`);
  }

  hand.splice(idx, 1);
  const teamId = p.teamId;
  const effects = resolvePlay({ ...state, activeTeamId: teamId }, effectiveId, teamId);

  state.pileDeJeu.push({ uid: card.uid, cardId: effectiveId, teamId, playerId: p.id });
  logEvent(state, { type: 'play', cardId: effectiveId, teamId, playerId: p.id });

  // Comptage des fautes consécutives (même équipe fautive).
  if (effectiveId === 'faute') {
    const prevCard = state.pileDeJeu[state.pileDeJeu.length - 2];
    const wasConsecutive = prevCard && prevCard.cardId === 'faute' && prevCard.teamId === teamId;
    state.consecutiveFautes = wasConsecutive ? state.consecutiveFautes + 1 : 1;
    state.freeKickMode = state.consecutiveFautes >= 2 ? 'direct' : 'indirect';
  } else if (effectiveId === 'hors_jeu') {
    state.freeKickMode = 'indirect';
    state.consecutiveFautes = 0;
  } else if (effectiveId === 'coup_franc') {
    // Le mode du coup franc est fixé par la sanction qui l'a provoqué et doit
    // survivre à sa pose : c'est lui qui décide si le botteur peut marquer
    // directement. Le réinitialiser ici transformerait tout coup franc direct
    // en coup franc indirect au coup suivant.
    state.consecutiveFautes = 0;
  } else if (effectiveId !== 'faute') {
    state.freeKickMode = null;
    state.consecutiveFautes = 0;
  }

  if (effects.changesCamp) {
    state.ballCamp = teamId === TEAM_VERT ? TEAM_BLANC : TEAM_VERT;
  }
  if (effects.resetCenter) {
    state.ballCamp = 'centre';
  }

  if (effectiveId === 'but') {
    state.pendingGoal = { teamId, playerId: p.id, scoringPileTop: card.uid };
    state.turnPhase = 'but-refuse-window';
  }
  if (effects.scored) {
    // La confirmation réelle du score se fait via confirmGoal() après la fenêtre.
  }
  if (effectiveId === 'but_refuse') {
    resolveButRefuse(state);
  }

  state.turnCardsPlayed += 1;

  // Page 10 : entre le tir et le but, « l'adversaire doit jouer entre temps ».
  // Une carte qui menace le but rend donc la main, pour que la défense ait sa
  // fenêtre. Sans cela le tireur enchaînerait tir + but dans le même tour et
  // aucune parade ne serait jamais jouable.
  if (threatensGoal(effectiveId, state.freeKickMode)) {
    state.turnMustEnd = true;
  }

  return effects;
}

/**
 * Le joueur actif doit-il se défausser avant de pouvoir rendre la main ?
 *
 * Après la pioche la main compte neuf cartes. Si le tour se termine sans qu'une
 * seule carte ait été posée, il faut en déposer une sur la pile de défausse
 * pour revenir à huit (page 9).
 */
export function mustDiscard(state) {
  const p = activePlayer(state);
  return !!p && state.hands[p.id].length > 8;
}

/** À appeler quand la fenêtre "but refusé" est passée sans riposte : le but est validé. */
export function confirmGoal(state) {
  if (!state.pendingGoal) return;
  const { teamId, playerId } = state.pendingGoal;
  state.teams[teamId].score += 1;
  logEvent(state, { type: 'goal-confirmed', teamId, playerId });

  // Le joueur ramasse la pile de jeu, la pose devant lui (défausse), pioche une
  // carte au talon, complète sa main à 8, et rejoue immédiatement (page 11).
  state.defausse.push(...state.pileDeJeu);
  state.pileDeJeu = [];
  if (state.talon.length > 0) state.hands[playerId].push(state.talon.pop());
  state.ballCamp = 'centre';
  state.pendingGoal = null;
  state.turnPhase = 'play';
  state.turnCardsPlayed = 0;
  state.turnMustEnd = false;
  state.currentPlayerIndex = state.players.findIndex((pl) => pl.id === playerId);
  checkVictory(state);
}

function resolveButRefuse(state) {
  // La carte but_refuse vient d'être posée par-dessus le "but" : le but est annulé.
  logEvent(state, { type: 'goal-cancelled' });
  state.pendingGoal = null;
  state.turnPhase = 'play';
}

function checkVictory(state) {
  const TARGET = state.scoreTarget || null;
  if (TARGET && (state.teams.vert.score >= TARGET || state.teams.blanc.score >= TARGET)) {
    state.winner = state.teams.vert.score >= TARGET ? TEAM_VERT : TEAM_BLANC;
    state.turnPhase = 'over';
  }
}

/** Complète/ramène la main du joueur actif à 8 cartes (pioche ou défausse). */
export function refillHand(state) {
  const p = activePlayer(state);
  const hand = state.hands[p.id];
  while (hand.length < 8 && state.talon.length > 0) {
    hand.push(state.talon.pop());
  }
  state.turnPhase = 'refill-discard';
}

/** Si la main dépasse 8 après un tour sans (ou peu de) cartes jouées, on défausse. */
export function discardExcess(state, cardUid) {
  const p = activePlayer(state);
  const hand = state.hands[p.id];
  const idx = hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) return;
  state.defausse.push(hand.splice(idx, 1)[0]);
}

/**
 * Clôt le tour du joueur actif. Renvoie false — sans rien changer — si une
 * défausse est due : c'est à l'appelant de la demander, puis de rappeler.
 */
export function endTurn(state) {
  const p = activePlayer(state);
  const hand = state.hands[p.id];
  if (hand.length > 8) return false;

  // Un tour sans aucune carte posée est un "passe". Si tout le monde passe à la
  // suite, la situation est bloquée : personne ne peut enchaîner sur la carte
  // exposée. Le livret ne décrit ce cas que pour le coup d'envoi (page 10, on
  // défausse jusqu'à ce qu'un joueur puisse jouer "passe") ; on étend la même
  // logique à toute la partie en remisant la pile et en relançant un coup
  // d'envoi, plutôt que de laisser la partie s'arrêter. Choix assumé, documenté
  // dans docs/regles-implementees.md.
  if (state.turnCardsPlayed === 0) {
    state.consecutivePasses += 1;
    if (state.consecutivePasses >= state.players.length && state.pileDeJeu.length > 0) {
      state.defausse.push(...state.pileDeJeu);
      state.pileDeJeu = [];
      state.ballCamp = 'centre';
      state.freeKickMode = null;
      state.consecutiveFautes = 0;
      state.consecutivePasses = 0;
      logEvent(state, { type: 'deadlock-reset' });
    }
  } else {
    state.consecutivePasses = 0;
  }

  while (hand.length < 8 && state.talon.length > 0) hand.push(state.talon.pop());
  state.currentPlayerIndex = nextSeatIndex(state, state.currentPlayerIndex);
  state.turnPhase = 'draw';
  state.turnCardsPlayed = 0;
  state.turnMustEnd = false;
  checkExhaustion(state);
  return true;
}

/**
 * Fin de partie : « le jeu continue jusqu'à épuisement des cartes en main »
 * (page 11). Quand le talon est vide et qu'aucun joueur n'a plus de carte,
 * l'équipe qui a marqué le plus de buts l'emporte.
 */
function checkExhaustion(state) {
  if (state.talon.length > 0) return;
  const anyCards = state.players.some((p) => state.hands[p.id].length > 0);
  if (anyCards) return;
  state.turnPhase = 'over';
  const { vert, blanc } = state.teams;
  state.winner = vert.score === blanc.score ? 'nul' : (vert.score > blanc.score ? TEAM_VERT : TEAM_BLANC);
  logEvent(state, { type: 'match-over', winner: state.winner });
}

export function currentLegalInfo(state) {
  const p = activePlayer(state);
  return getLegalCardIds({ ...state, activeTeamId: p?.teamId });
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(json) {
  return JSON.parse(json);
}
