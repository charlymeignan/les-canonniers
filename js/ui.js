// ui.js — Rendu DOM et interactions. Ne contient aucune règle de jeu : tout passe
// par state.js / rules.js. Le rôle de ce module est de dessiner l'état et de
// transmettre les intentions du joueur au moteur.

import { CARD_DEFS, CARD_ORDER } from './deck.js';
import { SUCCESSION } from './rules.js';
import { ICON_BUILDERS, illustration, ballSvg, coverStriker, loadCardArt, cardArtUrl } from './assets-mapping.js';
import {
  createGame, activePlayer, drawForTurn, playCard, confirmGoal, endTurn,
  legalHandCards, currentLegalInfo, butRefuseHolders, playButRefuseOutOfTurn,
  mustDiscard, discardExcess, otherTeam, TEAM_VERT, TEAM_BLANC,
} from './state.js';
import { aiTurn } from './match.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let game = null;
let selectedUid = null;
let handRevealed = false;
let aiRunning = false;
// Jeton de session : incrémenté à chaque nouvelle partie ou abandon. Une boucle
// d'IA déjà lancée compare son jeton avant chaque étape et s'interrompt si la
// partie sous elle a changé — sinon elle continuerait à jouer une partie
// abandonnée.
let aiToken = 0;

// Rythme d'affichage du tour de l'ordinateur : assez lent pour qu'on suive la
// séquence sur la pile de jeu, assez vif pour ne pas faire attendre.
const AI_STEP_MS = 850;

// ------------------------------------------------------------------ cartes ---

