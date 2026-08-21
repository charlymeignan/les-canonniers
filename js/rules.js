// rules.js — Moteur de règles "Les Canonniers".
//
// SOURCE UNIQUE : docs/regles-reference.md, transcription verbatim du livret.
// Les tables ci-dessous reproduisent la « SUCCESSION DES CARTES » des pages 13
// à 16, sans reformulation ni synthèse. Toute divergence entre ce fichier et la
// transcription est un bug de ce fichier.
//
// Le tableau du livret croise DEUX critères, et non un seul :
//
//   1. la carte exposée — et, pour passe, interception, touche et coup de
//      chance, *qui* l'a posée : votre équipe ou vos adversaires ;
//   2. la position du ballon, vue du joueur qui doit jouer :
//        « LE BALLON EST DANS LE CAMP ADVERSE : ATTAQUEZ ! »  → clé `attaque`
//        « LE BALLON EST DANS VOTRE CAMP : RIPOSTEZ ! »        → clé `riposte`
//
// Les entrées `split: true` distinguent le poseur ; les autres valent quel que
// soit le poseur.

/** Parades des tirs imparables : « il n'y a pas d'autres parades possibles ». */
export const RESTRICTED_DEFENSE = ['arret', 'coup_de_chance'];

/**
 * Cartes dont l'attaque conclut par « BUT » et dont la défense est fermée aux
 * deux seules parades. Page 12 : « Penalty et coup franc direct ont les mêmes
 * pouvoirs que le boulet de canon. »
 */
export const UNSTOPPABLE = ['boulet_de_canon', 'penalty'];

