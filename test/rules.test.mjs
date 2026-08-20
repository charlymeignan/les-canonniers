// test/rules.test.mjs — Le moteur est-il conforme au livret ?
//
// Chaque test cite la cellule de docs/regles-reference.md qu'il vérifie. La
// transcription est la référence : si un test échoue, c'est le moteur qui a
// tort, pas le livret.
//
// Lancer avec : node test/rules.test.mjs
import assert from 'node:assert/strict';
import { totalCardCount, buildFullDeck, CARD_DEFS, CARD_ORDER } from '../js/deck.js';
import { getLegalCardIds, isLegalPlay, changesCamp, threatensGoal } from '../js/rules.js';
import {
  createGame, activePlayer, playCard, endTurn, butRefuseHolders,
  playButRefuseOutOfTurn, legalHandCards, mustDiscard, discardExcess,
  TEAM_VERT, TEAM_BLANC,
} from '../js/state.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`FAIL - ${name}`);
    console.error('       ' + String(err.message).split('\n')[0]);
    process.exitCode = 1;
  }
}

function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

/** Raccourci : que peut jouer `equipe` face à `carte` posée par `poseur` ? */
function coups(carte, poseur, equipe, ballCamp, extra = {}) {
  return getLegalCardIds({
    pileDeJeu: [{ cardId: carte, teamId: poseur }],
    activeTeamId: equipe, ballCamp, ...extra,
  }).legalIds;
}

const V = TEAM_VERT, B = TEAM_BLANC;

console.log('Deck');
test('108 cartes jouables ; la carte vierge n’est pas distribuée', () => {
  assert.equal(totalCardCount(), 108);
  assert.ok(!CARD_ORDER.includes('carte_vierge'));
  assert.equal(buildFullDeck().length, 108);
});
test('quantités conformes à l’inventaire', () => {
  const attendu = {
    tir_au_but: 10, boulet_de_canon: 3, touche: 2, coup_de_chance: 4, sortie_de_but: 2,
    faute: 10, corner: 2, penalty: 2, but: 10, degagement: 10, interception: 13,
    but_refuse: 1, hors_jeu: 2, passe: 12, coup_franc: 8, arret: 11, contre_attaque: 6,
  };
  for (const [id, q] of Object.entries(attendu)) assert.equal(CARD_DEFS[id].qty, q, id);
});