/** Construit le HTML d'une carte, dans la structure imprimée du matériel réel. */
export function renderCard(cardId, { large = false, playable = false, muted = false, selected = false } = {}) {
  const def = CARD_DEFS[cardId];
  if (!def) return '';
  const succ = SUCCESSION[cardId] || {};

  // En-tête : la lettrine EST la première lettre de l'intitulé sur la carte
  // réelle, elle ne se répète donc pas dans le texte qui suit.
  const head = renderCardHead(def);

  const corner = (pos) => `
    <span class="card-corner card-corner--${pos}" data-badge="${def.badge}" data-color="${def.color ?? ''}">
      ${head}
      ${def.rest ? `<span class="card-title">${def.rest}</span>` : ''}
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

  // Une illustration déposée dans assets/cards/ prend le pas sur le dessin SVG.
  const art = cardArtUrl(cardId);
  const illus = art
    ? `<span class="card-illus card-illus--art"><img src="${art}" alt="" loading="lazy"></span>`
    : (def.illus ? `<span class="card-illus">${illustration(def.illus)}</span>` : '');

  const classes = [
    'card',
    `card--head-${def.badge}`,
    def.subtitle && 'card--has-subtitle',
    (!ownList.length && !rivalList.length) && 'card--no-lists',
    large && 'card--lg',
    playable && 'card--playable',
    muted && 'card--muted',
    selected && 'card--selected',
  ].filter(Boolean).join(' ');

  return `<div class="${classes}" data-card="${cardId}">
    ${corner('tl')}${subtitle}${lists}${illus}${corner('br')}
  </div>`;
}

/**
 * En-tête de carte, dans l'un des cinq traitements relevés sur le matériel :
 * lettrine pleine, mot cerné d'un filet, lettres empilées, pictogramme, bandeau.
 */
function renderCardHead(def) {
  switch (def.badge) {
    case 'icon':
      return `<span class="card-badge card-badge--icon">${ICON_BUILDERS[def.icon]?.() ?? ''}</span>`;
    case 'stack':
      // "C" au-dessus de "F", sans cadre, comme sur la carte "coup franc".
      return `<span class="card-badge card-badge--stack" data-color="${def.color}">${
        [...def.head].map((ch) => `<b>${ch}</b>`).join('')
      }</span>`;
    case 'frame':
      // Le filet cerne le mot entier : la lettrine et la suite sont dedans.
      return `<span class="card-badge card-badge--frame" data-color="${def.color}"><b>${def.head}</b></span>`;
    case 'band':
      return '';
    case 'solid':
    default:
      return `<span class="card-badge card-badge--solid${def.head.length > 1 ? ' card-badge--wide' : ''}" data-color="${def.color}">${def.head}</span>`;
  }
}

// Listes imprimées sur la carte (page 11) : « En noir : la série de cartes
// parmi lesquelles les équipiers peuvent choisir pour continuer l'action
// entreprise ; en rouge : la série des cartes parmi lesquelles les adversaires
// peuvent choisir pour gêner l'action entreprise. »
//
// Le tableau distinguant en plus la position du ballon, la carte imprimée
// réunit les deux colonnes : c'est bien ce que montrent les photos du matériel.
function fusionner(...listes) {
  return [...new Set(listes.flat().filter(Boolean))];
}

function ownIdsFor(cardId) {
  const d = SUCCESSION[cardId];
  if (!d) return [];
  if (d.modes) return fusionner(d.modes.indirect.attaque, d.modes.direct.attaque);
  // Les sanctions aggravées (double faute) et l'enchaînement de deux fautes
  // appartiennent au camp qui a posé la carte : ils vont dans la liste noire.
  if (d.split) {
    return fusionner(d.own.attaque, d.own.riposte,
      d.doubleAttaque, d.doubleRiposte, d.chainable);
  }
  return fusionner(d.attaque);
}

function rivalIdsFor(cardId) {
  const d = SUCCESSION[cardId];
  if (!d) return [];
  if (d.modes) return fusionner(d.modes.indirect.riposte, d.modes.direct.riposte);
  if (d.split) return fusionner(d.rival.attaque, d.rival.riposte);
  return fusionner(d.riposte);
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

  const legalIds = info.legalIds;

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
          ${CARD_DEFS[c.cardId]?.name ?? c.cardId}
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
  $('#hand-badge').hidden = !p.isAI;

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
  // Partie terminée : plus rien ne doit pouvoir être joué, et le bouton mène à
  // une nouvelle partie. Sans cet état, le plateau reste en place une fois le
  // message de fin refermé et la partie a l'air de ne jamais s'achever.
  if (game.turnPhase === 'over') {
    $('#btn-play').disabled = true;
    $('#btn-read').disabled = true;
    $('#btn-end').textContent = 'Nouvelle partie';
    return;
  }
  const rienAJouer = handRevealed && legalHandCards(game).length === 0;
  $('#btn-play').disabled = !selectedUid;
  $('#btn-read').disabled = !selectedUid;
  $('#btn-end').textContent = rienAJouer
    ? 'Se défausser'
    : (game.turnCardsPlayed === 0 ? 'Passer son tour' : 'Fin du tour');
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
    const humanHolders = holders.filter((h) => !h.isAI);
    if (humanHolders.length > 0) {
      // Un humain détient de quoi contester : à lui de trancher.
      openButRefuseWindow(humanHolders);
    } else if (holders.length > 0) {
      // Seul l'ordinateur peut contester : il le fait systématiquement, la
      // carte étant unique.
      const ai = holders[0];
      const card = game.hands[ai.id].find((c) => c.cardId === 'but_refuse');
      playButRefuseOutOfTurn(game, ai.id, card.uid);
      flashMessage('But refusé', `${ai.name} sort la carte « but refusé » : l'arbitre annule le but. Le ballon revient au centre et ${ai.name} relance par une passe.`, 'red');
      poursuivreApresBut(null);
      return;
    } else {
      const marqueur = game.pendingGoal.playerId;
      confirmGoal(game);
      flashMessage('But !', `L'équipe ${game.teams[[...game.history].reverse().find((h) => h.type === 'goal-confirmed').teamId].name} marque. Vous ramassez la pile, complétez votre main à huit cartes et rejouez immédiatement : le ballon est au centre, relancez par une passe.`);
      poursuivreApresBut(marqueur);
    }
    return;
  }

  // Une carte qui menace le but rend la main : l'adversaire doit pouvoir
  // s'interposer avant la conclusion (page 10).
  if (game.turnMustEnd) {
    flashMessage(
      'À l\'adversaire de jouer',
      `Vous menacez le but. L'adversaire a maintenant sa chance de s'interposer ; `
      + `si personne ne l'arrête, votre camp pourra conclure au tour suivant.`,
      'gold');
    finishTurn();
    return;
  }

  // Trois cartes consécutives au maximum par tour (page 9).
  if (game.turnCardsPlayed >= 3) {
    flashMessage('Trois cartes posées', 'Vous avez posé le maximum de trois cartes consécutives. Le tour passe au joueur suivant.');
    finishTurn();
  }
}

/**
 * Clôt le tour. Si la main compte encore neuf cartes — le joueur a pioché sans
 * rien poser — le livret impose de se défausser (page 9) : on le lui demande
 * plutôt que de laisser le bouton sans effet.
 */
function finishTurn() {
  if (mustDiscard(game)) {
    openDiscardPicker();
    return;
  }
  endTurn(game);
  selectedUid = null;
  handRevealed = false;
  render();
  openPassScreen();
}

