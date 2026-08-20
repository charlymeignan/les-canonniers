// test/rules.test.mjs — Tests du moteur de règles (aucune dépendance, Node natif).
// Lancer avec : node test/rules.test.mjs
import assert from 'node:assert/strict';
import { totalCardCount, buildFullDeck, CARD_DEFS, CARD_ORDER } from '../js/deck.js';
import { getLegalCardIds, isLegalPlay, resolvePlay, SUCCESSION } from '../js/rules.js';
import {
  createGame, activePlayer, playCard, drawForTurn, confirmGoal, endTurn,
  butRefuseHolders, playButRefuseOutOfTurn, legalHandCards, TEAM_VERT, TEAM_BLANC,
} from '../js/state.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`FAIL - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// Générateur pseudo-aléatoire déterministe pour des tests reproductibles.
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

console.log('Deck');
test('109 cartes au total (108 jouables + 1 vierge)', () => {
  assert.equal(totalCardCount(), 109);
  const jouables = CARD_ORDER.filter((id) => id !== 'carte_vierge')
    .reduce((sum, id) => sum + CARD_DEFS[id].qty, 0);
  assert.equal(jouables, 108);
});
test('quantités individuelles conformes à l’inventaire', () => {
  const expected = {
    tir_au_but: 10, boulet_de_canon: 3, touche: 2, coup_de_chance: 4, sortie_de_but: 2,
    faute: 10, corner: 2, penalty: 2, but: 10, degagement: 10, interception: 13,
    but_refuse: 1, hors_jeu: 2, passe: 12, coup_franc: 8, arret: 11, carte_vierge: 1,
    contre_attaque: 6,
  };
  for (const [id, qty] of Object.entries(expected)) {
    assert.equal(CARD_DEFS[id].qty, qty, `quantité ${id}`);
  }
});
test('buildFullDeck() produit 109 cartes uniques (uid)', () => {
  const deck = buildFullDeck();
  assert.equal(deck.length, 109);
  assert.equal(new Set(deck.map((c) => c.uid)).size, 109);
});

console.log('\nSuccession — coup d’envoi');
test('aucune carte posée : seule "passe" est légale', () => {
  const state = { pileDeJeu: [], activeTeamId: TEAM_VERT };
  const { legalIds } = getLegalCardIds(state);
  assert.ok(legalIds.includes('passe'));
  assert.ok(!legalIds.includes('tir_au_but'));
});

console.log('\nSuccession — cartes de circulation');
test('passe jouée par l’équipe adverse => riposte possible avec faute/touche/interception/contre-attaque', () => {
  const state = {
    pileDeJeu: [{ cardId: 'passe', teamId: TEAM_VERT }],
    activeTeamId: TEAM_BLANC,
  };
  const { legalIds, reason } = getLegalCardIds(state);
  assert.equal(reason, 'rival');
  for (const id of ['faute', 'touche', 'interception', 'contre_attaque', 'corner']) {
    assert.ok(legalIds.includes(id), `${id} devrait être légal`);
  }
  assert.ok(!legalIds.includes('but'), 'but ne doit pas être jouable directement après passe');
});
test('passe jouée par sa propre équipe => on peut enchaîner tir au but / boulet de canon / coup de chance / autre passe', () => {
  const state = { pileDeJeu: [{ cardId: 'passe', teamId: TEAM_VERT }], activeTeamId: TEAM_VERT };
  const { legalIds, reason } = getLegalCardIds(state);
  assert.equal(reason, 'own');
  for (const id of ['tir_au_but', 'boulet_de_canon', 'coup_de_chance', 'contre_attaque', 'degagement', 'passe']) {
    assert.ok(legalIds.includes(id), id);
  }
});

