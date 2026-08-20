// ui.js — Rendu DOM et interactions. Ne contient aucune règle de jeu : tout passe
// par state.js / rules.js. Le rôle de ce module est de dessiner l'état et de
// transmettre les intentions du joueur au moteur.

import { CARD_DEFS, CARD_ORDER } from './deck.js';
import { SUCCESSION } from './rules.js';
import { ICON_BUILDERS, illustration, ballSvg } from './assets-mapping.js';
import {
  createGame, activePlayer, drawForTurn, playCard, confirmGoal, endTurn,
  legalHandCards, currentLegalInfo, butRefuseHolders, playButRefuseOutOfTurn,
  otherTeam, TEAM_VERT, TEAM_BLANC,
} from './state.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let game = null;
let selectedUid = null;
let handRevealed = false;

// ------------------------------------------------------------------ cartes ---

/** Construit le HTML d'une carte, dans la structure imprimée du matériel réel. */
export function renderCard(cardId, { large = false, playable = false, muted = false, selected = false } = {}) {
  const def = CARD_DEFS[cardId];
  if (!def) return '';
  const succ = SUCCESSION[cardId] || {};

  const badge = def.icon
    ? `<span class="card-badge card-badge--icon">${ICON_BUILDERS[def.icon]?.() ?? ''}</span>`
    : def.monogram
      ? `<span class="card-badge${def.monogram.length > 2 ? ' card-badge--wide' : ''}" data-color="${def.badgeColor}">${def.monogram}</span>`
      : '';

  const corner = (pos) => `
    <span class="card-corner card-corner--${pos}">
      ${badge}
      <span class="card-title">${def.name.toLowerCase()}</span>
    </span>`;

  // Listes de succession imprimées sur la carte : noir = suites de son équipe,
  // rouge = ripostes de l'adversaire (convention du livret, page 10).
  const ownList = ownIdsFor(cardId);
  const rivalList = rivalIdsFor(cardId);
  const lists = (ownList.length || rivalList.length) ? `
    <span class="card-lists">
      ${ownList.length ? `<span class="own">${ownList.map((id) => `<span>${CARD_DEFS[id]?.name ?? id}</span>`).join('')}</span>` : ''}
      ${rivalList.length ? `<span class="rival">${rivalList.map((id) => `<span>${CARD_DEFS[id]?.name ?? id}</span>`).join('')}</span>` : ''}
    </span>` : '';

  const subtitle = def.subtitle ? `<span class="card-subtitle">${def.subtitle}</span>` : '';
  const illus = def.illus ? `<span class="card-illus">${illustration(def.illus)}</span>` : '';

  const classes = [
    'card',
    (!ownList.length && !rivalList.length) && 'card--no-lists',
    large && 'card--lg',
    playable && 'card--playable',
    muted && 'card--muted',
    selected && 'card--selected',
    def.isJoker && 'card--joker',
  ].filter(Boolean).join(' ');

  return `<div class="${classes}" data-card="${cardId}">
    ${corner('tl')}${subtitle}${lists}${illus}${corner('br')}
  </div>`;
}

function ownIdsFor(cardId) {
  const s = SUCCESSION[cardId];
  if (!s) return [];
  if (s.modes) return [...new Set([...s.modes.indirect.own, ...s.modes.direct.own])];
  return s.own || [];
}

function rivalIdsFor(cardId) {
  const s = SUCCESSION[cardId];
  if (!s) return [];
  if (s.modes) return [...new Set([...s.modes.indirect.rival, ...s.modes.direct.rival])];
  return s.rival || [];
}

// ------------------------------------------------------------------- écrans --

function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.toggle('is-active', s.id === id));
  window.scrollTo(0, 0);
}

function openOverlay(id) { $(`#${id}`).classList.add('is-open'); }
function closeOverlay(id) { $(`#${id}`).classList.remove('is-open'); }

// -------------------------------------------------------------------- rendu --

export function render() {
  if (!game) return;
  renderScore();
  renderPitch();
  renderTable();
  renderHand();
  renderActions();
}

