// test/pwa.test.mjs — L'application est-elle installable, et jouable hors ligne ?
//
// Trois choses à établir, dans cet ordre : le manifeste est valide et complet,
// le service worker prend la main, et la page se recharge alors que le réseau
// est coupé. La troisième est la seule qui compte vraiment — les deux premières
// ne font que dire pourquoi elle échouerait.
//
// Usage : node test/pwa.test.mjs   (serveur requis sur APP_URL)
import { chromium } from 'playwright';

const URL = process.env.APP_URL || 'http://localhost:8123/index.html';
const RACINE = URL.replace(/index\.html$/, '');

let echecs = 0;
function verifie(nom, condition, detail = '') {
  if (condition) { console.log(`  ok - ${nom}`); return; }
  console.error(`FAIL - ${nom}${detail ? `\n       ${detail}` : ''}`);
  echecs += 1;
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const contexte = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await contexte.newPage();

console.log('Manifeste');
const manifeste = await (await page.request.get(`${RACINE}manifest.webmanifest`)).json();
verifie('nom, nom court, description', !!(manifeste.name && manifeste.short_name && manifeste.description));
verifie('display standalone', manifeste.display === 'standalone', `display = ${manifeste.display}`);
verifie('couleurs de thème et de fond', !!(manifeste.theme_color && manifeste.background_color));
verifie('start_url et scope', !!(manifeste.start_url && manifeste.scope));

const tailles = manifeste.icons.map((i) => i.sizes);
verifie('icônes 192 et 512', tailles.includes('192x192') && tailles.includes('512x512'), tailles.join(', '));
verifie('icône maskable', manifeste.icons.some((i) => (i.purpose || '').includes('maskable')));

for (const icone of manifeste.icons) {
  const r = await page.request.get(RACINE + icone.src);
  verifie(`${icone.src} servie`, r.ok(), `HTTP ${r.status()}`);
}
const apple = await page.request.get(`${RACINE}assets/icons/apple-touch-icon.png`);
verifie('apple-touch-icon servie', apple.ok(), `HTTP ${apple.status()}`);

console.log('\nDéclaration dans la page');
await page.goto(URL, { waitUntil: 'domcontentloaded' });
verifie('lien vers le manifeste', await page.locator('link[rel=manifest]').count() === 1);
verifie('couleur de thème', await page.locator('meta[name=theme-color]').count() === 1);
verifie('apple-touch-icon déclarée', await page.locator('link[rel=apple-touch-icon]').count() === 1);

console.log('\nService worker');
const pret = await page.evaluate(() => navigator.serviceWorker.ready
  .then((r) => !!r.active).catch(() => false));
verifie('enregistré et actif', pret);

// On attend que la coquille soit réellement en cache avant de couper le réseau :
// l'installation est asynchrone, la couper trop tôt ne prouverait rien.
const enCache = await page.evaluate(async () => {
  for (let i = 0; i < 40; i++) {
    const noms = await caches.keys();
    for (const nom of noms) {
      const c = await caches.open(nom);
      if (await c.match('./index.html') || await c.match(new URL('index.html', location.href).href)) {
        return true;
      }
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
});
verifie('coquille mise en cache', enCache);

console.log('\nHors ligne');
await contexte.setOffline(true);
let erreurRechargement = null;
try {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
} catch (err) {
  erreurRechargement = err.message.split('\n')[0];
}
verifie('la page se recharge sans réseau', !erreurRechargement, erreurRechargement ?? '');

if (!erreurRechargement) {
  await page.waitForTimeout(500);
  await page.click('#btn-start');
  await page.waitForTimeout(500);
  const enPartie = await page.evaluate(() => {
    const g = window.__canonniers?.game;
    return !!g && g.players.length > 0 && g.talon.length > 0;
  });
  verifie('une partie démarre hors ligne', enPartie);
}
await contexte.setOffline(false);
await browser.close();

if (echecs) { console.error(`\n${echecs} vérification(s) en échec.`); process.exit(1); }
console.log('\nL’application est installable et jouable hors ligne.');
