# Sources d'origine (non versionnées)

Ce dossier accueille le matériel de référence : le scan du livret
(`canon_rg.pdf`) et les photos de la boîte, du plateau et des cartes.

**Il est volontairement absent du dépôt** (voir `.gitignore`). Le livret et les
cartes sont l'œuvre des Éditions Edmond Dujardin ; ce projet est une
reconstruction personnelle et n'a pas à en rediffuser le contenu.

Ces fichiers ne servent qu'à deux choses, toutes deux hors ligne :

- régénérer le kit d'illustrations (`npm run kit`) ;
- vérifier une règle ou un détail graphique pendant le développement.

L'application elle-même n'en dépend pas : `tools/build-site.sh` ne publie que
`index.html`, `css/`, `js/` et `assets/cards/`.

## Pour les remettre en place

Déposer ici les fichiers d'origine, avec leurs noms tels quels :

```
canon_rg.pdf
selected_image_1162996159401495761.jpg   (couverture de la boîte)
selected_image_2736927693930519049.jpg   (intérieur de boîte, dos des cartes)
selected_image_3205922158776452115.jpg   (couverture du livret)
selected_image_5667138468716070368.jpg   (plateau)
selected_image_8093748423783392546.jpg   (planche de cartes 1)
selected_image_8272358985945425724.jpg   (planche de cartes 2)
…et les autres photos du livret
```

Puis `npm run kit` reconstruit le briefing PDF et l'archive.