/** Sélecteur de défausse : le joueur choisit la carte dont il se sépare. */
function openDiscardPicker() {
  const p = activePlayer(game);
  const bloque = legalHandCards(game).length === 0;
  $('#discard-text').textContent = bloque
    ? "Aucune de vos cartes ne peut suivre la carte exposée. Débarrassez-vous de celle que vous jugez la moins utile : elle part sur la pile de défausse, hors du jeu, et la main passe au joueur suivant."
    : "Vous rendez la main sans avoir rien posé. La carte prise au talon vous en fait neuf : déposez-en une sur la pile de défausse pour revenir à huit.";
  $('#discard-grid').innerHTML = game.hands[p.id]
    .map((card) => renderCard(card.cardId)
      .replace('<div class="card', `<button type="button" data-discard="${card.uid}" class="card`)
      .replace(/<\/div>$/, '</button>'))
    .join('');
  handRevealed = true;
  render();
  openOverlay('overlay-discard');
}

/**
 * Rend la main au joueur suivant : écran de passage pour un humain, tour
 * automatique pour l'ordinateur.
 */
function openPassScreen() {
  const p = activePlayer(game);
  if (!p) return;
  if (game.turnPhase === 'over') { showEndOfMatch(); return; }

  if (p.isAI) {
    runAITurn();
    return;
  }

  $('#pass-name').textContent = p.name;
  $('#pass-team').textContent = `Équipe ${game.teams[p.teamId].name}`;
  openOverlay('overlay-pass');
}

/**
 * Déroule le tour de l'ordinateur étape par étape, à rythme lisible : on doit
 * voir la pile de jeu se garnir, pas découvrir le résultat d'un bloc.
 */
function runAITurn() {
  if (aiRunning) return;
  const player = activePlayer(game);
  if (!player?.isAI) return;

  aiRunning = true;
  handRevealed = false;
  selectedUid = null;
  setAIBanner(true, `${player.name} réfléchit…`);
  render();

  const steps = aiTurn(game);
  const token = aiToken;

  const tick = () => {
    if (token !== aiToken) { aiRunning = false; return; } // partie abandonnée
    const { value: step, done } = steps.next();
    if (done) {
      aiRunning = false;
      setAIBanner(false);
      render();
      openPassScreen();
      return;
    }

    if (step.type === 'play') {
      setAIBanner(true, `${player.name} pose ${CARD_DEFS[step.cardId]?.name ?? step.cardId}`);
    } else if (step.type === 'discard') {
      setAIBanner(true, `${player.name} se défausse`);
    } else if (step.type === 'goal-confirmed') {
      setAIBanner(true, `But de l'équipe ${game.teams[step.teamId].name} !`);
    } else if (step.type === 'goal-cancelled') {
      setAIBanner(true, 'But refusé par l\'arbitre');
    } else if (step.awaitingHuman) {
      // L'ordinateur a marqué et un humain détient « but refusé » : on rend la
      // décision au joueur et on suspend le déroulé automatique.
      aiRunning = false;
      setAIBanner(false);
      render();
      openButRefuseWindow(step.holders.filter((h) => !h.isAI));
      return;
    }

    render();
    setTimeout(tick, AI_STEP_MS);
  };

  setTimeout(tick, AI_STEP_MS);
}

function setAIBanner(on, text = '') {
  const el = $('#ai-banner');
  el.classList.toggle('is-on', on);
  if (text) $('#ai-banner-text').textContent = text;
}

/** Quitte la partie en cours et revient à l'écran d'accueil. */
function retourAccueil() {
  aiToken += 1; // interrompt une éventuelle boucle d'IA en cours
  aiRunning = false;
  setAIBanner(false);
  game = null;
  showScreen('screen-home');
}

function showEndOfMatch() {
  const { vert, blanc } = game.teams;
  const verdict = game.winner === 'nul'
    ? `Match nul, ${vert.score} partout.`
    : `L'équipe ${game.teams[game.winner].name} l'emporte ${Math.max(vert.score, blanc.score)} à ${Math.min(vert.score, blanc.score)}.`;
  $('#msg-head').textContent = 'Fin de la partie';
  $('#msg-head').dataset.tone = 'gold';
  $('#msg-body').textContent = `${verdict} Les cartes sont épuisées : le nombre de piles ramassées départage les équipes.`;
  openOverlay('overlay-msg');
}

function revealHand() {
  closeOverlay('overlay-pass');
  if (game.turnPhase === 'draw') drawForTurn(game);
  handRevealed = true;
  render();
}

