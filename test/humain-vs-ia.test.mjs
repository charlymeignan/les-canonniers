// test/humain-vs-ia.test.mjs — Une partie humain contre ordinateur, pilotée
// depuis l'interface, du coup d'envoi jusqu'au bout.
//
// Ce test rejoue ce qu'un joueur fait réellement : il attend son tour, révèle sa
// main, pose une carte s'il le peut, se défausse sinon. Il échoue si la partie
// cesse de progresser — c'est-à-dire si l'interface enferme le joueur dans un
// tour dont il ne peut plus sortir.
//
// Usage : node test/humain-vs-ia.test.mjs   (serveur requis sur APP_URL)
import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://localhost:8123/index.html';
const TOURS_MAX = 400;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const erreurs = [];
page.on('pageerror', (e) => erreurs.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  const t = m.text();
  if (m.type() === 'error' && !/favicon|fonts\.googleapis|ERR_CONNECTION_RESET/.test(t)) {
    erreurs.push(`console: ${t}`);
  }
});

const etat = () => page.evaluate(() => {
  const g = window.__canonniers?.game;
  if (!g) return null;
  const j = g.players[g.currentPlayerIndex];
  return {
    joueur: j?.name, estIA: !!j?.isAI, phase: g.turnPhase,
    main: j ? g.hands[j.id].length : 0,
    talon: g.talon.length, defausse: g.defausse.length, pile: g.pileDeJeu.length,
    histoire: g.history.length,
    // Mesure de progression : ce qui reste en circulation ne peut que décroître.
    vivantes: g.talon.length + g.players.reduce((n, p) => n + g.hands[p.id].length, 0),
    aiRunning: !!document.querySelector('#ai-banner.is-on'),
  };
});

const visible = (sel) => page.isVisible(sel).catch(() => false);

/**
 * Page 11 : « Le joueur qui vient de marquer un but […] rejoue immédiatement. »
 * Vu de l'interface, cela veut dire : la main reste au marqueur, et s'il est
 * humain il voit ses cartes. Le symptôme du bug était l'inverse — des dos de
 * cartes et un seul bouton actif, la défausse.
 */
const apresBut = () => page.evaluate(() => {
  const g = window.__canonniers?.game;
  if (!g) return null;
  const dernier = [...g.history].reverse()
    .find((h) => ['goal-confirmed', 'goal-cancelled'].includes(h.type));
  if (!dernier) return null;
  const j = g.players[g.currentPlayerIndex];
  const scorer = g.players.find((pl) => pl.id === dernier.playerId);
  return {
    type: dernier.type,
    rang: g.history.filter((h) => h.type === 'goal-confirmed').length,
    marqueur: dernier.playerId ?? null,
    marqueurEstIA: !!scorer?.isAI,
    actif: j?.id ?? null,
    dosVisibles: document.querySelectorAll('.hand-scroll .card-back').length,
    fini: g.turnPhase === 'over',
  };
});

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(400);

// Configuration des sièges. Par défaut : joueur 1 humain, joueur 2 ordinateur.
// SEATS="human,human" rejoue la même partie en pass-and-play, sans ordinateur.
const SEATS = (process.env.SEATS || 'human,ai').split(',');
for (const [i, kind] of SEATS.entries()) {
  await page.click(`.player-row:nth-of-type(${i + 1}) button[data-seat="${kind}"]`)
    .catch(() => {});
}
await page.click('#btn-start');

let stagnation = 0;
let dernierVivantes = Infinity;
let coupsHumain = 0;
let blocage = null;
const butsObserves = [];
let dernierButVu = null;

