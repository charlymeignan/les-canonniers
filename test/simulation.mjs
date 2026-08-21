// test/simulation.mjs — Banc d'essai du moteur : joue des parties complètes
// ordinateur contre ordinateur et vérifie, à chaque coup, que les invariants du
// jeu tiennent.
//
// C'est le test le plus sévère du moteur : il explore des milliers de séquences
// que des tests unitaires écrits à la main n'atteindraient jamais.
//
// Usage : node test/simulation.mjs [nombre de parties]
import { createGame, activePlayer, TEAM_VERT, TEAM_BLANC } from '../js/state.js';
import { runAITurns } from '../js/match.js';
import { getLegalCardIds } from '../js/rules.js';
import { CARD_DEFS, totalCardCount } from '../js/deck.js';

const GAMES = Number(process.argv[2] || 300);
const TOTAL_CARDS = totalCardCount(); // 108 cartes jouables

/** Générateur déterministe : une partie ratée doit pouvoir être rejouée. */
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Aucune carte ne doit apparaître ni disparaître au cours de la partie. */
function countAllCards(state) {
  let n = state.talon.length + state.defausse.length + state.pileDeJeu.length;
  for (const p of state.players) n += state.hands[p.id].length;
  return n;
}

function allUids(state) {
  const uids = [
    ...state.talon.map((c) => c.uid),
    ...state.defausse.map((c) => c.uid),
    ...state.pileDeJeu.map((c) => c.uid),
  ];
  for (const p of state.players) uids.push(...state.hands[p.id].map((c) => c.uid));
  return uids;
}

const failures = [];
function check(cond, message, ctx) {
  if (!cond) failures.push({ message, ...ctx });
  return cond;
}

let totalTurns = 0;
let totalGoals = 0;
let totalCancelled = 0;
let finished = 0;
const cardPlayCounts = {};

for (let g = 0; g < GAMES; g++) {
  const seed = 1000 + g;
  const rng = seededRng(seed);
  const fourPlayers = g % 3 === 0;
  const seats = fourPlayers
    ? [
        { name: 'Ordi A', isAI: true }, { name: 'Ordi B', isAI: true },
        { name: 'Ordi C', isAI: true }, { name: 'Ordi D', isAI: true },
      ]
    : [{ name: 'Ordi A', isAI: true }, { name: 'Ordi B', isAI: true }];

  const state = createGame(seats, rng);
  state.currentPlayerIndex = Math.floor(rng() * state.players.length);
  state.turnPhase = 'draw';

  check(countAllCards(state) === TOTAL_CARDS, 'distribution : compte de cartes', { seed });
  check(new Set(allUids(state)).size === TOTAL_CARDS, 'distribution : cartes uniques', { seed });

  let guard = 0;
  // Mesure de progression : le nombre de cartes encore "vivantes" (talon + mains)
  // ne peut que décroître. S'il stagne sur plusieurs tours, la partie est figée.
  const liveCards = () =>
    state.talon.length + state.players.reduce((n, p) => n + state.hands[p.id].length, 0);
  let lastLive = liveCards();
  let stagnant = 0;

  while (state.turnPhase !== 'over' && guard < 4000) {

    runAITurns(state, {
      maxTurns: 1,
      onStep(step) {
        if (step.type === 'play') {
          cardPlayCounts[step.cardId] = (cardPlayCounts[step.cardId] ?? 0) + 1;
        }
        if (step.type === 'goal-confirmed') totalGoals += 1;
        if (step.type === 'goal-cancelled') {
          totalCancelled += 1;
          // Jouée hors tour, elle n'émet pas d'étape 'play' : on la compte ici.
          cardPlayCounts.but_refuse = (cardPlayCounts.but_refuse ?? 0) + 1;
        }
      },
    });

    // Invariants vérifiés après chaque tour.
    check(countAllCards(state) === TOTAL_CARDS,
      `conservation des cartes (${countAllCards(state)}/${TOTAL_CARDS})`, { seed, turn: guard });
    check(new Set(allUids(state)).size === TOTAL_CARDS,
      'unicité des cartes (doublon ou perte)', { seed, turn: guard });

    for (const p of state.players) {
      check(state.hands[p.id].length <= 9,
        `main de ${p.name} trop grande : ${state.hands[p.id].length}`, { seed, turn: guard });
    }
    check(['centre', TEAM_VERT, TEAM_BLANC].includes(state.ballCamp),
      `camp du ballon invalide : ${state.ballCamp}`, { seed, turn: guard });

    // Toute carte de la pile de jeu était légale au moment où elle a été posée :
    // playCard() lève sur un coup interdit, donc l'absence d'exception le prouve.
    // On vérifie ici que l'état reste interrogeable sans planter.
    const p = activePlayer(state);
    if (p) {
      const info = getLegalCardIds({ ...state, activeTeamId: p.teamId });
      check(Array.isArray(info.legalIds), 'table de succession interrogeable', { seed, turn: guard });
      for (const id of info.legalIds) {
        check(!!CARD_DEFS[id], `carte inconnue dans la table de succession : ${id}`, { seed });
      }
    }

    const live = liveCards();
    stagnant = live < lastLive ? 0 : stagnant + 1;
    lastLive = live;
    // Chaque tour sans carte posée retire une carte du circuit (défausse,
    // page 9). Si rien ne bouge pendant trois tours de table, la partie est
    // réellement figée et c'est un défaut du moteur.
    if (stagnant > state.players.length * 3) {
      check(false, 'partie figée : plus aucune carte ne quitte le circuit', { seed, turn: guard });
      break;
    }
    guard += 1;
  }

  totalTurns += guard;
  if (state.turnPhase === 'over') finished += 1;

  check(guard < 4000, 'la partie ne se termine pas (boucle infinie)', { seed });
  check(state.teams.vert.score >= 0 && state.teams.blanc.score >= 0, 'score négatif', { seed });
}

