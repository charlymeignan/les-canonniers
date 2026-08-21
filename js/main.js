// main.js — Point d'entrée de l'application.
import { bindUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  bindUI();
  enregistrerServiceWorker();
});

/**
 * Installe le service worker, qui rend l'application installable sur l'écran
 * d'accueil et jouable hors ligne.
 *
 * L'enregistrement est délibérément silencieux : il échoue en `file://`, dans
 * les navigateurs qui ne le gèrent pas et dans les onglets privés de certains
 * d'entre eux. Le jeu tourne très bien sans — c'est un supplément, jamais une
 * dépendance.
 */
function enregistrerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('../sw.js', import.meta.url))
      .catch(() => { /* pas de hors-ligne, pas de drame */ });
  });
}