/**
 * Suite d'un but validé ou refusé. Ce n'est pas une fin de tour ordinaire : le
 * marqueur « rejoue immédiatement » (page 11) et l'auteur d'un but refusé « joue
 * immédiatement un nouveau coup d'envoi » (page 12). Quand la main reste au même
 * joueur humain, il ne faut donc ni écran de passage ni cartes retournées —
 * sinon il se retrouve devant des dos de cartes, sans autre issue que la
 * défausse.
 */
function poursuivreApresBut(idAvant) {
  const p = activePlayer(game);
  selectedUid = null;
  if (p && !p.isAI && p.id === idAvant) {
    handRevealed = true;
    render();
    return;
  }
  handRevealed = false;
  render();
  openPassScreen();
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

/**
 * Fiche de lecture d'une carte. Le texte imprimé sur le carton fait quatre
 * points et demi une fois la carte à la taille du pouce : fidèle, mais illisible.
 * On redonne ici la même carte en grand et, surtout, ses deux listes de
 * succession au corps du texte courant.
 */
function openCardSheet(cardId) {
  const def = CARD_DEFS[cardId];
  if (!def) return;
  $('#card-sheet-name').textContent = def.name;
  $('#card-sheet-figure').innerHTML = renderCard(cardId, { large: true });
  $('#card-sheet-note').textContent = def.subtitle || '';
  const items = (ids) => ids
    .map((id) => `<li>${CARD_DEFS[id]?.name ?? id}</li>`).join('');
  $('#card-sheet-own').innerHTML = items(ownIdsFor(cardId));
  $('#card-sheet-rival').innerHTML = items(rivalIdsFor(cardId));
  openOverlay('overlay-card');
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
        return `<li><span class="log-team" data-team="${h.teamId}">${game.teams[h.teamId].name}</span> ${player?.name ?? ''} pose <strong>${CARD_DEFS[h.cardId]?.name ?? h.cardId}</strong>.</li>`;
      }).join('');
}

// --------------------------------------------------------------- écran aide --