function renderScore() {
  $('#score-vert .score-value').textContent = game.teams.vert.score;
  $('#score-blanc .score-value').textContent = game.teams.blanc.score;
}

function renderPitch() {
  const ballEl = $('#ball');
  if (!ballEl.innerHTML) ballEl.innerHTML = ballSvg(44);
  ballEl.dataset.camp = game.ballCamp;
  const label = game.ballCamp === 'centre'
    ? 'Ballon au centre'
    : `Ballon dans le camp ${game.ballCamp}`;
  ballEl.setAttribute('aria-label', label);
  $('#pitch-status').textContent = label;
}

function renderTable() {
  const top = game.pileDeJeu[game.pileDeJeu.length - 1];

  $('#pile-slot').innerHTML = top
    ? renderCard(top.cardId)
    : `<div class="mini-card card-empty">Aucune<br>carte</div>`;

  $('#talon-count').textContent = game.talon.length;
  $('#defausse-count').textContent = game.defausse.length;
  $('#pile-count').textContent = game.pileDeJeu.length;

  const p = activePlayer(game);
  $('#brief-player').textContent = p ? p.name : '—';
  $('#brief-team').textContent = p ? game.teams[p.teamId].name : '';

  const info = currentLegalInfo(game);

  if (game.pendingGoal) {
    const scorer = game.teams[game.pendingGoal.teamId].name;
    $('#brief-exposed').innerHTML = `But de l'équipe ${scorer} !`;
    $('#brief-legal').innerHTML = `<em>Fenêtre « but refusé »</em> — l'équipe ${game.teams[otherTeam(game.pendingGoal.teamId)].name} peut annuler le but si elle détient la carte.`;
    $('#brief-chips').innerHTML = '';
    return;
  }

  const exposedName = top ? CARD_DEFS[top.cardId].name : 'Coup d\'envoi';
  const modeTag = top?.cardId === 'coup_franc' && game.freeKickMode
    ? `<span class="brief-mode">${game.freeKickMode}</span>` : '';
  const ownerTag = top
    ? `<span class="brief-mode" data-team="${top.teamId}">${game.teams[top.teamId].name}</span>`
    : '';
  $('#brief-exposed').innerHTML = `${exposedName}${modeTag}${ownerTag}`;

  const legalIds = info.legalIds.filter((id) => id !== 'carte_vierge');

  if (!top) {
    $('#brief-legal').innerHTML = `Coup d'envoi : posez obligatoirement une <strong>passe</strong>. Le ballon partira dans le camp adverse.`;
  } else if (info.restricted) {
    $('#brief-legal').innerHTML = `<em>Défense restreinte.</em> Seules deux parades existent, et il faut deux cartes consécutives pour stopper le tir.`;
  } else if (legalIds.length === 0) {
    $('#brief-legal').innerHTML = `Aucune suite pour votre équipe sur cette carte : c'est à l'adversaire de répondre.`;
  } else {
    $('#brief-legal').innerHTML = info.reason === 'own'
      ? `Vous poursuivez l'action. Cartes recevables :`
      : `Vous ripostez. Cartes recevables :`;
  }

  // Pastilles des coups légaux : celles que le joueur détient sont mises en avant.
  const p2 = activePlayer(game);
  const inHand = new Set((game.hands[p2?.id] || []).map((c) => c.cardId));
  $('#brief-chips').innerHTML = legalIds
    .map((id) => `<span class="brief-chip" data-has="${inHand.has(id) ? 1 : 0}">${CARD_DEFS[id]?.name ?? id}</span>`)
    .join('');

  renderSequence();
}

/**
 * Séquence en cours : sur la table physique, la pile de jeu reste visible et
 * chacun peut relire l'enchaînement. On la restitue ici, la plus récente en bas.
 */
function renderSequence() {
  const seq = game.pileDeJeu;
  if (seq.length === 0) { $('#brief-seq').innerHTML = ''; return; }
  $('#brief-seq').innerHTML = `
    <p class="brief-seq-label">Séquence en cours</p>
    <ol class="brief-seq-list">
      ${seq.slice(-6).map((c) => `
        <li>
          <span class="log-team" data-team="${c.teamId}">${game.teams[c.teamId].name}</span>
          ${CARD_DEFS[c.cardId]?.name ?? c.cardId}${c.jokerFor ? ' <em>(vierge)</em>' : ''}
        </li>`).join('')}
    </ol>`;
}