for (let i = 0; i < TOURS_MAX; i++) {
  // On laisse l'ordinateur finir son tour avant de toucher à quoi que ce soit.
  for (let attente = 0; attente < 60; attente++) {
    const s = await etat();
    if (!s || (!s.aiRunning && !s.estIA)) break;
    await page.waitForTimeout(250);
  }

  const s = await etat();
  if (!s) break;
  if (s.phase === 'over') break;

  // Un but vient-il d'être marqué par l'humain ? Alors c'est encore à lui, main
  // visible. On ne juge que les buts marqués par l'humain : quand c'est
  // l'ordinateur qui marque, il a déjà enchaîné son coup d'envoi avant qu'on
  // puisse regarder, et la main a légitimement changé.
  const b = await apresBut();
  if (b && b.type === 'goal-confirmed' && b.marqueur && !b.marqueurEstIA
      && !b.fini && b.rang !== dernierButVu) {
    dernierButVu = b.rang;
    butsObserves.push({
      ...b,
      probleme: b.actif !== b.marqueur
        ? `la main a quitté le marqueur humain (${b.marqueur} → ${b.actif})`
        : (b.dosVisibles > 0
            ? `le marqueur humain ne voit que des dos de cartes (${b.dosVisibles})`
            : null),
    });
  }

  // Progression : le nombre de cartes en circulation doit finir par baisser.
  stagnation = s.vivantes < dernierVivantes ? 0 : stagnation + 1;
  dernierVivantes = Math.min(dernierVivantes, s.vivantes);
  if (stagnation > 12) {
    blocage = `plus aucune progression après ${i} tours : ${JSON.stringify(s)}`;
    break;
  }

  // Le joueur fait ce qu'un joueur ferait, dans l'ordre.
  if (await visible('#overlay-msg.is-open')) {
    await page.click('[data-close-overlay="overlay-msg"]', { timeout: 3000 }).catch(() => {});
    continue;
  }
  if (await visible('#overlay-refuse.is-open')) {
    await page.click('[data-refuse-skip]', { timeout: 3000 }).catch(() => {});
    continue;
  }
  if (await visible('#overlay-pass.is-open')) {
    await page.click('#pass-reveal', { timeout: 3000 }).catch(() => {});
    continue;
  }
  if (await visible('#overlay-discard.is-open')) {
    const cartes = await page.$$('#discard-grid [data-discard]');
    if (!cartes.length) { blocage = 'sélecteur de défausse vide'; break; }
    await cartes[0].click();
    continue;
  }
  if (s.estIA) continue;

  const jouable = await page.$('.hand-scroll .card--playable');
  if (jouable) {
    await jouable.click();
    await page.click('#btn-play', { timeout: 3000 }).catch(() => {});
    coupsHumain += 1;
  } else {
    // Rien à poser : le bouton doit mener quelque part, jamais rester sans effet.
    const avant = s.histoire;
    await page.click('#btn-end', { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(250);
    const apres = await etat();
    const bouge = apres.histoire !== avant
      || apres.joueur !== s.joueur
      || await visible('#overlay-discard.is-open');
    if (!bouge) {
      blocage = `« ${await page.textContent('#btn-end')} » sans effet : ${JSON.stringify(s)}`;
      break;
    }
  }
  await page.waitForTimeout(120);
}

const butsHumains = butsObserves.filter((b) => b.probleme);

// La fin de partie doit être un état visible, pas seulement un drapeau interne :
// un message qui l'annonce, et un bouton qui mène ailleurs. Sans cela le plateau
// reste en place et la partie a l'air de ne jamais s'achever.
const fin = await etat();
let finMuette = null;
if (fin?.phase === 'over') {
  const vu = await page.evaluate(() => ({
    message: document.querySelector('#overlay-msg.is-open')
      ? document.querySelector('#msg-head')?.textContent ?? '' : '',
    bouton: document.querySelector('#btn-end')?.textContent ?? '',
    poserActif: !document.querySelector('#btn-play')?.disabled,
  }));
  if (!/fin de la partie/i.test(vu.message)) {
    finMuette = `aucun message de fin affiché (bandeau : « ${vu.message || 'rien' } »)`;
  } else if (!/nouvelle partie/i.test(vu.bouton)) {
    finMuette = `le bouton principal affiche encore « ${vu.bouton} »`;
  } else if (vu.poserActif) {
    finMuette = 'on peut encore poser une carte après la fin de la partie';
  }
}
await browser.close();

console.log(`Partie ${SEATS.join(' contre ')}`);
console.log(`  coups joués par l'humain   ${coupsHumain}`);
console.log(`  état final                 ${JSON.stringify(fin)}`);

console.log(`  buts de l'humain observés  ${butsObserves.length}`);

let echec = false;
if (blocage) { console.error(`\nBLOCAGE — ${blocage}`); echec = true; }
if (butsHumains.length) {
  console.error('\nAprès un but, le marqueur ne rejoue pas comme le veut la page 11 :');
  butsHumains.forEach((b) => console.error(`  ${b.probleme}`));
  echec = true;
}
if (finMuette) { console.error(`\nFIN DE PARTIE — ${finMuette}`); echec = true; }
if (erreurs.length) {
  console.error('\nErreurs JS :');
  erreurs.forEach((e) => console.error('  ' + e));
  echec = true;
}
if (echec) process.exit(1);
console.log('\nLa partie a progressé sans jamais bloquer.');
