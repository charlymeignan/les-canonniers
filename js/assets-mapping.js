// assets-mapping.js — Pictogrammes et illustrations SVG.
//
// Les dessins ci-dessous sont de NOUVELLES illustrations, réalisées dans l'esprit
// graphique du matériel photographié dans le kit (aplats francs cernés de noir,
// silhouettes sportives allongées, gamme de couleurs très limitée, maillots à
// larges bandes horizontales) — ce ne sont pas des reproductions des dessins
// imprimés d'origine.
//
// Technique : chaque personnage est un petit squelette (épaules, bassin, coudes,
// genoux, pieds) rendu en traits épais à bouts ronds, doublés d'un liseré noir.
// Cela reproduit le trait plein et souple des illustrations imprimées sans
// recourir à des tracés dessinés à la main.

export const PALETTE = {
  cream: '#f2ecd8',
  paper: '#fbf7ea',
  ink: '#171310',
  red: '#b5312f',
  green: '#1b6b3d',
  gold: '#d3a03c',
  goldDark: '#a97b23',
  navy: '#213e73',
  skin: '#e0a86b',
  white: '#f7f4ea',
};

const P = PALETTE;
const OUTLINE = P.ink;

// Les SVG sont injectés inline dans un même document : les identifiants de
// clipPath doivent être uniques, sinon la première définition rencontrée
// s'applique à toutes les cartes affichées en même temps.
let uid = 0;
const nextId = (prefix) => `${prefix}${++uid}`;

function svg(inner, viewBox = '0 0 100 100') {
  return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${inner}</svg>`;
}

// ---------------------------------------------------------------- primitives --

/** Membre : polyligne épaisse cernée de noir (bouts ronds). */
function limb(points, width, color) {
  const d = 'M' + points.map(([x, y]) => `${x} ${y}`).join(' L ');
  return `<path d="${d}" fill="none" stroke="${OUTLINE}" stroke-width="${width + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Chaussure : petit sabot noir orienté le long du dernier segment. */
function boot([x, y], angle = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})">
    <path d="M-2 -1 L7 -1.4 Q10 -1.4 10 1.6 L-2 2.4 Z" fill="${OUTLINE}"/>
  </g>`;
}

/**
 * Ballon de football : aplat or cerné de noir, coutures en or foncé — c'est le
 * ballon de cuir clair aimanté qu'on voit sur les photos du plateau, pas une
 * balle contemporaine à panneaux noirs.
 */
function ball(cx, cy, r) {
  const seam = Math.max(0.7, r * 0.075);
  const q = r * 0.34;
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="${P.gold}" stroke="${OUTLINE}" stroke-width="${Math.max(1.2, r * 0.1)}"/>
    <g fill="none" stroke="${P.goldDark}" stroke-width="${seam}" stroke-linecap="round">
      <path d="M${-r * 0.94} ${-q} L${r * 0.94} ${-q} M${-r * 0.94} ${q} L${r * 0.94} ${q}"/>
      <path d="M${-q} ${-r * 0.94} L${-q} ${r * 0.94} M${q} ${-r * 0.94} L${q} ${r * 0.94}"/>
    </g>
  </g>`;
}