console.log('\nPage 13 — PASSE');
test('posée par votre équipe, ballon camp adverse (attaquez)', () => {
  assert.deepEqual(coups('passe', V, V, B),
    ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe']);
});
test('posée par votre équipe, ballon votre camp (ripostez)', () => {
  assert.deepEqual(coups('passe', V, V, V),
    ['contre_attaque', 'degagement', 'passe']);
});
test('posée par vos adversaires, ballon camp adverse', () => {
  assert.deepEqual(coups('passe', B, V, B),
    ['faute', 'corner', 'interception', 'contre_attaque']);
});
test('posée par vos adversaires, ballon votre camp', () => {
  assert.deepEqual(coups('passe', B, V, V),
    ['faute', 'touche', 'interception', 'contre_attaque']);
});

console.log('\nPage 13 — INTERCEPTION');
test('posée par votre équipe, ballon camp adverse', () => {
  assert.deepEqual(coups('interception', V, V, B),
    ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe']);
});
test('posée par votre équipe, ballon votre camp', () => {
  assert.deepEqual(coups('interception', V, V, V),
    ['contre_attaque', 'degagement', 'passe']);
});
test('posée par vos adversaires, ballon votre camp', () => {
  assert.deepEqual(coups('interception', B, V, V),
    ['faute', 'interception', 'contre_attaque']);
});

console.log('\nPage 14 — DÉGAGEMENT, CONTRE-ATTAQUE, TIR AU BUT');
test('dégagement, ballon camp adverse', () => {
  assert.deepEqual(coups('degagement', V, V, B),
    ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe']);
});
test('dégagement, ballon votre camp', () => {
  assert.deepEqual(coups('degagement', V, V, V),
    ['contre_attaque', 'interception', 'touche', 'faute']);
});
test('contre-attaque, ballon camp adverse', () => {
  assert.deepEqual(coups('contre_attaque', V, V, B),
    ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe']);
});
test('tir au but, côté attaque : BUT, ou renforcer par boulet / coup de chance', () => {
  assert.deepEqual(coups('tir_au_but', V, V, B),
    ['but', 'boulet_de_canon', 'coup_de_chance']);
});
test('tir au but, côté défense : les sept ripostes du tableau', () => {
  assert.deepEqual(coups('tir_au_but', B, V, V),
    ['interception', 'contre_attaque', 'arret', 'coup_de_chance',
     'sortie_de_but', 'hors_jeu', 'faute']);
});

console.log('\nPage 14 — BOULET DE CANON : « pas d’autres parades possibles »');
test('la défense n’a que arrêt et coup de chance', () => {
  const r = getLegalCardIds({
    pileDeJeu: [{ cardId: 'boulet_de_canon', teamId: V }], activeTeamId: B, ballCamp: B,
  });
  assert.deepEqual(r.legalIds, ['arret', 'coup_de_chance']);
  assert.ok(r.restricted);
  for (const interdite of ['faute', 'hors_jeu', 'touche', 'interception']) {
    assert.ok(!r.legalIds.includes(interdite),
      `${interdite} ne peut pas être jouée sur un boulet de canon (page 12)`);
  }
});
test('un seul arrêt ne suffit pas : l’attaque peut encore conclure', () => {
  const pile = [{ cardId: 'boulet_de_canon', teamId: V }, { cardId: 'arret', teamId: B }];
  assert.deepEqual(
    getLegalCardIds({ pileDeJeu: pile, activeTeamId: V, ballCamp: B }).legalIds, ['but']);
});
test('deux arrêts coup sur coup stoppent le tir', () => {
  const pile = [
    { cardId: 'boulet_de_canon', teamId: V },
    { cardId: 'arret', teamId: B }, { cardId: 'arret', teamId: B },
  ];
  const r = getLegalCardIds({ pileDeJeu: pile, activeTeamId: B, ballCamp: B });
  assert.ok(!r.legalIds.includes('but'));
  assert.deepEqual(r.legalIds, ['interception', 'contre_attaque']);
});
test('un arrêt et un coup de chance stoppent aussi le tir', () => {
  const pile = [
    { cardId: 'penalty', teamId: V },
    { cardId: 'arret', teamId: B }, { cardId: 'coup_de_chance', teamId: B },
  ];
  assert.ok(!getLegalCardIds({ pileDeJeu: pile, activeTeamId: V, ballCamp: B })
    .legalIds.includes('but'));
});

console.log('\nPage 16 — Fautes, coup franc, penalty');
test('1 seule faute → coup franc indirect, des deux côtés du tableau', () => {
  assert.deepEqual(coups('faute', B, V, B, { consecutiveFautes: 1 }), ['coup_franc']);
  assert.deepEqual(coups('faute', B, V, V, { consecutiveFautes: 1 }), ['coup_franc']);
});
test('2 fautes coup sur coup, côté attaque → coup franc direct ou penalty', () => {
  const r = getLegalCardIds({
    pileDeJeu: [{ cardId: 'faute', teamId: B }], activeTeamId: V, ballCamp: B,
    consecutiveFautes: 2,
  });
  assert.deepEqual(r.legalIds, ['coup_franc', 'penalty']);
  assert.equal(r.freeKickMode, 'direct');
});
test('2 fautes coup sur coup, côté riposte → coup franc direct seul', () => {
  assert.deepEqual(
    coups('faute', B, V, V, { consecutiveFautes: 2 }), ['coup_franc']);
});
test('l’équipe fautive peut en commettre une seconde, pas une troisième', () => {
  assert.deepEqual(coups('faute', V, V, B, { consecutiveFautes: 1 }), ['faute']);
  assert.deepEqual(coups('faute', V, V, B, { consecutiveFautes: 2 }), []);
});
test('coup franc indirect : le botteur ne peut pas marquer directement', () => {
  const ids = coups('coup_franc', V, V, B, { freeKickMode: 'indirect' });
  assert.deepEqual(ids, ['tir_au_but', 'boulet_de_canon', 'passe']);
  assert.ok(!ids.includes('but'));
});
test('coup franc direct : BUT, et défense fermée', () => {
  assert.deepEqual(coups('coup_franc', V, V, B, { freeKickMode: 'direct' }), ['but']);
  assert.deepEqual(coups('coup_franc', V, B, B, { freeKickMode: 'direct' }),
    ['arret', 'coup_de_chance']);
});
test('penalty : mêmes pouvoirs que le boulet de canon', () => {
  assert.deepEqual(coups('penalty', V, V, B), ['but']);
  assert.deepEqual(coups('penalty', V, B, B), ['arret', 'coup_de_chance']);
});

console.log('\nPages 15-16 — Cartes de l’arbitre');
test('hors-jeu : le coup franc revient à l’équipe qui l’a signalé', () => {
  assert.deepEqual(coups('hors_jeu', V, B, B), ['coup_franc']);
  assert.deepEqual(coups('hors_jeu', V, V, B), []);
});
test('sortie de but : « vous devez jouer DÉGAGEMENT »', () => {
  assert.deepEqual(coups('sortie_de_but', V, B, B), ['degagement']);
});
test('arrêt : « jouez interception, contre-attaque »', () => {
  assert.deepEqual(coups('arret', V, V, B), ['interception', 'contre_attaque']);
});
test('corner : tir au but ou passe en attaque, quatre ripostes', () => {
  assert.deepEqual(coups('corner', V, V, B), ['tir_au_but', 'passe']);
  assert.deepEqual(coups('corner', V, B, B), ['interception', 'faute', 'contre_attaque']);
});
test('touche posée par votre équipe : vous reprenez le contrôle', () => {
  assert.deepEqual(coups('touche', V, V, B),
    ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe']);
  assert.deepEqual(coups('touche', V, V, V), ['degagement', 'contre_attaque', 'passe']);
});
test('touche posée par l’adversaire', () => {
  assert.deepEqual(coups('touche', B, V, B), ['interception', 'faute']);
  assert.deepEqual(coups('touche', B, V, V), ['contre_attaque', 'interception', 'faute']);
});
test('but : « votre seule possibilité : jouer BUT REFUSÉ »', () => {
  const r = getLegalCardIds({
    pileDeJeu: [{ cardId: 'but', teamId: V }], activeTeamId: B, ballCamp: B,
    pendingGoal: { teamId: V },
  });
  assert.deepEqual(r.legalIds, ['but_refuse']);
});
test('but refusé : « jouez passe, et attaquez à votre tour »', () => {
  assert.deepEqual(coups('but_refuse', B, V, V), ['passe']);
});

console.log('\nPage 12 — Mouvements du ballon');
const pile = (...ids) => ({ pileDeJeu: ids.map((c) => typeof c === 'string'
  ? { cardId: c, teamId: V } : c), ballCamp: B });
test('1 - contre-attaque exposée', () => {
  assert.ok(changesCamp(pile('passe'), 'contre_attaque', V));
});
test('2 - interception suivie de dégagement, boulet de canon, ou deux passes', () => {
  assert.ok(changesCamp(pile('interception'), 'degagement', V));
  assert.ok(changesCamp(pile('interception'), 'boulet_de_canon', V));
  assert.ok(changesCamp(pile('interception', 'passe'), 'passe', V));
  assert.ok(!changesCamp(pile('interception'), 'passe', V), 'une seule passe ne suffit pas');
});
test('3 - après une touche, suivie de passe, dégagement ou contre-attaque', () => {
  assert.ok(changesCamp(pile('touche'), 'passe', V));
  assert.ok(changesCamp(pile('touche'), 'degagement', V));
  assert.ok(changesCamp(pile('touche'), 'contre_attaque', V));
});
test('4 - faute de l’équipe menacée, sanctionnée par un coup franc', () => {
  const st = { pileDeJeu: [{ cardId: 'faute', teamId: V }], ballCamp: V };
  assert.ok(changesCamp(st, 'coup_franc', B), 'la faute a été commise dans son propre camp');
});
test('l’arrêt vaut dégagement : le ballon change de camp', () => {
  assert.ok(changesCamp(pile('tir_au_but'), 'arret', B));
});
test('coup d’envoi : la passe envoie le ballon dans le camp adverse', () => {
  assert.ok(changesCamp({ pileDeJeu: [], ballCamp: 'centre' }, 'passe', V));
});

console.log('\nLa défense doit avoir sa fenêtre (page 10)');
test('un tir rend la main, sauf le coup de chance', () => {
  for (const c of ['tir_au_but', 'boulet_de_canon', 'penalty']) assert.ok(threatensGoal(c), c);
  assert.ok(threatensGoal('coup_franc', 'direct'));
  assert.ok(!threatensGoal('coup_franc', 'indirect'));
  // « Le joueur vert possède coup de chance et but : il marque. »
  assert.ok(!threatensGoal('coup_de_chance'));
  for (const c of ['passe', 'interception', 'degagement', 'arret']) assert.ok(!threatensGoal(c), c);
});
test('après un tir au but, le tireur ne conclut pas dans la foulée', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(21));
  g.currentPlayerIndex = 0; g.turnPhase = 'play'; g.ballCamp = TEAM_BLANC;
  g.pileDeJeu = [{ uid: 'p0', cardId: 'passe', teamId: V, playerId: 'p0' }];
  g.hands.p0 = [{ uid: 't', cardId: 'tir_au_but' }, { uid: 'b', cardId: 'but' }];

  playCard(g, 't');
  assert.equal(g.turnMustEnd, true);
  endTurn(g);
  assert.equal(activePlayer(g).id, 'p1', 'la main passe à la défense');
  const riposte = getLegalCardIds({ ...g, activeTeamId: TEAM_BLANC }).legalIds;
  for (const parade of ['arret', 'interception', 'contre_attaque', 'sortie_de_but', 'hors_jeu']) {
    assert.ok(riposte.includes(parade), `${parade} doit être jouable`);
  }
});

console.log('\nDéfausse obligatoire (page 9)');
test('endTurn refuse de clore tant que la défausse est due', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(22));
  g.currentPlayerIndex = 0; g.turnPhase = 'play'; g.ballCamp = TEAM_VERT;
  g.pileDeJeu = [{ uid: 'x', cardId: 'arret', teamId: B, playerId: 'p1' }];
  g.hands.p0 = Array.from({ length: 9 }, (_, i) => ({ uid: `h${i}`, cardId: 'but' }));

  assert.equal(legalHandCards(g).length, 0);
  assert.equal(mustDiscard(g), true);
  assert.equal(endTurn(g), false, 'endTurn doit signaler le refus, pas rester sans effet');
  assert.equal(activePlayer(g).id, 'p0');

  discardExcess(g, 'h0');
  assert.equal(endTurn(g), true);
  assert.equal(activePlayer(g).id, 'p1');
});

console.log('\nPartie complète');
test('distribution : 8 cartes chacun, le reste au talon', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(42));
  assert.equal(g.hands.p0.length, 8);
  assert.equal(g.hands.p1.length, 8);
  assert.equal(g.talon.length, 108 - 16);
});
test('4 joueurs : « un joueur d’une équipe adverse entre deux membres d’une même équipe »', () => {
  const g = createGame(['A', 'B', 'C', 'D'], seededRng(7));
  assert.deepEqual(g.players.map((p) => p.teamId), [V, B, V, B]);
});
test('but refusé : l’auteur prend deux cartes au talon (page 12)', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(2));
  g.currentPlayerIndex = 0; g.turnPhase = 'play'; g.ballCamp = TEAM_BLANC;
  g.pileDeJeu = [{ uid: 'prev', cardId: 'tir_au_but', teamId: V, playerId: 'p0' }];
  g.hands.p0 = [{ uid: 'x1', cardId: 'but' }];
  g.hands.p1 = [{ uid: 'y1', cardId: 'but_refuse' }];
  const talonAvant = g.talon.length;

  playCard(g, 'x1');
  assert.deepEqual(butRefuseHolders(g).map((p) => p.id), ['p1']);
  playButRefuseOutOfTurn(g, 'p1', 'y1');

  assert.equal(g.teams.vert.score, 0, 'le but est annulé');
  assert.equal(g.hands.p1.length, 2, 'deux cartes prises au talon');
  assert.ok(g.talon.length < talonAvant);
  assert.equal(g.currentPlayerIndex, 1, 'il joue immédiatement un nouveau coup d’envoi');
});
test('coup illégal rejeté', () => {
  const g = createGame(['Alice', 'Bruno'], seededRng(4));
  g.currentPlayerIndex = 0; g.turnPhase = 'play'; g.ballCamp = 'centre';
  g.hands.p0 = [{ uid: 'z1', cardId: 'but' }];
  assert.throws(() => playCard(g, 'z1'));
});

console.log(`\n${passed} test(s) réussi(s).`);
if (process.exitCode) console.error('Des tests ont échoué.');
else console.log('Le moteur est conforme à la transcription.');