function renderHand() {
  const p = activePlayer(game);
  const scroll = $('#hand-scroll');
  if (!p) { scroll.innerHTML = ''; return; }

  $('#hand-owner').textContent = p.name;
  $('#hand-dot').dataset.team = p.teamId;
  $('#hand-count').textContent = `${game.hands[p.id].length} carte${game.hands[p.id].length > 1 ? 's' : ''}`;

  if (!handRevealed) {
    scroll.innerHTML = game.hands[p.id]
      .map(() => `<div class="card"><div class="mini-card card-back" style="height:100%"></div></div>`)
      .join('');
    return;
  }

  const legalUids = new Set(legalHandCards(game).map((c) => c.uid));
  scroll.innerHTML = game.hands[p.id]
    .map((card) => {
      const playable = legalUids.has(card.uid);
      const html = renderCard(card.cardId, {
        playable,
        muted: !playable,
        selected: selectedUid === card.uid,
      });
      return html.replace('<div class="card', `<button type="button" data-uid="${card.uid}" class="card`)
        .replace(/<\/div>$/, '</button>');
    })
    .join('');
}

function renderActions() {
  const canPlay = handRevealed && legalHandCards(game).length > 0;
  $('#btn-play').disabled = !selectedUid;
  $('#btn-end').textContent = canPlay && game.turnCardsPlayed === 0
    ? 'Passer son tour'
    : 'Fin du tour';
}

// -------------------------------------------------------------- interactions -

function selectCard(uid) {
  selectedUid = selectedUid === uid ? null : uid;
  renderHand();
  renderActions();
}

function doPlaySelected() {
  if (!selectedUid) return;
  const p = activePlayer(game);
  const card = game.hands[p.id].find((c) => c.uid === selectedUid);
  if (!card) return;

  // Carte vierge : le joueur déclare ce qu'elle remplace.
  if (card.cardId === 'carte_vierge') {
    openJokerPicker(card.uid);
    return;
  }

  try {
    playCard(game, card.uid);
  } catch (err) {
    flashMessage('Coup interdit', err.message);
    return;
  }
  selectedUid = null;
  afterPlay(card.cardId);
}

function afterPlay(playedId) {
  render();

  if (playedId === 'but' && game.pendingGoal) {
    const holders = butRefuseHolders(game);
    if (holders.length > 0) {
      openButRefuseWindow(holders);
    } else {
      confirmGoal(game);
      handRevealed = false;
      flashMessage('But !', `L'équipe ${game.teams[[...game.history].reverse().find((h) => h.type === 'goal-confirmed').teamId].name} marque. Le marqueur ramasse la pile, complète sa main à huit cartes et relance par une passe.`);
      render();
    }
    return;
  }

  // Trois cartes consécutives au maximum par tour (page 9).
  if (game.turnCardsPlayed >= 3) {
    flashMessage('Trois cartes posées', 'Vous avez posé le maximum de trois cartes consécutives. Le tour passe au joueur suivant.');
    finishTurn();
  }
}

function finishTurn() {
  endTurn(game);
  selectedUid = null;
  handRevealed = false;
  render();
  openPassScreen();
}

function openPassScreen() {
  const p = activePlayer(game);
  if (!p) return;
  $('#pass-name').textContent = p.name;
  $('#pass-team').textContent = `Équipe ${game.teams[p.teamId].name}`;
  openOverlay('overlay-pass');
}

function revealHand() {
  closeOverlay('overlay-pass');
  if (game.turnPhase === 'draw') drawForTurn(game);
  handRevealed = true;
  render();
}