/** Filet de but : maillage fin, en fond d'illustration. */
function net(x, y, w, h, color = P.green) {
  const step = 6;
  const id = nextId('net');
  let lines = '';
  for (let i = -h; i < w; i += step) {
    lines += `<line x1="${x + i}" y1="${y}" x2="${x + i + h}" y2="${y + h}"/>`;
    lines += `<line x1="${x + i + h}" y1="${y}" x2="${x + i}" y2="${y + h}"/>`;
  }
  return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs>
  <g stroke="${color}" stroke-width="0.7" opacity="0.65" clip-path="url(#${id})">
    ${lines}
  </g>
  <path d="M${x} ${y + h} L${x} ${y} L${x + w} ${y} L${x + w} ${y + h}" fill="none" stroke="${OUTLINE}" stroke-width="2.4"/>`;
}

/** Cage vue de face, en rouge (pictogramme des cartes "sortie de but"/"but refusé"). */
function goalPictogram(struck) {
  const mesh = [];
  for (let i = 1; i < 4; i++) mesh.push(`<line x1="${16 + i * 17}" y1="26" x2="${16 + i * 17}" y2="66"/>`);
  for (let i = 1; i < 3; i++) mesh.push(`<line x1="16" y1="${26 + i * 13.3}" x2="84" y2="${26 + i * 13.3}"/>`);
  return `
    <g stroke="${P.red}" stroke-width="3" opacity="0.75">${mesh.join('')}</g>
    <path d="M16 68 L16 26 L84 26 L84 68" fill="none" stroke="${P.red}" stroke-width="7" stroke-linejoin="miter"/>
    ${struck ? `<g stroke="${P.red}" stroke-width="9" stroke-linecap="round"><line x1="12" y1="18" x2="88" y2="74"/><line x1="88" y1="18" x2="12" y2="74"/></g>` : ''}`;
}

// -------------------------------------------------------------- personnages --

const KITS = {
  // Maillots relevés sur les photos : cerclé vert/blanc/rouge, rouge uni,
  // vert uni, noir de l'arbitre.
  cercle: { hoops: [P.green, P.white, P.red], shorts: P.white, socks: [P.green, P.red] },
  rouge: { hoops: [P.red], shorts: P.white, socks: [P.red, P.green] },
  vert: { hoops: [P.green], shorts: P.ink, socks: [P.green, P.green] },
  gardienRouge: { hoops: [P.red], shorts: P.ink, socks: [P.ink, P.ink] },
  gardienVert: { hoops: [P.green], shorts: P.ink, socks: [P.ink, P.ink] },
  arbitre: { hoops: [P.ink], shorts: P.ink, socks: [P.green, P.green] },
  hair: P.ink,
};

/**
 * Dessine un personnage à partir d'un squelette.
 * Les points sont en coordonnées du viewBox ; l'ordre de dessin place le bras
 * et la jambe "arrière" derrière le torse.
 */
function figure(spec) {
  const {
    head, headR = 7.5, neck, hip,
    armBack, armFront, legBack, legFront,
    kit = KITS.cercle, hairAngle = 0, ball: heldBall = null,
    shoulderW = 13, hipW = 10, limbW = 5.2,
  } = spec;

  const [nx, ny] = neck;
  const [hx, hy] = hip;

  // Torse : quadrilatère épaules → bassin, rempli des bandes du maillot.
  const dx = hx - nx, dy = hy - ny;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len, py = dx / len; // normale
  const torso = [
    [nx + px * shoulderW / 2, ny + py * shoulderW / 2],
    [nx - px * shoulderW / 2, ny - py * shoulderW / 2],
    [hx - px * hipW / 2, hy - py * hipW / 2],
    [hx + px * hipW / 2, hy + py * hipW / 2],
  ];
  const torsoD = 'M' + torso.map(([x, y]) => `${x} ${y}`).join(' L ') + ' Z';

  const hoops = kit.hoops;
  const clipId = nextId('torso');
  let torsoFill = '';
  if (hoops.length === 1) {
    torsoFill = `<path d="${torsoD}" fill="${hoops[0]}"/>`;
  } else {
    // Bandes horizontales perpendiculaires à l'axe du torse.
    const bands = [];
    const n = 5;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const c = hoops[i % hoops.length];
      const a = [nx + dx * t0, ny + dy * t0];
      const b = [nx + dx * t1, ny + dy * t1];
      bands.push(`<path d="M${a[0] + px * 12} ${a[1] + py * 12} L${a[0] - px * 12} ${a[1] - py * 12} L${b[0] - px * 12} ${b[1] - py * 12} L${b[0] + px * 12} ${b[1] + py * 12} Z" fill="${c}"/>`);
    }
    torsoFill = `<defs><clipPath id="${clipId}"><path d="${torsoD}"/></clipPath></defs>
      <g clip-path="url(#${clipId})">${bands.join('')}</g>`;
  }

  const shortsTop = [nx + dx * 0.82, ny + dy * 0.82];
  const shorts = `<path d="M${shortsTop[0] + px * (hipW / 2 + 1.6)} ${shortsTop[1] + py * (hipW / 2 + 1.6)}
      L${shortsTop[0] - px * (hipW / 2 + 1.6)} ${shortsTop[1] - py * (hipW / 2 + 1.6)}
      L${hx - px * (hipW / 2 + 2.4)} ${hy - py * (hipW / 2 + 2.4)}
      L${hx + px * (hipW / 2 + 2.4)} ${hy + py * (hipW / 2 + 2.4)} Z"
      fill="${kit.shorts}" stroke="${OUTLINE}" stroke-width="2"/>`;

  const legPart = (pts, sock) => {
    if (!pts) return '';
    const thigh = [[hx, hy], pts[0]];
    const shin = [pts[0], pts[1]];
    const ang = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) * 180 / Math.PI;
    return limb(thigh, limbW + 0.8, P.skin) + limb(shin, limbW - 0.4, sock) + boot(pts[1], ang);
  };

  const armPart = (pts) => pts ? limb([[nx, ny], pts[0], pts[1]], limbW - 1.1, P.skin) : '';

  return `
  <g>
    ${legPart(legBack, kit.socks[1])}
    ${armPart(armBack)}
    <path d="${torsoD}" fill="${P.white}"/>
    ${torsoFill}
    <path d="${torsoD}" fill="none" stroke="${OUTLINE}" stroke-width="2.2" stroke-linejoin="round"/>
    ${shorts}
    ${legPart(legFront, kit.socks[0])}
    ${armPart(armFront)}
    <circle cx="${head[0]}" cy="${head[1]}" r="${headR}" fill="${P.skin}" stroke="${OUTLINE}" stroke-width="2.2"/>
    <g transform="rotate(${hairAngle} ${head[0]} ${head[1]})">
      <circle cx="${head[0] + headR * 0.34}" cy="${head[1] + headR * 0.08}" r="${headR * 0.11}" fill="${OUTLINE}"/>
      <path d="M${head[0] + headR * 0.18} ${head[1] + headR * 0.5} q${headR * 0.3} ${headR * 0.18} ${headR * 0.55} ${-headR * 0.04}"
            fill="none" stroke="${OUTLINE}" stroke-width="${headR * 0.13}" stroke-linecap="round"/>
      <path d="M${head[0] - headR} ${head[1] - headR * 0.25}
               a${headR} ${headR} 0 0 1 ${headR * 2} 0
               q${-headR * 0.5} ${-headR * 0.45} ${-headR} ${-headR * 0.2}
               q${-headR * 0.5} ${-headR * 0.25} ${-headR} ${headR * 0.2} Z"
            fill="${KITS.hair}"/>
    </g>
    ${heldBall ? ball(heldBall[0], heldBall[1], heldBall[2] ?? 8) : ''}
  </g>`;
}

// Squelettes : chaque pose est décrite une fois, puis réutilisée.
const POSES = {
  // Passe : appui sur la jambe gauche, jambe droite en fin de frappe.
  passe: (kit) => figure({
    kit, head: [54, 20], neck: [52, 30], hip: [48, 60],
    armBack: [[36, 40], [26, 34]], armFront: [[64, 42], [72, 33]],
    legBack: [[42, 78], [40, 94]], legFront: [[62, 72], [78, 78]],
    hairAngle: -12,
  }),
  // Interception : course lancée, buste en avant, ballon dégagé du pied.
  course: (kit) => figure({
    kit, head: [60, 20], neck: [56, 30], hip: [44, 58],
    armBack: [[42, 42], [30, 50]], armFront: [[68, 38], [80, 28]],
    legBack: [[36, 76], [22, 84]], legFront: [[58, 72], [72, 86]],
    hairAngle: -18,
  }),
  // Tir au but : buste incliné en arrière, jambe de frappe très haute.
  tir: (kit) => figure({
    kit, head: [40, 24], neck: [45, 33], hip: [54, 60],
    armBack: [[34, 44], [24, 52]], armFront: [[58, 40], [70, 30]],
    legBack: [[52, 80], [46, 95]], legFront: [[70, 56], [86, 46]],
    hairAngle: 14,
  }),
  // Boulet de canon : retourné acrobatique, corps à l'horizontale.
  retourne: (kit) => figure({
    kit, head: [30, 62], neck: [40, 58], hip: [66, 50],
    armBack: [[36, 74], [26, 82]], armFront: [[34, 44], [20, 38]],
    legBack: [[80, 62], [92, 72]], legFront: [[78, 34], [90, 22]],
    hairAngle: 96,
  }),
  // Touche : rentrée, bras au-dessus de la tête, ballon à deux mains.
  touche: (kit) => figure({
    kit, head: [50, 30], neck: [50, 40], hip: [50, 66],
    armBack: [[38, 28], [44, 14]], armFront: [[62, 28], [56, 14]],
    legBack: [[42, 82], [38, 96]], legFront: [[58, 82], [64, 96]],
    ball: [50, 10, 8],
  }),
  // Coup de chance : le ballon file, le joueur bascule en arrière.
  chance: (kit) => figure({
    kit, head: [62, 30], neck: [56, 38], hip: [42, 58],
    armBack: [[46, 26], [42, 14]], armFront: [[70, 44], [82, 40]],
    legBack: [[34, 74], [22, 82]], legFront: [[50, 78], [52, 94]],
    hairAngle: 22,
  }),
  // Coup franc : reprise de la tête, ballon au-dessus du front.
  tete: (kit) => figure({
    kit, head: [52, 26], neck: [50, 35], hip: [46, 62],
    armBack: [[36, 44], [26, 52]], armFront: [[64, 46], [76, 52]],
    legBack: [[40, 80], [34, 95]], legFront: [[58, 78], [66, 94]],
    ball: [66, 18, 9], hairAngle: -8,
  }),
  // Dégagement : demi-volée, jambe d'appui tendue.
  degagement: (kit) => figure({
    kit, head: [44, 22], neck: [47, 32], hip: [52, 60],
    armBack: [[36, 42], [26, 36]], armFront: [[62, 44], [74, 50]],
    legBack: [[46, 80], [42, 95]], legFront: [[70, 62], [86, 56]],
    hairAngle: 8,
  }),
  // Faute : le fauché part en vrille.
  chute: (kit) => figure({
    kit, head: [70, 56], neck: [62, 54], hip: [38, 52],
    armBack: [[64, 68], [58, 80]], armFront: [[70, 42], [80, 34]],
    legBack: [[24, 62], [12, 70]], legFront: [[26, 40], [14, 32]],
    hairAngle: 84,
  }),
  // Gardien : détente vers le haut, ballon capté à deux mains.
  gardienHaut: (kit) => figure({
    kit, head: [50, 34], neck: [50, 44], hip: [50, 68],
    armBack: [[40, 30], [46, 16]], armFront: [[60, 30], [54, 16]],
    legBack: [[42, 82], [34, 94]], legFront: [[58, 84], [66, 96]],
    ball: [50, 12, 8.5],
  }),
  // Gardien battu : plongeon à l'horizontale, ballon hors d'atteinte.
  gardienPlonge: (kit) => figure({
    kit, head: [26, 44], neck: [36, 46], hip: [64, 52],
    armBack: [[26, 56], [14, 60]], armFront: [[22, 36], [10, 30]],
    legBack: [[78, 62], [90, 68]], legFront: [[80, 44], [94, 40]],
    hairAngle: 100,
  }),
  // Arbitre : bras levé, sifflet à la bouche.
  arbitre: (kit) => figure({
    kit, head: [46, 24], neck: [48, 34], hip: [50, 62],
    armBack: [[38, 46], [32, 58]], armFront: [[60, 30], [68, 10]],
    legBack: [[44, 80], [42, 96]], legFront: [[58, 80], [60, 96]],
    hairAngle: -6,
  }),
  // Arbitre qui sanctionne : bras tendu vers le point de réparation.
  arbitrePointe: (kit) => figure({
    kit, head: [46, 26], neck: [48, 36], hip: [50, 62],
    armBack: [[38, 48], [32, 60]], armFront: [[62, 40], [80, 36]],
    legBack: [[44, 80], [40, 96]], legFront: [[58, 80], [62, 96]],
  }),
  // Joueur qui proteste : buste penché en avant, bras écartés.
  proteste: (kit) => figure({
    kit, head: [54, 26], neck: [52, 36], hip: [48, 62],
    armBack: [[38, 48], [30, 58]], armFront: [[64, 48], [72, 58]],
    legBack: [[42, 80], [38, 96]], legFront: [[56, 80], [60, 96]],
    hairAngle: -14,
  }),
};

function whistle(x, y) {
  return `<g><path d="M${x} ${y} l7 -4" stroke="${OUTLINE}" stroke-width="1.4" fill="none"/>
    <text x="${x + 9}" y="${y - 4}" font-size="9" font-family="'Bitter',Georgia,serif" font-style="italic" fill="${OUTLINE}">tuiit</text></g>`;
}

function sparks(cx, cy, scale = 1) {
  const star = (dx, dy, s) => `<path transform="translate(${cx + dx} ${cy + dy}) scale(${s * scale})" fill="${P.gold}" stroke="${OUTLINE}" stroke-width="1" d="M0 -9 L2.6 -2.7 L9 -2.7 L3.8 1.4 L5.6 8 L0 4 L-5.6 8 L-3.8 1.4 L-9 -2.7 L-2.6 -2.7 Z"/>`;
  return star(0, 0, 1) + star(-14, 8, 0.7) + star(12, 10, 0.55);
}

function motionLines(x, y, len = 26, count = 3, spread = 5) {
  return `<g stroke="${OUTLINE}" stroke-width="1.2" opacity="0.85">${
    Array.from({ length: count }, (_, i) =>
      `<line x1="${x}" y1="${y + i * spread}" x2="${x - len}" y2="${y + i * spread + i * 2}"/>`
    ).join('')}</g>`;
}

// ---------------------------------------------------------- API illustrations --

export function illustration(name) {
  switch (name) {
    case 'ballon-fleches': // contre-attaque : le ballon change de camp
      return svg(`
        <path d="M50 4 L62 24 L54 24 L54 34 L46 34 L46 24 L38 24 Z" fill="${OUTLINE}"/>
        <path d="M50 96 L38 76 L46 76 L46 66 L54 66 L54 76 L62 76 Z" fill="${OUTLINE}"/>
        ${ball(50, 50, 16)}`);

    case 'passe':
      return svg(POSES.passe(KITS.cercle) + ball(24, 82, 7));

    case 'interception':
      return svg(POSES.course(KITS.cercle) + ball(20, 88, 7) + motionLines(34, 74, 26, 3, 4));

    case 'tir-au-but':
      return svg(`${net(6, 40, 30, 34, P.green)}${POSES.tir(KITS.cercle)}${ball(20, 58, 7)}`);

    case 'boulet-de-canon':
      return svg(POSES.retourne(KITS.vert) + ball(96, 16, 6) + motionLines(88, 26, 22, 3, 4));

    case 'touche':
      return svg(POSES.touche(KITS.vert));

    case 'coup-de-chance':
      return svg(POSES.chance(KITS.rouge) + ball(24, 92, 8) + sparks(30, 76, 0.55));

    case 'coup-franc':
      return svg(POSES.tete(KITS.vert));

    case 'degagement':
      return svg(POSES.degagement(KITS.vert) + ball(94, 52, 7) + motionLines(86, 56, 22, 3, 4));

    case 'faute':
      return svg(POSES.chute(KITS.rouge) + sparks(76, 42, 0.75) + ball(18, 76, 7));

    case 'arret':
      return svg(`${net(14, 8, 72, 74, P.green)}${POSES.gardienHaut(KITS.gardienRouge)}`);

    case 'penalty':
      return svg(`${net(8, 10, 84, 62, P.ink)}${POSES.gardienHaut(KITS.gardienVert)}`);

    case 'sortie-de-but':
      return svg(`${net(52, 8, 44, 78, P.green)}${POSES.gardienPlonge(KITS.gardienRouge)}${ball(92, 20, 7)}`);

    case 'but':
      return svg(`${POSES.gardienPlonge(KITS.gardienVert)}${ball(88, 14, 9)}${sparks(24, 24, 0.6)}`);

    case 'hors-jeu':
      return svg(POSES.arbitre(KITS.arbitre) + whistle(54, 30) +
        `<path d="M22 88 q16 -7 34 -1" stroke="${P.green}" stroke-width="6" fill="none" stroke-linecap="round"/>`);

    case 'but-refuse':
      return svg(`
        <g transform="translate(-16 6) scale(0.86)">${POSES.proteste(KITS.vert)}</g>
        <g transform="translate(30 6) scale(0.86)">${POSES.arbitrePointe(KITS.arbitre)}</g>`);

    case 'corner':
      return svg(`
        <line x1="14" y1="88" x2="14" y2="12" stroke="${OUTLINE}" stroke-width="2.6"/>
        <path d="M15 14 L44 22 L15 30 Z" fill="${P.red}" stroke="${OUTLINE}" stroke-width="1.8"/>
        <g transform="translate(16 10) scale(0.8)">${POSES.tete(KITS.cercle)}</g>`);

    default:
      return '';
  }
}

// ------------------------------------------------------------------- icônes --

export function iconBallonCarre() {
  // Le carré noir au ballon or, exactement comme le coin des cartes "passe".
  return svg(`<rect width="100" height="100" fill="${OUTLINE}"/>${ball(50, 50, 33)}`);
}

export function iconCible() {
  return svg(`
    <circle cx="50" cy="50" r="36" fill="none" stroke="${P.green}" stroke-width="9"/>
    <circle cx="50" cy="50" r="20" fill="none" stroke="${P.green}" stroke-width="9"/>
    <circle cx="50" cy="50" r="6" fill="${P.green}"/>`);
}

export function iconTrefle() {
  const leaf = (rot) => `<ellipse cx="50" cy="31" rx="15" ry="18" fill="${P.green}" transform="rotate(${rot} 50 52)"/>`;
  return svg(`${leaf(0)}${leaf(90)}${leaf(180)}${leaf(270)}
    <path d="M50 62 q4 16 -8 26" fill="none" stroke="${P.green}" stroke-width="4"/>`);
}

export function iconFanion() {
  return svg(`
    <rect x="26" y="12" width="6" height="76" fill="${OUTLINE}"/>
    <path d="M32 14 L84 32 L32 50 Z" fill="${P.red}" stroke="${OUTLINE}" stroke-width="3"/>
    <text x="47" y="39" font-size="22" font-family="'Oswald',sans-serif" font-weight="700" fill="${P.paper}">T</text>`);
}

export function iconCage() { return svg(goalPictogram(false)); }
export function iconCageCroix() { return svg(goalPictogram(true)); }

export function iconArrowsVert() {
  return svg(`<g fill="${OUTLINE}">
    <path d="M50 6 L64 28 L56 28 L56 46 L44 46 L44 28 L36 28 Z"/>
    <path d="M50 94 L36 72 L44 72 L44 54 L56 54 L56 72 L64 72 Z"/>
  </g>`);
}

export const ICON_BUILDERS = {
  'ballon-carre': iconBallonCarre,
  cible: iconCible,
  trefle: iconTrefle,
  fanion: iconFanion,
  cage: iconCage,
  'cage-croix': iconCageCroix,
  'arrows-vertical': iconArrowsVert,
};

/**
 * Ballon autonome pour le plateau : sur la tôle, le ballon aimanté n'a pas de
 * cerne noir marqué — juste le cuir clair et ses coutures.
 */
export function ballSvg(r = 42) {
  const q = r * 0.34;
  return svg(`<g transform="translate(50 50)">
    <circle r="${r}" fill="${P.gold}" stroke="${P.goldDark}" stroke-width="${r * 0.06}"/>
    <g fill="none" stroke="${P.goldDark}" stroke-width="${r * 0.055}" stroke-linecap="round" opacity="0.85">
      <path d="M${-r * 0.94} ${-q} L${r * 0.94} ${-q} M${-r * 0.94} ${q} L${r * 0.94} ${q}"/>
      <path d="M${-q} ${-r * 0.94} L${-q} ${r * 0.94} M${q} ${-r * 0.94} L${q} ${r * 0.94}"/>
    </g>
  </g>`);
}