console.log('\nDéfense restreinte (boulet de canon / penalty / coup franc direct)');
test('boulet de canon ne peut être stoppé que par arrêt ou coup de chance', () => {
  const state = { pileDeJeu: [{ cardId: 'boulet_de_canon', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC };
  const { legalIds, restricted } = getLegalCardIds(state);
  assert.ok(restricted);
  assert.deepEqual(new Set(legalIds.filter((c) => c !== 'carte_vierge')), new Set(['arret', 'coup_de_chance']));
  assert.ok(!isLegalPlay(state, 'interception'), 'interception ne doit pas stopper un boulet de canon');
});
test('penalty : même défense restreinte', () => {
  const state = { pileDeJeu: [{ cardId: 'penalty', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC };
  assert.ok(isLegalPlay(state, 'arret'));
  assert.ok(isLegalPlay(state, 'coup_de_chance'));
  assert.ok(!isLegalPlay(state, 'faute'));
});

console.log('\nFautes et coups francs');
test('1 faute => coup franc indirect uniquement', () => {
  const state = { pileDeJeu: [{ cardId: 'faute', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC, consecutiveFautes: 1 };
  const { legalIds, freeKickMode } = getLegalCardIds(state);
  assert.equal(freeKickMode, 'indirect');
  assert.ok(legalIds.includes('coup_franc'));
  assert.ok(!legalIds.includes('penalty'));
});
test('2 fautes coup sur coup => coup franc direct OU penalty', () => {
  const state = { pileDeJeu: [{ cardId: 'faute', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC, consecutiveFautes: 2 };
  const { legalIds, freeKickMode } = getLegalCardIds(state);
  assert.equal(freeKickMode, 'direct');
  assert.ok(legalIds.includes('coup_franc'));
  assert.ok(legalIds.includes('penalty'));
});
test('coup franc indirect : le botteur ne peut pas marquer directement (pas de "but" en own)', () => {
  const state = { pileDeJeu: [{ cardId: 'coup_franc', teamId: TEAM_BLANC }], activeTeamId: TEAM_BLANC, freeKickMode: 'indirect' };
  const { legalIds } = getLegalCardIds(state);
  assert.ok(!legalIds.includes('but'));
  assert.ok(legalIds.includes('tir_au_but'));
});
test('coup franc direct : le botteur peut marquer directement ("but" en own)', () => {
  const state = { pileDeJeu: [{ cardId: 'coup_franc', teamId: TEAM_BLANC }], activeTeamId: TEAM_BLANC, freeKickMode: 'direct' };
  const { legalIds, restricted } = getLegalCardIds(state);
  assert.ok(legalIds.includes('but'));
  const rivalCheck = getLegalCardIds({ ...state, activeTeamId: TEAM_VERT });
  assert.ok(rivalCheck.restricted);
});

console.log('\nBut refusé');
test('après un "but", seule but_refuse est jouable (fenêtre spéciale)', () => {
  const state = { pileDeJeu: [{ cardId: 'but', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC, pendingGoal: { teamId: TEAM_VERT } };
  const { legalIds, reason } = getLegalCardIds(state);
  assert.equal(reason, 'fenetre-but-refuse');
  assert.deepEqual(legalIds.filter((c) => c !== 'carte_vierge'), ['but_refuse']);
});
test('après but_refuse, l’équipe qui l’a joué doit rejouer "passe"', () => {
  const state = { pileDeJeu: [{ cardId: 'but_refuse', teamId: TEAM_BLANC }], activeTeamId: TEAM_BLANC };
  const { legalIds, reason } = getLegalCardIds(state);
  assert.equal(reason, 'relance-but-refuse');
  assert.deepEqual(legalIds.filter((c) => c !== 'carte_vierge'), ['passe']);
});

console.log('\nHors-jeu et corner');
test('hors-jeu : seule l’équipe menacée peut répondre, obligatoirement par coup franc indirect', () => {
  const state = { pileDeJeu: [{ cardId: 'hors_jeu', teamId: TEAM_VERT }], activeTeamId: TEAM_VERT };
  assert.deepEqual(getLegalCardIds(state).legalIds.filter((c) => c !== 'carte_vierge'), []);
  const rival = { pileDeJeu: [{ cardId: 'hors_jeu', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC };
  const { legalIds, freeKickMode } = getLegalCardIds(rival);
  assert.deepEqual(legalIds.filter((c) => c !== 'carte_vierge'), ['coup_franc']);
  assert.equal(freeKickMode, 'indirect');
});
test('corner disponible dès que l’équipe active n’a pas l’initiative, quelle que soit la carte exposée', () => {
  const state = { pileDeJeu: [{ cardId: 'interception', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC };
  assert.ok(isLegalPlay(state, 'corner'));
  const ownSide = { pileDeJeu: [{ cardId: 'interception', teamId: TEAM_VERT }], activeTeamId: TEAM_VERT };
  assert.ok(!isLegalPlay(ownSide, 'corner'));
});

console.log('\nChangements de camp (resolvePlay)');
test('contre-attaque change le camp immédiatement', () => {
  const state = { pileDeJeu: [{ cardId: 'passe', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC };
  const fx = resolvePlay(state, 'contre_attaque', TEAM_BLANC);
  assert.ok(fx.changesCamp);
});
test('dégagement change le camp', () => {
  const state = { pileDeJeu: [{ cardId: 'interception', teamId: TEAM_BLANC }], activeTeamId: TEAM_BLANC };
  const fx = resolvePlay(state, 'degagement', TEAM_BLANC);
  assert.ok(fx.changesCamp);
});
test('interception ne change pas le camp', () => {
  const state = { pileDeJeu: [{ cardId: 'passe', teamId: TEAM_VERT }], activeTeamId: TEAM_BLANC };
  const fx = resolvePlay(state, 'interception', TEAM_BLANC);
  assert.ok(!fx.changesCamp);
});

console.log('\nPartie complète (createGame / playCard)');
test('createGame distribue 8 cartes à chaque joueur et le reste au talon', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(42));
  assert.equal(g.hands.p0.length, 8);
  assert.equal(g.hands.p1.length, 8);
  assert.equal(g.talon.length, 109 - 16);
  assert.equal(g.players[0].teamId, TEAM_VERT);
  assert.equal(g.players[1].teamId, TEAM_BLANC);
});
test('mode 4 joueurs : équipes en alternance vert/blanc/vert/blanc', () => {
  const g = createGame(['A', 'B', 'C', 'D'], seededRng(7));
  assert.deepEqual(g.players.map((p) => p.teamId), [TEAM_VERT, TEAM_BLANC, TEAM_VERT, TEAM_BLANC]);
});
test('scénario : passe -> tir au but -> but marque, refusable puis confirmé', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(1));
  g.currentPlayerIndex = 0; // Alice (vert) débute
  g.turnPhase = 'play';

  // On force la main d'Alice pour un scénario déterministe.
  g.hands.p0 = [{ uid: 'x1', cardId: 'passe' }, { uid: 'x2', cardId: 'tir_au_but' }, { uid: 'x3', cardId: 'but' }];
  g.hands.p1 = [{ uid: 'y1', cardId: 'faute' }];

  playCard(g, 'x1'); // passe
  assert.equal(g.pileDeJeu.at(-1).cardId, 'passe');

  playCard(g, 'x2'); // tir au but (own, continuation)
  assert.equal(g.pileDeJeu.at(-1).cardId, 'tir_au_but');

  playCard(g, 'x3'); // but
  assert.ok(g.pendingGoal);
  assert.equal(g.teams.vert.score, 0, 'le score n’est incrémenté qu’après confirmation');

  assert.deepEqual(butRefuseHolders(g), []); // Bruno n'a pas but_refuse
  confirmGoal(g);
  assert.equal(g.teams.vert.score, 1);
  assert.equal(g.pileDeJeu.length, 0, 'la pile de jeu est ramassée après le but');
  assert.equal(g.ballCamp, 'centre');
});
test('scénario : but refusé annule le score et relance par une passe adverse', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(2));
  g.currentPlayerIndex = 0;
  g.turnPhase = 'play';
  g.pileDeJeu = [{ uid: 'prev', cardId: 'tir_au_but', teamId: TEAM_VERT, playerId: 'p0' }];
  g.hands.p0 = [{ uid: 'x1', cardId: 'but' }];
  g.hands.p1 = [{ uid: 'y1', cardId: 'but_refuse' }, { uid: 'y2', cardId: 'passe' }];

  playCard(g, 'x1');
  assert.ok(g.pendingGoal);
  const holders = butRefuseHolders(g);
  assert.equal(holders.length, 1);
  assert.equal(holders[0].id, 'p1');

  playButRefuseOutOfTurn(g, 'p1', 'y1');
  assert.equal(g.teams.vert.score, 0);
  assert.equal(g.currentPlayerIndex, 1); // Bruno reprend la main
  assert.ok(isLegalPlay({ ...g, activeTeamId: TEAM_BLANC }, 'passe'));
  assert.ok(!isLegalPlay({ ...g, activeTeamId: TEAM_BLANC }, 'tir_au_but'));
});
test('carte vierge (joker) peut être déclarée comme n’importe quelle carte légale', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(3));
  g.currentPlayerIndex = 0;
  g.turnPhase = 'play';
  g.hands.p0 = [{ uid: 'j1', cardId: 'carte_vierge' }];
  playCard(g, 'j1', 'passe');
  assert.equal(g.pileDeJeu.at(-1).cardId, 'passe');
  assert.equal(g.pileDeJeu.at(-1).jokerFor, 'passe');
});
test('coup illégal rejeté (lève une erreur)', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(4));
  g.currentPlayerIndex = 0;
  g.turnPhase = 'play';
  g.hands.p0 = [{ uid: 'z1', cardId: 'but' }]; // "but" n'est jamais légal au coup d'envoi
  assert.throws(() => playCard(g, 'z1'));
});

console.log(`\n${passed} test(s) réussi(s).`);
if (process.exitCode) {
  console.error('Des tests ont échoué.');
} else {
  console.log('Tous les tests sont au vert.');
}
