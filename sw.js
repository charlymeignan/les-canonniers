// sw.js — Service worker : l'application s'installe et se joue hors ligne.
//
// Le jeu n'a pas de serveur : tout tient dans une poignée de fichiers statiques.
// Deux régimes suffisent.
//
//   - La coquille (page, styles, modules, icônes) est mise en cache à
//     l'installation, puis servie depuis le réseau quand il répond et depuis le
//     cache sinon. On garde ainsi une version fraîche sans jamais dépendre du
//     réseau pour lancer une partie.
//   - Le reste — illustrations des cartes, polices Google — est mis en cache au
//     premier passage et resservi depuis le cache ensuite. Ces fichiers ne
//     changent pas d'une version à l'autre, inutile de les redemander.
//
// Le numéro de version ci-dessous est la seule chose à incrémenter pour forcer
// la mise à jour d'un appareil déjà équipé.

const VERSION = 'canonniers-v1';
const COQUILLE = `${VERSION}-coquille`;
const DEPOT = `${VERSION}-depot`;

// Chemins relatifs au service worker, donc au dossier de l'application : le jeu
// fonctionne aussi bien à la racine d'un domaine que dans un sous-dossier
// GitHub Pages.
const A_PRECHARGER = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/main.js',
  './js/ui.js',
  './js/state.js',
  './js/rules.js',
  './js/match.js',
  './js/ai.js',
  './js/deck.js',
  './js/art-slots.js',
  './js/assets-mapping.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(COQUILLE);
    // addAll échoue en bloc dès qu'un fichier manque ; on tolère les absents
    // pour qu'un renommage n'empêche pas l'installation.
    await Promise.all(A_PRECHARGER.map((url) => cache.add(url).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms
      .filter((n) => !n.startsWith(VERSION))
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/** Réseau d'abord, cache en secours : pour tout ce qui peut changer. */
async function reseauPuisCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const reponse = await fetch(request);
    if (reponse && reponse.ok) cache.put(request, reponse.clone());
    return reponse;
  } catch (err) {
    const garde = await cache.match(request)
      ?? await cache.match('./index.html');
    if (garde) return garde;
    throw err;
  }
}

/** Cache d'abord : pour ce qui ne change pas — images, polices. */
async function cachePuisReseau(request, cacheName) {
  const cache = await caches.open(cacheName);
  const garde = await cache.match(request);
  if (garde) return garde;
  try {
    const reponse = await fetch(request);
    // Les polices Google répondent en mode opaque : on les garde quand même,
    // c'est tout ce qui permet de les afficher hors ligne.
    if (reponse && (reponse.ok || reponse.type === 'opaque')) {
      cache.put(request, reponse.clone());
    }
    return reponse;
  } catch (err) {
    return secours(request);
  }
}

/**
 * Réponse de repli quand le réseau manque et que rien n'est en cache.
 *
 * Intercepter une requête engage à y répondre : laisser l'erreur remonter la
 * ferait échouer plus durement que sans service worker. Pour la feuille de
 * styles Google Fonts, une feuille vide suffit — la pile de polices locale
 * déclarée dans style.css prend le relais, sans un mot dans la console.
 */
function secours(request) {
  const url = new URL(request.url);
  if (url.hostname === 'fonts.googleapis.com') {
    return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
  }
  return new Response('', { status: 504, statusText: 'Hors ligne' });
}

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const memeOrigine = url.origin === self.location.origin;

  if (!memeOrigine) {
    // Seules les polices sont attendues de l'extérieur ; le reste passe droit.
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
      e.respondWith(cachePuisReseau(request, DEPOT));
    }
    return;
  }

  const estCoquille = request.mode === 'navigate'
    || /\.(html|css|js|webmanifest)$/.test(url.pathname);

  e.respondWith(estCoquille
    ? reseauPuisCache(request, COQUILLE)
    : cachePuisReseau(request, DEPOT));
});
