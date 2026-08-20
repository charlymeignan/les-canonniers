// test/screenshot.mjs — Captures d'écran mobiles pour la passe de fidélité visuelle,
// et vérification qu'aucune erreur JS ne survient sur les parcours principaux.
//
// Les mains sont scénarisées via window.__canonniers pour que les captures soient
// reproductibles au lieu de dépendre du hasard de la distribution.
//
// Usage : node test/screenshot.mjs [outDir]
import { chromium } from 'playwright';

const OUT = process.argv[2] || '/tmp/shots';
const URL = process.env.APP_URL || 'http://localhost:8123/index.html';

// L'environnement fournit un Chromium pré-installé dont la révision peut différer
// de celle attendue par le paquet playwright : on pointe explicitement le binaire.
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  const t = m.text();
  // Les polices Google et l'absence de favicon ne sont pas des erreurs applicatives.
  if (m.type() === 'error' && !/favicon|fonts\.googleapis|ERR_CONNECTION_RESET/.test(t)) {
    errors.push(`console: ${t}`);
  }
});

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

/** Ferme le bandeau d'information s'il est ouvert (il bloque les clics). */
async function fermerMessage() {
  if (await page.isVisible('#overlay-msg.is-open')) {
    await page.click('[data-close-overlay="overlay-msg"]', { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
}

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
await shot('01-accueil');

// Écran de règles : en-tête, table de succession, galerie du deck.
await page.click('#btn-help-home');
await page.waitForTimeout(250);
await shot('02-regles');
await page.evaluate(() => document.querySelector('#card-gallery').scrollIntoView());
await page.waitForTimeout(250);
await shot('03-deck');
await page.evaluate(() => document.querySelector('.help-table').scrollIntoView());
await page.waitForTimeout(250);
await shot('04-succession');

// Partie : écran de passage d'appareil puis table de jeu.
await page.click('#btn-help-back');
await page.click('#btn-start');
await page.waitForTimeout(250);
await shot('05-passage');

await page.click('#pass-reveal');
await page.waitForTimeout(300);

// Main scénarisée : coup d'envoi jouable à coup sûr.
await page.evaluate(() => {
  const api = window.__canonniers;
  const p = api.game.players[api.game.currentPlayerIndex];
  api.setHand(p.id, ['passe', 'tir_au_but', 'but', 'faute', 'arret', 'corner', 'interception', 'degagement']);
  api.render();
});
await page.waitForTimeout(200);
await shot('06-coup-envoi');

// On pose la passe : la consigne et la pile doivent suivre.
await page.click('.hand-scroll .card--playable');
await page.click('#btn-play');
await page.waitForTimeout(300);
await fermerMessage();
await shot('07-passe-posee');

await fermerMessage();

// Défense restreinte : on expose un boulet de canon et on regarde la consigne.
await page.evaluate(() => {
  const api = window.__canonniers;
  const g = api.game;
  const shooter = g.players[0];
  const keeper = g.players[1];
  g.pileDeJeu = [{ uid: 'x', cardId: 'boulet_de_canon', teamId: shooter.teamId, playerId: shooter.id }];
  g.currentPlayerIndex = 1;
  api.setHand(keeper.id, ['arret', 'coup_de_chance', 'interception', 'faute', 'passe', 'but', 'touche', 'corner']);
  api.reveal();
  api.render();
});
await page.waitForTimeout(250);
await shot('09-defense-restreinte');

// Fenêtre "but refusé" : l'adversaire détient la carte au moment du but.
await page.evaluate(() => {
  const api = window.__canonniers;
  const g = api.game;
  g.pileDeJeu = [{ uid: 'y', cardId: 'tir_au_but', teamId: g.players[0].teamId, playerId: g.players[0].id }];
  g.currentPlayerIndex = 0;
  api.setHand(g.players[0].id, ['but']);
  api.setHand(g.players[1].id, ['but_refuse']);
  api.reveal();
  api.render();
});
await fermerMessage();
await page.click('.hand-scroll .card--playable');
await page.click('#btn-play');
await page.waitForTimeout(350);
await shot('10-but-refuse');

// Tour de l'ordinateur : bandeau d'attente pendant qu'il joue.
await page.click('[data-refuse-skip]', { timeout: 1500 }).catch(() => {});
await page.waitForTimeout(200);
await page.click('[data-close-overlay="overlay-msg"]', { timeout: 1500 }).catch(() => {});
await page.evaluate(() => {
  const api = window.__canonniers;
  api.game.players.forEach((p) => { p.isAI = true; });
  api.render();
});
await page.click('#btn-end', { timeout: 1500 }).catch(() => {});
await page.waitForTimeout(1100);
await shot('11-ordinateur');
await page.evaluate(() => window.__canonniers.haltAI());

// Journal de partie.
await page.click('[data-close-overlay="overlay-msg"]', { timeout: 1500 }).catch(() => {});
await page.click('#btn-log');
await page.waitForTimeout(250);
await shot('12-journal');

await browser.close();

if (errors.length) {
  console.error('Erreurs JS détectées :');
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log(`Captures écrites dans ${OUT}. Aucune erreur JS.`);
