// match.js — Déroulement d'un tour, indépendant de l'affichage.
//
// Le tour d'un joueur artificiel est exposé sous forme de générateur : l'UI
// l'itère pas à pas avec un délai pour qu'on voie jouer l'ordinateur, tandis que
// la simulation headless (test/simulation.mjs) l'épuise d'un coup. Les deux
// suivent donc exactement le même chemin de code.

import {
  activePlayer, drawForTurn, playCard, confirmGoal, endTurn, discardExcess,
  butRefuseHolders, playButRefuseOutOfTurn, isLegalForActivePlayer,
} from './state.js';
import { chooseCard, shouldContinue, shouldRefuseGoal, chooseDiscard } from './ai.js';

/**
 * Joue le tour complet du joueur artificiel actif.
 * Émet une suite d'étapes : { type, ... }.
 *
 * type = 'draw' | 'play' | 'goal-window' | 'goal-confirmed' | 'goal-cancelled'
 *      | 'discard' | 'pass' | 'end-turn'
 */
export function* aiTurn(state) {
  const player = activePlayer(state);
  if (!player?.isAI) return;

  if (state.turnPhase === 'draw') {
    drawForTurn(state);
    yield { type: 'draw', playerId: player.id };
  }

  let played = 0;
  while (played < 3) {
    const choice = chooseCard(state, player, (cardId) => isLegalForActivePlayer(state, cardId));
    if (!choice) break;

    playCard(state, choice.card.uid, choice.declaredAs);
    played += 1;
    yield {
      type: 'play',
      playerId: player.id,
      cardId: choice.declaredAs || choice.card.cardId,
      joker: !!choice.declaredAs,
    };

    // Un but ouvre la fenêtre « but refusé » : elle doit être résolue avant
    // toute autre chose, y compris la suite du tour.
    if (state.pendingGoal) {
      yield* resolveGoalWindow(state);
      break;
    }

    if (!shouldContinue(state, player, played)) break;
  }

  // Aucun coup possible : le joueur dépose une carte sur la pile de défausse et
  // passe la main (page 10). C'est ce qui fait avancer la partie vers sa fin une
  // fois le talon épuisé : sans cela, plus rien ne bougerait.
  if (played === 0) {
    const card = chooseDiscard(state, player);
    if (card) {
      discardExcess(state, card.uid);
      yield { type: 'discard', playerId: player.id, cardId: card.cardId };
    }
    yield { type: 'pass', playerId: player.id };
  }

  endTurn(state);
  yield { type: 'end-turn', playerId: player.id };
}

/**
 * Résout la fenêtre « but refusé » : les détenteurs adverses décident, dans
 * l'ordre d'assise. Un humain qui détient la carte interrompt la résolution
 * automatique — c'est à lui de trancher via l'interface.
 */
export function* resolveGoalWindow(state) {
  const holders = butRefuseHolders(state);
  const humanHolder = holders.find((h) => !h.isAI);
  if (humanHolder) {
    yield { type: 'goal-window', holders, awaitingHuman: true };
    return;
  }

  const refuser = holders.find(() => shouldRefuseGoal());
  if (refuser) {
    const card = state.hands[refuser.id].find((c) => c.cardId === 'but_refuse')
      || state.hands[refuser.id].find((c) => c.cardId === 'carte_vierge');
    playButRefuseOutOfTurn(state, refuser.id, card.uid);
    yield { type: 'goal-cancelled', playerId: refuser.id };
    return;
  }

  const scorer = state.pendingGoal.teamId;
  confirmGoal(state);
  yield { type: 'goal-confirmed', teamId: scorer };
}

/**
 * Enchaîne les tours des joueurs artificiels jusqu'à ce qu'un humain doive
 * intervenir, que la partie s'achève, ou que la limite de tours soit atteinte.
 * Renvoie le nombre de tours joués.
 */
export function runAITurns(state, { maxTurns = 2000, onStep = null } = {}) {
  let turns = 0;
  while (turns < maxTurns) {
    if (state.turnPhase === 'over') break;
    const player = activePlayer(state);
    if (!player?.isAI) break;
    if (state.pendingGoal) break; // un humain doit trancher la fenêtre but refusé

    for (const step of aiTurn(state)) {
      onStep?.(step);
      if (step.awaitingHuman) return turns;
    }
    turns += 1;
  }
  return turns;
}