function openJokerPicker(uid) {
  const info = currentLegalInfo(game);
  const options = info.legalIds.filter((id) => id !== 'carte_vierge');
  if (options.length === 0) {
    flashMessage('Aucune option', 'Aucune carte légale à déclarer avec la carte vierge dans cette situation.');
    return;
  }
  $('#joker-grid').innerHTML = options
    .map((id) => renderCard(id, { playable: true })
      .replace('<div class="card', `<button type="button" data-joker="${id}" class="card`)
      .replace(/<\/div>$/, '</button>'))
    .join('');
  $('#joker-grid').dataset.uid = uid;
  openOverlay('overlay-joker');
}

function openButRefuseWindow(holders) {
  const names = holders.map((h) => h.name).join(', ');
  $('#refuse-text').textContent =
    `Un but vient d'être marqué. ${names} détien${holders.length > 1 ? 'nent' : 't'} de quoi le contester : la carte « but refusé » peut être jouée hors tour, maintenant ou jamais.`;
  $('#refuse-actions').innerHTML = holders
    .map((h) => `<button type="button" class="btn btn--small" data-refuse-player="${h.id}">${h.name} joue « but refusé »</button>`)
    .join('') + `<button type="button" class="btn btn--small btn--ghost" data-refuse-skip>Personne ne conteste — but validé</button>`;
  openOverlay('overlay-refuse');
}

function flashMessage(title, body, tone = 'ink') {
  $('#msg-head').textContent = title;
  $('#msg-head').dataset.tone = tone;
  $('#msg-body').textContent = body;
  openOverlay('overlay-msg');
}

// ------------------------------------------------------------------ journal --

function renderLog() {
  const items = [...game.history].reverse().filter((h) => h.type === 'play' || h.type === 'goal-confirmed' || h.type === 'goal-cancelled');
  $('#log-list').innerHTML = items.length === 0
    ? `<li>Aucun coup joué pour l'instant.</li>`
    : items.map((h) => {
        if (h.type === 'goal-confirmed') {
          return `<li><span class="log-team" data-team="${h.teamId}">${game.teams[h.teamId].name}</span> But validé.</li>`;
        }
        if (h.type === 'goal-cancelled') {
          return `<li><span class="log-team" data-team="arbitre">Arbitre</span> But refusé — le but est annulé.</li>`;
        }
        const player = game.players.find((p) => p.id === h.playerId);
        const joker = h.joker ? ' (carte vierge)' : '';
        return `<li><span class="log-team" data-team="${h.teamId}">${game.teams[h.teamId].name}</span> ${player?.name ?? ''} pose <strong>${CARD_DEFS[h.cardId]?.name ?? h.cardId}</strong>${joker}.</li>`;
      }).join('');
}

// --------------------------------------------------------------- écran aide --

function renderHelpTable() {
  const rows = CARD_ORDER.filter((id) => id !== 'carte_vierge').map((id) => {
    const def = CARD_DEFS[id];
    const own = ownIdsFor(id).map((c) => CARD_DEFS[c]?.name ?? c).join(', ') || '—';
    const rival = rivalIdsFor(id).map((c) => CARD_DEFS[c]?.name ?? c).join(', ') || '—';
    return `<tr>
      <td class="help-name">${def.name}</td>
      <td class="own">${own}</td>
      <td class="rival">${rival}</td>
    </tr>`;
  }).join('');
  $('#help-table-body').innerHTML = rows;
}

function renderCardGallery() {
  $('#card-gallery').innerHTML = CARD_ORDER
    .map((id) => `<div>${renderCard(id)}<p class="gallery-qty">×${CARD_DEFS[id].qty}</p></div>`)
    .join('');
}

// ----------------------------------------------------------------- démarrage -

function readPlayerNames() {
  const mode = $('.mode-switch button[aria-pressed="true"]').dataset.mode;
  const count = mode === '4p' ? 4 : 2;
  return $$('.player-row').slice(0, count).map((row, i) => {
    const val = row.querySelector('input').value.trim();
    return val || `Joueur ${i + 1}`;
  });
}

function syncModeInputs() {
  const mode = $('.mode-switch button[aria-pressed="true"]').dataset.mode;
  const count = mode === '4p' ? 4 : 2;
  $$('.player-row').forEach((row, i) => {
    row.style.display = i < count ? '' : 'none';
  });
}

