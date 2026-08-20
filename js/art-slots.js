// art-slots.js — Emplacements d'illustrations qui ne correspondent pas à une carte.
//
// Comme pour les cartes, déposer un fichier portant l'un de ces noms dans
// assets/cards/ le substitue au dessin par défaut. Partagé entre l'application
// et tools/scan-cards.mjs pour qu'il n'y ait qu'une seule liste de référence.

export const ART_SLOTS = [
  'cover',        // le tireur de la couverture de la boîte (écran d'accueil)
  'dos-de-carte', // le motif bleu au dos des cartes (talon, main masquée)
];