function renderHelpTable() {
  const rows = CARD_ORDER.map((id) => {
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

function readSeats() {
  const mode = $('.mode-switch button[aria-pressed="true"]').dataset.mode;
  const count = mode === '4p' ? 4 : 2;
  return $$('.player-row').slice(0, count).map((row, i) => {
    const isAI = row.querySelector('.seat-toggle button[data-seat="ai"]').getAttribute('aria-pressed') === 'true';
    const typed = row.querySelector('input').value.trim();
    return { name: typed || (isAI ? `Ordinateur ${i + 1}` : `Joueur ${i + 1}`), isAI };
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
  aiToken += 1; // toute boucle d'IA d'une partie précédente s'arrête ici
  game = createGame(readSeats());
  // Le dé (page 8) désigne qui donne le coup d'envoi.
  const roll = () => 1 + Math.floor(Math.random() * 6);
  let idx = 0, best = -1;
  game.players.forEach((p, i) => { const r = roll(); if (r > best) { best = r; idx = i; } });
  game.currentPlayerIndex = idx;
  game.turnPhase = 'draw';

  selectedUid = null;
  handRevealed = false;
  aiRunning = false;
  setAIBanner(false);
  showScreen('screen-game');
  render();
  renderLog();
  openPassScreen();
}

// ------------------------------------------------------------------- events --

/** Compose la couverture de l'accueil (tireur + ballon du bandeau). */
function renderCover() {
  const fig = document.createElement('div');
  fig.className = 'cover-figure';
  const art = cardArtUrl('cover');
  if (art) {
    fig.classList.add('cover-figure--art');
    fig.innerHTML = `<img src="${art}" alt="">`;
  } else {
    fig.innerHTML = coverStriker();
  }
  $('.cover').prepend(fig);
  $('#cover-ball').innerHTML = ballSvg(40);

  // Motif du dos de carte, s'il a été fourni sous forme d'image.
  //
  // L'URL est résolue en absolu : dans une variable CSS, un chemin relatif est
  // résolu contre la feuille de style qui l'utilise (css/style.css) et non
  // contre le document, ce qui donnait /css/assets/cards/… et un 404.
  const back = cardArtUrl('dos-de-carte');
  if (back) {
    const absolu = new URL(back, document.baseURI).href;
    document.documentElement.style.setProperty('--card-back-art', `url("${absolu}")`);
  }
}

export async function bindUI() {
  // Les illustrations éventuellement déposées sont chargées avant le premier
  // rendu, pour que la galerie et les mains les affichent d'emblée.
  await loadCardArt();

  // Point d'entrée de test : permet aux captures d'écran et aux tests
  // d'intégration de scénariser une main précise plutôt que de dépendre du
  // hasard de la distribution. Sans effet sur le jeu normal.
  window.__canonniers = {
    get game() { return game; },
    setHand(playerId, cardIds) {
      game.hands[playerId] = cardIds.map((cardId, i) => ({ uid: `t${playerId}${i}`, cardId }));
    },
    reveal() { handRevealed = true; },
    /** Interrompt la boucle d'affichage de l'IA (tests, avance rapide). */
    haltAI() { aiToken += 1; aiRunning = false; setAIBanner(false); },
    render,
  };

  renderCover();
  syncModeInputs();
  renderCardGallery();
  renderHelpTable();

  $$('.mode-switch button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.mode-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      syncModeInputs();
    });
  });

  $$('.seat-toggle').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-seat]');
      if (!btn) return;
      [...group.querySelectorAll('button')].forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const input = group.parentElement.querySelector('input');
      const i = $$('.player-row').indexOf(group.parentElement);
      input.placeholder = btn.dataset.seat === 'ai' ? `Ordinateur ${i + 1}` : `Joueur ${i + 1}`;
    });
  });

  $('#btn-start').addEventListener('click', startGame);
  $('#btn-help-home').addEventListener('click', () => showScreen('screen-help'));
  $('#btn-help-back').addEventListener('click', () => showScreen(game ? 'screen-game' : 'screen-home'));
  $('#btn-help-game').addEventListener('click', () => showScreen('screen-help'));

  $('#btn-log').addEventListener('click', () => { renderLog(); openOverlay('overlay-log'); });
  $('#btn-quit').addEventListener('click', () => {
    if (game.turnPhase !== 'over' && !confirm('Abandonner la partie en cours ?')) return;
    retourAccueil();
  });

  $('#hand-scroll').addEventListener('click', (e) => {
    if (aiRunning) return;
    const btn = e.target.closest('[data-uid]');
    if (!btn) return;
    // Une carte injouable ne peut pas être choisie : la toucher, c'est vouloir la
    // lire. On ouvre sa fiche plutôt que de se contenter d'un refus.
    if (btn.classList.contains('card--muted')) {
      openCardSheet(btn.dataset.card);
      return;
    }
    selectCard(btn.dataset.uid);
  });

  // La carte exposée se lit d'une pression, comme celles de la main.
  const lirePileExposee = () => {
    const top = game?.pileDeJeu[game.pileDeJeu.length - 1];
    if (top) openCardSheet(top.cardId);
  };
  $('#pile-slot').addEventListener('click', lirePileExposee);
  $('#pile-slot').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lirePileExposee(); }
  });

  $('#btn-read').addEventListener('click', () => {
    const p = activePlayer(game);
    const card = p && game.hands[p.id].find((c) => c.uid === selectedUid);
    if (card) openCardSheet(card.cardId);
  });

  $('#btn-play').addEventListener('click', () => {
    if (aiRunning || game.turnPhase === 'over') return;
    doPlaySelected();
  });
  $('#btn-end').addEventListener('click', () => {
    if (aiRunning || game.pendingGoal) return;
    if (game.turnPhase === 'over') { retourAccueil(); return; }
    finishTurn();
  });

  $('#pass-reveal').addEventListener('click', revealHand);

  $('#discard-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-discard]');
    if (!btn) return;
    discardExcess(game, btn.dataset.discard);
    closeOverlay('overlay-discard');
    endTurn(game);
    selectedUid = null;
    handRevealed = false;
    render();
    openPassScreen();
  });

  $('#refuse-actions').addEventListener('click', (e) => {
    const play = e.target.closest('[data-refuse-player]');
    const skip = e.target.closest('[data-refuse-skip]');
    if (play) {
      const pid = play.dataset.refusePlayer;
      const card = game.hands[pid].find((c) => c.cardId === 'but_refuse');
      playButRefuseOutOfTurn(game, pid, card.uid);
      closeOverlay('overlay-refuse');
      flashMessage('But refusé', 'L\'arbitre annule le but. Le ballon revient au centre et vous relancez par une passe.', 'red');
      // La carte se joue hors tour : son auteur devient le joueur actif.
      poursuivreApresBut(pid);
      return;
    }
    if (skip) {
      const marqueur = game.pendingGoal?.playerId ?? null;
      confirmGoal(game);
      closeOverlay('overlay-refuse');
      flashMessage('But validé', 'Le marqueur ramasse la pile de jeu, complète sa main à huit cartes et rejoue immédiatement : le ballon est au centre, il relance par une passe.', 'ink');
      poursuivreApresBut(marqueur);
    }
  });

  $$('[data-close-overlay]').forEach((btn) => {
    btn.addEventListener('click', () => closeOverlay(btn.dataset.closeOverlay));
  });
}
