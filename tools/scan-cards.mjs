// tools/scan-cards.mjs — Recense les illustrations déposées dans assets/cards/
// et écrit le manifeste que l'application lit au démarrage.
//
// Le manifeste évite de tâtonner avec des requêtes qui échouent : l'application
// sait d'avance quelles cartes disposent d'une illustration et lesquelles
// retombent sur le dessin SVG.
//
// Usage : node tools/scan-cards.mjs
import { readdir, writeFile } from 'node:fs/promises';
import { CARD_ORDER } from '../js/deck.js';
import { ART_SLOTS } from '../js/art-slots.js';

const DIR = new URL('../assets/cards/', import.meta.url);
const EXTS = ['.webp', '.png', '.jpg', '.jpeg', '.svg'];
const ALL_SLOTS = [...CARD_ORDER, ...ART_SLOTS];

let files = [];
try {
  files = await readdir(DIR);
} catch {
  console.error('assets/cards/ est introuvable.');
  process.exit(1);
}

const found = {};
const unknown = [];

for (const file of files.sort()) {
  const dot = file.lastIndexOf('.');
  if (dot < 0) continue;
  const base = file.slice(0, dot);
  const ext = file.slice(dot).toLowerCase();
  if (!EXTS.includes(ext)) continue;
  if (!ALL_SLOTS.includes(base)) { unknown.push(file); continue; }
  // Une carte déjà pourvue garde la première extension trouvée dans l'ordre
  // de préférence (webp d'abord) : on ne veut pas de doublon silencieux.
  if (!found[base] || EXTS.indexOf(ext) < EXTS.indexOf(found[base].ext)) {
    found[base] = { file, ext };
  }
}

const pick = (ids) => Object.fromEntries(
  ids.filter((id) => found[id]).map((id) => [id, found[id].file])
);
const cards = pick(CARD_ORDER);
const art = pick(ART_SLOTS);

await writeFile(
  new URL('manifest.json', DIR),
  JSON.stringify({ cards, art }, null, 2) + '\n'
);

console.log(`Manifeste écrit.`);
console.log(`  cartes illustrées : ${Object.keys(cards).length}/${CARD_ORDER.length}`);
console.log(`  autres visuels    : ${Object.keys(art).length}/${ART_SLOTS.length}`);
const missingCards = CARD_ORDER.filter((id) => !cards[id]);
const missingArt = ART_SLOTS.filter((id) => !art[id]);
if (missingCards.length) console.log(`  dessin SVG conservé pour : ${missingCards.join(', ')}`);
if (missingArt.length) console.log(`  visuels encore en SVG/CSS : ${missingArt.join(', ')}`);
if (unknown.length) {
  console.log(`  ⚠ fichiers ignorés (nom hors deck) : ${unknown.join(', ')}`);
}