// ---------------------------------------------------------------------- bilan --

const pct = (n) => `${((n / GAMES) * 100).toFixed(1)} %`;
console.log(`Simulation — ${GAMES} parties ordinateur contre ordinateur\n`);
console.log(`  parties menées à terme      ${finished}/${GAMES} (${pct(finished)})`);
console.log(`  tours joués (moyenne)       ${(totalTurns / GAMES).toFixed(1)}`);
console.log(`  buts validés (moyenne)      ${(totalGoals / GAMES).toFixed(2)}`);
console.log(`  buts refusés (total)        ${totalCancelled}`);

const played = Object.entries(cardPlayCounts).sort((a, b) => b[1] - a[1]);
console.log('\n  cartes effectivement posées :');
for (const [id, n] of played) {
  console.log(`    ${(CARD_DEFS[id]?.name ?? id).padEnd(18)} ${n}`);
}

// Une carte du deck jamais posée sur des centaines de parties signale une
// branche morte de la table de succession.
const never = Object.keys(CARD_DEFS).filter((id) => !cardPlayCounts[id]);
if (never.length) {
  console.log(`\n  ⚠ jamais posées : ${never.map((id) => CARD_DEFS[id].name).join(', ')}`);
}

if (failures.length) {
  console.error(`\n${failures.length} violation(s) d'invariant :`);
  const grouped = {};
  for (const f of failures) {
    grouped[f.message] = grouped[f.message] || [];
    grouped[f.message].push(f.seed);
  }
  for (const [msg, seeds] of Object.entries(grouped)) {
    console.error(`  ${msg} — graines : ${[...new Set(seeds)].slice(0, 5).join(', ')}${seeds.length > 5 ? '…' : ''} (${seeds.length}×)`);
  }
  process.exit(1);
}

if (finished < GAMES) {
  console.error(`\n${GAMES - finished} partie(s) non terminée(s).`);
  process.exit(1);
}

console.log('\nAucune violation d\'invariant. Toutes les parties sont allées à leur terme.');
