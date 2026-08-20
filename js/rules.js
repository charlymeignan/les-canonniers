// rules.js — Moteur de règles "Les Canonniers".
// Table de succession transcrite dans docs/regles-implementees.md à partir des pages
// 12 à 15 du livret et du texte imprimé sur les cartes elles-mêmes (listes noir/rouge).
//
// Convention : pour une carte exposée, "own" = cartes que l'équipe qui vient de la
// poser peut jouer pour poursuivre l'action ; "rival" = cartes que l'équipe adverse
// peut jouer pour riposter. Le joueur actif doit piocher/poser depuis la liste qui
// correspond à la relation de son équipe avec l'équipe propriétaire de la carte
// exposée.

export const RESTRICTED_DEFENSE = ['arret', 'coup_de_chance'];

// mode: 'indirect' | 'direct' détermine la sous-table de coup_franc.
export const SUCCESSION = {
  passe: {
    own: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'contre_attaque', 'degagement', 'passe'],
    rival: ['faute', 'touche', 'interception', 'contre_attaque'],
    campChangeOn: 'rival',
  },
  contre_attaque: {
    own: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
    rival: ['interception', 'touche', 'faute'],
    campChangeOn: 'own',
  },
  interception: {
    own: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe', 'degagement'],
    rival: ['faute', 'interception', 'contre_attaque'],
    campChangeOn: 'none',
  },
  degagement: {
    requiresPrev: ['interception', 'touche'],
    own: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
    rival: ['contre_attaque', 'interception', 'touche', 'faute'],
    campChangeOn: 'own',
  },
  touche: {
    own: ['tir_au_but', 'coup_de_chance', 'boulet_de_canon', 'passe'],
    rival: ['degagement', 'contre_attaque', 'interception', 'faute'],
    campChangeOn: 'rival',
  },
  tir_au_but: {
    own: ['but', 'boulet_de_canon', 'coup_de_chance'],
    rival: ['interception', 'contre_attaque', 'arret', 'coup_de_chance', 'sortie_de_but', 'hors_jeu', 'faute'],
    campChangeOn: 'none',
  },
  boulet_de_canon: {
    own: ['but'],
    rival: RESTRICTED_DEFENSE,
    restrictedRival: true,
    campChangeOn: 'none',
  },
  coup_de_chance: {
    own: ['but'],
    rival: RESTRICTED_DEFENSE,
    campChangeOn: 'none',
    dualUse: true, // peut aussi être joué comme tir_au_but (attaque) ou arret (défense)
  },
  but: {
    special: 'goal',
    rival: ['but_refuse'],
    outOfTurnRival: true,
  },
  but_refuse: {
    special: 'cancel-goal',
    own: ['passe'],
    campChangeOn: 'reset',
  },
  arret: {
    own: ['interception', 'contre_attaque'],
    rival: [],
    campChangeOn: 'own', // "l'arrêt vaut dégagement"
  },
  sortie_de_but: {
    own: ['degagement'],
    rival: [],
    forcedOwn: 'degagement',
    campChangeOn: 'own',
  },
  hors_jeu: {
    own: [],
    rival: ['coup_franc'],
    rivalFreeKickMode: 'indirect',
    campChangeOn: 'rival',
  },
  faute: {
    own: [],
    rival: ['coup_franc'],
    rivalFreeKickMode: 'indirect', // recalculé en 'direct' si 2 fautes coup sur coup (voir rules engine)
    campChangeOn: 'rival',
  },
  coup_franc: {
    modes: {
      indirect: {
        own: ['tir_au_but', 'boulet_de_canon', 'passe'],
        rival: ['interception', 'contre_attaque', 'touche'],
      },
      direct: {
        own: ['but'],
        rival: RESTRICTED_DEFENSE,
        restrictedRival: true,
      },
    },
    campChangeOn: 'none',
  },
  penalty: {
    own: ['but'],
    rival: RESTRICTED_DEFENSE,
    restrictedRival: true,
    campChangeOn: 'none',
  },
  corner: {
    own: ['tir_au_but', 'passe'],
    rival: ['interception', 'faute', 'contre_attaque'],
    campChangeOn: 'none',
  },
  carte_vierge: {
    joker: true,
  },
};

/**
 * Détermine, pour une carte exposée et une équipe active, la liste des cartes
 * légales à jouer (avant filtrage par la main du joueur).
 *
 * @param {object} state - état de partie (voir state.js)
 * @returns {{legalIds: string[], reason: string, freeKickMode?: string}}
 */
