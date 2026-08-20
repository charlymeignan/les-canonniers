// test/ui.test.mjs — Test d'intégration de l'interface dans un vrai navigateur.
// Vérifie que les parcours principaux fonctionnent et qu'aucune erreur JS ne
// survient : démarrage, tour humain, tour de l'ordinateur, partie ordinateur
// contre ordinateur menée jusqu'à son terme.
//
// Usage : node test/ui.test.mjs   (nécessite un serveur sur APP_URL)
import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://localhost:8123/index.html';
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  const t = m.text();
  if (m.type() === 'error' && !/favicon|fonts\.googleapis|ERR_CONNECTION_RESET/.test(t)) {
    errors.push(`console: ${t}`);
  }
});

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(300);

console.log('Interface');

await test('l’accueil propose un siège humain ou ordinateur par joueur', async () => {
  const toggles = await page.$$('.seat-toggle');
  assert(toggles.length === 4, `4 sélecteurs attendus, ${toggles.length} trouvés`);
});

await test('humain contre ordinateur : la partie démarre et l’humain voit sa main', async () => {
  // Joueur 1 humain (défaut), joueur 2 ordinateur (défaut).
  await page.click('#btn-start');
  await page.waitForTimeout(300);

  // Si c'est l'ordinateur qui a le coup d'envoi, on attend qu'il joue.
  const passVisible = await page.isVisible('#overlay-pass');
  if (!passVisible) {
    await page.waitForSelector('#overlay-pass.is-open', { timeout: 15000 });
  }
  await page.click('#pass-reveal');
  await page.waitForTimeout(300);

  const cards = await page.$$('.hand-scroll .card');
  assert(cards.length >= 8, `main d'au moins 8 cartes attendue, ${cards.length} trouvée(s)`);
  const owner = await page.textContent('#hand-owner');
  assert(owner && owner.length > 0, 'le nom du joueur actif doit être affiché');
});

await test('l’ordinateur joue son tour tout seul', async () => {
  // On force une main jouable puis on rend la main : l'ordinateur doit enchaîner.
  const before = await page.evaluate(() => window.__canonniers.game.history.length);
  await page.evaluate(() => {
    const api = window.__canonniers;
    const p = api.game.players[api.game.currentPlayerIndex];
    api.setHand(p.id, ['passe', 'interception', 'faute', 'arret', 'but', 'touche', 'corner', 'degagement']);
    api.render();
  });
  await page.click('#btn-end'); // fin du tour humain -> l'ordinateur prend la main
  await page.waitForTimeout(6000);

  // L'ordinateur a pu marquer : la fenêtre « but refusé » s'ouvre alors et
  // attend la décision de l'humain. C'est le comportement attendu.
  if (await page.isVisible('#overlay-refuse.is-open')) {
    await page.click('[data-refuse-skip]');
    await page.waitForTimeout(400);
    await page.click('[data-close-overlay="overlay-msg"]').catch(() => {});
  }

  const after = await page.evaluate(() => window.__canonniers.game.history.length);
  assert(after > before, 'l’ordinateur n’a produit aucun coup');
});

await test('ordinateur contre ordinateur : la partie va jusqu’à son terme', async () => {
  // page.reload() plutôt que window.location.reload() : sans cela, les
  // interactions suivantes portent encore sur le contexte de la page précédente.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  // Les deux sièges en ordinateur.
  const rows = await page.$$('.player-row');
  for (const row of rows.slice(0, 2)) {
    await row.$eval('.seat-toggle button[data-seat="ai"]', (b) => b.click());
  }
  await page.click('#btn-start');
  await page.waitForTimeout(500);

  // On coupe le déroulé pas-à-pas (qui prendrait plusieurs minutes) et on
  // déroule la partie d'un trait.
  const finished = await page.evaluate(async () => {
    const { runAITurns } = await import('./js/match.js');
    window.__canonniers.haltAI();
    const g = window.__canonniers.game;
    runAITurns(g, { maxTurns: 3000 });
    window.__canonniers.render();
    return { phase: g.turnPhase, winner: g.winner, vert: g.teams.vert.score, blanc: g.teams.blanc.score };
  });

  assert(finished.phase === 'over', `partie non terminée (phase : ${finished.phase})`);
  assert(finished.winner !== null, 'aucun vainqueur désigné');
  console.log(`     → ${finished.winner === 'nul' ? 'match nul' : `victoire ${finished.winner}`}, `
    + `${finished.vert}-${finished.blanc}`);
});

await test('l’interface reste cohérente après la partie', async () => {
  const score = await page.textContent('#score-vert .score-value');
  assert(/^\d+$/.test(score.trim()), `score vert illisible : "${score}"`);
});

await browser.close();

if (errors.length) {
  console.error('\nErreurs JS détectées :');
  errors.forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log(`\n${passed} test(s) d'interface réussi(s). Aucune erreur JS.`);