export const SUCCESSION = {
  // ------------------------------------------------------------- page 13 ---
  passe: {
    split: true,
    own: {
      attaque: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
      riposte: ['contre_attaque', 'degagement', 'passe'],
    },
    rival: {
      attaque: ['faute', 'corner', 'interception', 'contre_attaque'],
      riposte: ['faute', 'touche', 'interception', 'contre_attaque'],
    },
  },

  interception: {
    split: true,
    own: {
      attaque: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
      riposte: ['contre_attaque', 'degagement', 'passe'], // « 2 passes de suite »
    },
    rival: {
      attaque: ['faute', 'interception'],
      riposte: ['faute', 'interception', 'contre_attaque'],
    },
  },

  // ------------------------------------------------------------- page 14 ---
  degagement: {
    // « doit être précédée d'une INTERCEPTION ou de TOUCHE »
    requiresPrev: ['interception', 'touche', 'sortie_de_but'],
    attaque: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
    riposte: ['contre_attaque', 'interception', 'touche', 'faute'],
  },

  contre_attaque: {
    attaque: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
    riposte: ['interception', 'touche', 'faute'],
  },

  tir_au_but: {
    attaque: ['but', 'boulet_de_canon', 'coup_de_chance'],
    riposte: ['interception', 'contre_attaque', 'arret', 'coup_de_chance',
              'sortie_de_but', 'hors_jeu', 'faute'],
  },

  boulet_de_canon: {
    attaque: ['but'],
    riposte: RESTRICTED_DEFENSE,
    restricted: true,
  },

  coup_de_chance: {
    // « Un coup de chance peut remplacer un tir au but. Jouez : BUT »
    // « Le coup de chance a été joué par votre équipe : il peut remplacer un
    //   arrêt et vaut dégagement. Si le coup de chance a été joué par les
    //   adversaires, jouez : arrêt, ou un autre coup de chance. »
    split: true,
    own: {
      attaque: ['but'],
      riposte: ['interception', 'contre_attaque'], // il valait dégagement
    },
    rival: {
      attaque: ['but'],
      riposte: ['arret', 'coup_de_chance'],
    },
  },

  // ------------------------------------------------------------- page 15 ---
  but: {
    special: 'goal',
    attaque: [],                 // « BRAVO ! Ramassez la pile de jeu… »
    riposte: ['but_refuse'],     // « Votre seule possibilité : Jouer BUT REFUSÉ »
    outOfTurnRival: true,
  },

  arret: {
    // « 1 arrêt vaut dégagement : le ballon change de camp. »
    attaque: ['interception', 'contre_attaque'],
    riposte: [],
  },

  sortie_de_but: {
    // Abattue par la défense sur un tir manqué : « Raté ! » s'adresse à
    // l'attaquant, « Vous devez jouer DÉGAGEMENT » à celui qui l'a posée.
    split: true,
    own:   { attaque: ['degagement'], riposte: ['degagement'] },
    rival: { attaque: [], riposte: [] },
    forced: 'degagement',
  },

  but_refuse: {
    // « Si vous avez joué "but refusé", le ballon est remis en jeu : jouez
    // "passe", et attaquez à votre tour. » La cellule se lit sur le poseur, pas
    // sur la position du ballon — lequel est au centre à cet instant, ce qui ne
    // désignerait aucune des deux colonnes.
    special: 'cancel-goal',
    split: true,
    own:   { attaque: ['passe'], riposte: ['passe'] },
    rival: { attaque: [], riposte: [] }, // « tant pis pour vous ! »
  },

  touche: {
    split: true,
    own: {
      // « vous reprenez le contrôle du ballon »
      attaque: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
      riposte: ['degagement', 'contre_attaque', 'passe'],
    },
    rival: {
      attaque: ['interception', 'faute'],
      riposte: ['contre_attaque', 'interception', 'faute'],
    },
  },

  // ------------------------------------------------------------- page 16 ---
  corner: {
    attaque: ['tir_au_but', 'passe'],
    riposte: ['interception', 'faute', 'contre_attaque'],
  },

  hors_jeu: {
    // « Le HORS-JEU, qui ne peut être joué que par les adversaires menacés, vous
    // a été imposé » s'adresse à l'attaquant signalé ; « Jouez obligatoirement :
    // Coup franc (indirect) » à la défense qui l'a posé. C'est donc elle qui
    // botte — comme pour la faute.
    split: true,
    own:   { attaque: ['coup_franc'], riposte: ['coup_franc'] },
    rival: { attaque: [], riposte: [] },
    forced: 'coup_franc',
    freeKickMode: 'indirect',
  },

  faute: {
    // La carte est abattue par l'équipe qui SUBIT la faute, et c'est elle qui
    // botte. Page 10 : « l'adversaire blanc qui doit jouer entre temps
    // s'empare du ballon en abattant : soit faute, ou deux fautes coup sur
    // coup, qui seront suivies d'une sanction : coup franc ou penalty ». Elle y
    // figure au même rang que « touche suivie de dégagement » ou
    // « contre-attaque » : ce sont les manières de reprendre le ballon.
    // Page 7 le confirme en décrivant la séquence d'un seul camp : « une carte
    // faute exposée sera suivie d'un coup franc indirect, lui-même suivi d'un
    // tir au but, puis d'un but ».
    //
    // L'équipe sanctionnée, elle, n'a rien à jouer : la faute lui coupe l'action.
    split: true,
    own: {
      // 1 seule faute → coup franc indirect, quelle que soit la colonne.
      attaque: ['coup_franc'],
      riposte: ['coup_franc'],
    },
    rival: { attaque: [], riposte: [] },
    // 2 fautes coup sur coup → coup franc direct, et penalty côté attaque
    // (« commises par les défenseurs », donc le botteur attaquait déjà).
    doubleAttaque: ['coup_franc', 'penalty'],
    doubleRiposte: ['coup_franc'],
    chainable: 'faute',          // « 2 fautes coup sur coup »
  },

  coup_franc: {
    modes: {
      indirect: {
        attaque: ['tir_au_but', 'boulet_de_canon', 'passe'],
        riposte: ['interception', 'contre_attaque', 'touche'],
      },
      direct: {
        attaque: ['but'],
        riposte: RESTRICTED_DEFENSE,
        restricted: true,
      },
    },
  },

  penalty: {
    attaque: ['but'],
    riposte: RESTRICTED_DEFENSE,
    restricted: true,
  },
};

// ---------------------------------------------------------------- helpers ---

/** Le ballon est-il dans le camp de l'équipe qui doit jouer ? */
function ballInOwnCamp(state) {
  return state.ballCamp === state.activeTeamId;
}

/**
 * Colonne du tableau à lire pour l'équipe active.
 * Ballon dans le camp adverse → on attaque ; ballon dans son camp → on riposte.
 * Au centre (coup d'envoi, reprise après but), on attaque.
 */
function colonne(state) {
  return ballInOwnCamp(state) ? 'riposte' : 'attaque';
}

/**
 * La carte posée rend-elle la main avant que le but puisse être marqué ?
 *
 * Page 10 : « ce sera à son coéquipier vert de marquer le but […] si
 * l'adversaire blanc **qui doit jouer entre temps** ne s'empare pas du ballon ».
 * Le tireur ne conclut donc jamais lui-même dans la foulée.
 *
 * Le « coup de chance » est l'exception, énoncée deux fois : « Le joueur vert
 * possède coup de chance et but : **il marque** » (page 10), et « interdiction
 * de marquer un but tout de suite, **sauf si la carte coup de chance
 * intervient** » (page 11).
 */
export function threatensGoal(cardId, freeKickMode = null) {
  if (cardId === 'coup_de_chance') return false;
  if (cardId === 'coup_franc') return freeKickMode === 'direct';
  return cardId === 'tir_au_but' || UNSTOPPABLE.includes(cardId);
}