export function getLegalCardIds(state) {
  const top = state.pileDeJeu[state.pileDeJeu.length - 1];
  if (!top) {
    // Aucune carte posée encore : seul un coup d'envoi "passe" est valide.
    return { legalIds: ['passe', 'carte_vierge'], reason: 'coup-envoi' };
  }

  const topDef = SUCCESSION[top.cardId];
  const isOwnTeam = top.teamId === state.activeTeamId;

  // Fenêtre spéciale : un "but" vient d'être posé, seule la carte but_refuse
  // (jouable hors tour par l'équipe qui vient d'encaisser) est valide.
  if (top.cardId === 'but' && state.pendingGoal) {
    return { legalIds: ['but_refuse', 'carte_vierge'], reason: 'fenetre-but-refuse' };
  }

  if (topDef?.special === 'cancel-goal') {
    // Après but_refuse, l'équipe qui l'a joué relance comme à un coup d'envoi.
    return { legalIds: ['passe', 'carte_vierge'], reason: 'relance-but-refuse' };
  }

  if (!topDef) return { legalIds: ['carte_vierge'], reason: 'inconnu' };

  // Coup franc : le mode (indirect/direct) est fixé par ce qui précède
  // (hors-jeu ou faute simple => indirect ; 2 fautes coup sur coup => direct).
  if (top.cardId === 'coup_franc') {
    const mode = state.freeKickMode || 'indirect';
    const branch = topDef.modes[mode];
    const ids = isOwnTeam ? branch.own : branch.rival;
    return {
      legalIds: [...ids, 'carte_vierge'],
      reason: isOwnTeam ? 'own' : 'rival',
      restricted: !!branch.restrictedRival && !isOwnTeam,
      freeKickMode: mode,
    };
  }

  // Faute : détermine si on est sur une 2e faute consécutive de la même équipe
  // fautive (=> coup franc direct ou penalty au choix), sinon indirect.
  if (top.cardId === 'faute') {
    if (isOwnTeam) return { legalIds: ['carte_vierge'], reason: 'own-none' };
    const doubleFaute = state.consecutiveFautes >= 2;
    const ids = doubleFaute ? ['coup_franc', 'penalty'] : ['coup_franc'];
    return { legalIds: [...ids, 'carte_vierge'], reason: 'rival', freeKickMode: doubleFaute ? 'direct' : 'indirect' };
  }

  if (top.cardId === 'hors_jeu') {
    if (isOwnTeam) return { legalIds: ['carte_vierge'], reason: 'own-none' };
    return { legalIds: ['coup_franc', 'carte_vierge'], reason: 'rival', freeKickMode: 'indirect' };
  }

  const rawIds = isOwnTeam ? (topDef.own || []) : (topDef.rival || []);
  const restricted = !isOwnTeam && !!topDef.restrictedRival;

  // "Corner" (page 13) : « ne peut être joué que si l'adversaire possède le
  // ballon », c'est-à-dire chaque fois que l'équipe active doit riposter face à
  // l'équipe qui a l'initiative — quelle que soit la carte exposée précisément.
  // Exception : boulet de canon / coup franc direct / penalty ont une défense
  // fermée (« il n'y a pas d'autres parades possibles ») — corner n'y coupe pas.
  const ids = !isOwnTeam && !restricted ? [...rawIds, 'corner'] : rawIds;

  return { legalIds: [...ids, 'carte_vierge'], reason: isOwnTeam ? 'own' : 'rival', restricted };
}

/** Vérifie qu'une carte donnée peut être posée dans l'état courant par l'équipe active. */
export function isLegalPlay(state, cardId) {
  const { legalIds } = getLegalCardIds(state);
  if (cardId === 'coup_de_chance') {
    // Usage double : légal partout où tir_au_but (attaque) ou arret (défense) le sont.
    if (legalIds.includes('coup_de_chance')) return true;
    if (legalIds.includes('tir_au_but') || legalIds.includes('arret')) return true;
    return false;
  }
  return legalIds.includes(cardId);
}

/** Résout les effets d'une carte jouée : changement de camp, score, etc. */
export function resolvePlay(state, cardId, teamId) {
  const effects = { changesCamp: false, scored: null, cancelledGoal: false };
  const def = SUCCESSION[cardId];

  if (cardId === 'but') {
    effects.scored = teamId;
    return effects;
  }
  if (cardId === 'but_refuse') {
    effects.cancelledGoal = true;
    return effects;
  }
  if (!def) return effects;

  const isOwn = !state.pileDeJeu.length ? true : state.pileDeJeu[state.pileDeJeu.length - 1].teamId === teamId;
  if (def.campChangeOn === 'own' && isOwn) effects.changesCamp = true;
  if (def.campChangeOn === 'rival' && !isOwn) effects.changesCamp = true;
  if (def.campChangeOn === 'reset') effects.resetCenter = true;
  if (cardId === 'contre_attaque') effects.changesCamp = true;
  if (cardId === 'passe' && !isOwn) effects.changesCamp = true;

  return effects;
}