function startGame() {
  game = createGame(readPlayerNames());
  // Le dé (page 8) désigne qui donne le coup d'envoi.
  const roll = () => 1 + Math.floor(Math.random() * 6);
  let idx = 0, best = -1;
  game.players.forEach((p, i) => { const r = roll(); if (r > best) { best = r; idx = i; } });
  game.currentPlayerIndex = idx;
  game.turnPhase = 'draw';

  selectedUid = null;
  handRevealed = false;
  showScreen('screen-game');
  render();
  renderLog();
  openPassScreen();
}

// ------------------------------------------------------------------- events --

export function bindUI() {
  // Point d'entrée de test : permet aux captures d'écran et aux tests
  // d'intégration de scénariser une main précise plutôt que de dépendre du
  // hasard de la distribution. Sans effet sur le jeu normal.
  window.__canonniers = {
    get game() { return game; },
    setHand(playerId, cardIds) {
      game.hands[playerId] = cardIds.map((cardId, i) => ({ uid: `t${playerId}${i}`, cardId }));
    },
    reveal() { handRevealed = true; },
    render,
  };

  syncModeInputs();
  renderCardGallery();
  renderHelpTable();

  $$('.mode-switch button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.mode-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      syncModeInputs();
    });
  });

  $('#btn-start').addEventListener('click', startGame);
  $('#btn-help-home').addEventListener('click', () => showScreen('screen-help'));
  $('#btn-help-back').addEventListener('click', () => showScreen(game ? 'screen-game' : 'screen-home'));
  $('#btn-help-game').addEventListener('click', () => showScreen('screen-help'));

  $('#btn-log').addEventListener('click', () => { renderLog(); openOverlay('overlay-log'); });
  $('#btn-quit').addEventListener('click', () => {
    if (confirm('Abandonner la partie en cours ?')) { game = null; showScreen('screen-home'); }
  });

  $('#hand-scroll').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-uid]');
    if (!btn) return;
    if (btn.classList.contains('card--muted')) {
      const def = CARD_DEFS[btn.dataset.card];
      flashMessage(def.name, 'Cette carte ne peut pas suivre la carte exposée. Consultez la table de succession dans l\'écran Règles.');
      return;
    }
    selectCard(btn.dataset.uid);
  });

  $('#btn-play').addEventListener('click', doPlaySelected);
  $('#btn-end').addEventListener('click', () => {
    if (game.pendingGoal) return;
    finishTurn();
  });

  $('#pass-reveal').addEventListener('click', revealHand);

  $('#joker-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-joker]');
    if (!btn) return;
    const uid = $('#joker-grid').dataset.uid;
    try {
      playCard(game, uid, btn.dataset.joker);
    } catch (err) {
      flashMessage('Coup interdit', err.message);
      return;
    }
    closeOverlay('overlay-joker');
    selectedUid = null;
    afterPlay(btn.dataset.joker);
  });
  $('#joker-cancel').addEventListener('click', () => closeOverlay('overlay-joker'));

  $('#refuse-actions').addEventListener('click', (e) => {
    const play = e.target.closest('[data-refuse-player]');
    const skip = e.target.closest('[data-refuse-skip]');
    if (play) {
      const pid = play.dataset.refusePlayer;
      const card = game.hands[pid].find((c) => c.cardId === 'but_refuse') || game.hands[pid].find((c) => c.cardId === 'carte_vierge');
      playButRefuseOutOfTurn(game, pid, card.uid);
      closeOverlay('overlay-refuse');
      handRevealed = false;
      render();
      flashMessage('But refusé', 'L\'arbitre annule le but. Le ballon revient au centre et l\'équipe qui a contesté relance par une passe.', 'red');
      openPassScreen();
      return;
    }
    if (skip) {
      confirmGoal(game);
      closeOverlay('overlay-refuse');
      handRevealed = false;
      render();
      flashMessage('But validé', 'Le marqueur ramasse la pile de jeu, complète sa main à huit cartes et relance immédiatement par une passe.', 'ink');
    }
  });

  $$('[data-close-overlay]').forEach((btn) => {
    btn.addEventListener('click', () => closeOverlay(btn.dataset.closeOverlay));
  });
}