/**
 * Combien de parades l'équipe qui défend a-t-elle déjà posées sur le tir en
 * cours ? Page 12 : un boulet de canon « ne peut être stoppé que par deux
 * arrêts successifs, ou un arrêt suivi d'un coup de chance ».
 */
export function paradesPosees(state) {
  let n = 0;
  for (let i = state.pileDeJeu.length - 1; i >= 0; i--) {
    const c = state.pileDeJeu[i];
    if (RESTRICTED_DEFENSE.includes(c.cardId)) { n += 1; continue; }
    break;
  }
  return n;
}

/** La dernière carte exposée est-elle un tir imparable encore non stoppé ? */
function tirImparableEnCours(state) {
  for (let i = state.pileDeJeu.length - 1; i >= 0; i--) {
    const c = state.pileDeJeu[i];
    if (RESTRICTED_DEFENSE.includes(c.cardId)) continue;
    if (UNSTOPPABLE.includes(c.cardId)) return c;
    if (c.cardId === 'coup_franc' && state.freeKickMode === 'direct') return c;
    return null;
  }
  return null;
}

// ------------------------------------------------------------------ table ---

/**
 * Cartes légales pour l'équipe active, d'après la table des pages 13 à 16.
 *
 * @param {object} state - doit porter pileDeJeu, activeTeamId, ballCamp,
 *   freeKickMode, consecutiveFautes, pendingGoal.
 * @returns {{legalIds: string[], reason: string, colonne: string,
 *            restricted?: boolean, freeKickMode?: string, forced?: string}}
 */
export function getLegalCardIds(state) {
  const top = state.pileDeJeu[state.pileDeJeu.length - 1];
  const col = colonne(state);

  // Coup d'envoi : « il doit commencer la pile de jeu par une carte passe ».
  if (!top) return { legalIds: ['passe'], reason: 'coup-envoi', colonne: col };

  // Fenêtre « but refusé » : seule riposte possible au but qui vient d'être posé.
  if (top.cardId === 'but' && state.pendingGoal) {
    return { legalIds: ['but_refuse'], reason: 'fenetre-but-refuse', colonne: 'riposte' };
  }

  const def = SUCCESSION[top.cardId];
  if (!def) return { legalIds: [], reason: 'inconnu', colonne: col };

  const parLeurEquipe = top.teamId === state.activeTeamId;

  // Un tir imparable déjà entamé : tant que les deux parades ne sont pas
  // posées, la défense peut encore parer et l'attaque peut encore conclure.
  const imparable = tirImparableEnCours(state);
  if (imparable) {
    const parades = paradesPosees(state);
    if (parades >= 2) {
      // « 2 arrêts coup sur coup, ou 1 arrêt et 1 coup de chance » : le tir est
      // stoppé, l'arrêt vaut dégagement et la main revient au camp qui a paré.
      const arret = SUCCESSION.arret;
      const pareParMoi = state.pileDeJeu[state.pileDeJeu.length - 1].teamId === state.activeTeamId;
      return {
        legalIds: pareParMoi ? arret.attaque : arret.riposte,
        reason: 'tir-stoppe', colonne: col,
      };
    }
    const attaquant = imparable.teamId === state.activeTeamId;
    return attaquant
      ? { legalIds: ['but'], reason: 'attaque', colonne: col, restricted: false }
      : { legalIds: [...RESTRICTED_DEFENSE], reason: 'parade', colonne: col, restricted: true };
  }

  // Coup franc : son mode est fixé par la sanction qui l'a provoqué.
  if (top.cardId === 'coup_franc') {
    const mode = state.freeKickMode || 'indirect';
    const branche = def.modes[mode];
    return {
      legalIds: [...(parLeurEquipe ? branche.attaque : branche.riposte)],
      reason: parLeurEquipe ? 'attaque' : 'riposte',
      colonne: col,
      restricted: !!branche.restricted && !parLeurEquipe,
      freeKickMode: mode,
    };
  }

  // Faute : la sanction revient à l'équipe qui a abattu la carte, c'est-à-dire à
  // celle qui subit la faute (page 10). L'équipe sanctionnée n'a rien à jouer.
  if (top.cardId === 'faute') {
    if (!parLeurEquipe) return { legalIds: [], reason: 'sanctionne', colonne: col };
    const doublee = state.consecutiveFautes >= 2;
    const sanction = doublee
      ? (col === 'attaque' ? def.doubleAttaque : def.doubleRiposte)
      : def.own[col];
    // Une seconde faute aggrave la sanction ; il n'y en a pas de troisième.
    return {
      legalIds: doublee ? [...sanction] : [...sanction, def.chainable],
      reason: 'sanction',
      colonne: col,
      freeKickMode: doublee ? 'direct' : 'indirect',
    };
  }

  // Cartes dont la table distingue qui les a posées.
  const branche = def.split ? (parLeurEquipe ? def.own : def.rival) : def;
  let ids = [...(branche[col] || [])];

  // Note : deux mentions du livret sont plus restrictives que les cellules du
  // tableau qui les contredisent — « Corner : ne peut être joué que si
  // l'adversaire possède le ballon » alors que la cellule passe/adverse/attaquez
  // l'offre, et « Dégagement doit être précédée d'une INTERCEPTION ou de TOUCHE »
  // alors que plusieurs cellules l'offrent après une passe. Ce sont les
  // cellules qui font foi : elles énumèrent les coups situation par situation,
  // là où les mentions en tête de ligne décrivent le cas général. Voir
  // docs/regles-implementees.md.

  return {
    legalIds: ids,
    reason: parLeurEquipe ? 'attaque' : 'riposte',
    colonne: col,
    forced: def.forced,
    freeKickMode: def.freeKickMode,
  };
}

