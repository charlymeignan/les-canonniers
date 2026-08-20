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

const DIR = new URL('../assets/cards/', import.meta.url);
const EXTS = ['.webp', '.png', '.jpg', '.jpeg', '.svg'];

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
  if (!CARD_ORDER.includes(base)) { unknown.push(file); continue; }
  // Une carte déjà pourvue garde la première extension trouvée dans l'ordre
  // de préférence (webp d'abord) : on ne veut pas de doublon silencieux.
  if (!found[base] || EXTS.indexOf(ext) < EXTS.indexOf(found[base].ext)) {
    found[base] = { file, ext };
  }
}

const manifest = Object.fromEntries(
  CARD_ORDER.filter((id) => found[id]).map((id) => [id, found[id].file])
);

await writeFile(
  new URL('manifest.json', DIR),
  JSON.stringify({ cards: manifest }, null, 2) + '\n'
);

const covered = Object.keys(manifest).length;
console.log(`Manifeste écrit : ${covered}/${CARD_ORDER.length} cartes illustrées.`);
if (covered < CARD_ORDER.length) {
  const missing = CARD_ORDER.filter((id) => !manifest[id]);
  console.log(`  dessin SVG conservé pour : ${missing.join(', ')}`);
}
if (unknown.length) {
  console.log(`  ⚠ fichiers ignorés (nom hors deck) : ${unknown.join(', ')}`);
}