/** Une carte donnée est-elle jouable par l'équipe active ? */
export function isLegalPlay(state, cardId) {
  return getLegalCardIds(state).legalIds.includes(cardId);
}

// ------------------------------------------------------- ballon (page 12) ---

/**
 * Le ballon change-t-il de camp ? Transcription directe de « Mouvements du
 * ballon », page 12, complétée par les mentions « le ballon change de camp »
 * portées dans le tableau des pages 13 à 16.
 *
 * @param {object} state - état AVANT la pose (pileDeJeu sans la carte jouée)
 * @param {string} cardId - carte que l'on pose
 * @param {string} teamId - équipe qui la pose
 */
export function changesCamp(state, cardId, teamId) {
  const pile = state.pileDeJeu;
  const top = pile[pile.length - 1];
  const precedent = (n) => pile[pile.length - n];

  // Coup d'envoi et reprise après but : « le ballon passe dans le camp adverse ».
  if (!top && cardId === 'passe') return true;
  if (top?.cardId === 'but_refuse' && cardId === 'passe') return true;

  // 1 - « Si une équipe expose la carte contre-attaque. »
  if (cardId === 'contre_attaque') return true;

  // « 1 arrêt vaut dégagement : le ballon change de camp. »
  if (cardId === 'arret') return true;

  // « Sortie de but : vous devez jouer DÉGAGEMENT ; le ballon change de camp. »
  // « Dégagement : le ballon change de camp. »
  if (cardId === 'degagement') return true;

  // 2 - « interception, suivie de dégagement, boulet de canon, ou deux passes
  //      successives » — le dégagement est déjà couvert ci-dessus.
  if (top?.cardId === 'interception' && cardId === 'boulet_de_canon') return true;
  // top est precedent(1) ; la carte qui le précède est donc precedent(2).
  if (cardId === 'passe' && top?.cardId === 'passe' && precedent(2)?.cardId === 'interception') {
    return true;
  }

  // 3 - « Après une touche, suivie de passe, ou dégagement, ou contre-attaque. »
  if (top?.cardId === 'touche' && ['passe', 'contre_attaque'].includes(cardId)) return true;

  // 4 - « Si l'équipe menacée (le ballon étant alors dans son propre camp) joue
  //   faute ou double faute, sanctionnée par coup franc. » L'équipe menacée est
  //   celle qui abat la carte : elle botte, et le coup franc la dégage.
  //
  //   Les deux cellules de la page 16 disent la même chose, vues du botteur :
  //     « (faute commise par les défenseurs) Jouez : coup franc indirect. »
  //        → rien sur le ballon, le botteur attaquait déjà ;
  //     « (commises par les attaquants) Jouez : coup franc indirect.
  //        Le ballon change de camp. »
  //        → le botteur subissait dans son camp, l'action se renverse.
  if (['coup_franc', 'penalty'].includes(cardId) && top?.cardId === 'faute') {
    return state.ballCamp === teamId;
  }

  // « Hors-jeu : jouez obligatoirement coup franc indirect. Le ballon change de
  //   camp. »
  if (cardId === 'coup_franc' && top?.cardId === 'hors_jeu') return true;

  return false;
}

/** Effets de la pose d'une carte : score, annulation, mouvement du ballon. */
export function resolvePlay(state, cardId, teamId) {
  return {
    scored: cardId === 'but' ? teamId : null,
    cancelledGoal: cardId === 'but_refuse',
    changesCamp: changesCamp(state, cardId, teamId),
    resetCenter: cardId === 'but_refuse',
  };
}
