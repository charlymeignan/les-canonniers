#!/usr/bin/env bash
# Assemble dans _site/ ce que le navigateur charge réellement.
#
# Utilisé à l'identique par GitHub Actions et par les hébergeurs statiques
# (Netlify, Cloudflare Pages). Le point important : ces hébergeurs publient par
# défaut la racine du dépôt, ce qui exposerait assets/user-files/ — le scan du
# livret et les photos du matériel. On ne publie donc qu'une liste explicite.
set -euo pipefail

rm -rf _site
mkdir -p _site/assets

cp index.html manifest.webmanifest sw.js _site/
cp -r css js _site/
cp -r assets/cards assets/icons _site/assets/

# Empêche GitHub Pages de faire passer le site par Jekyll.
touch _site/.nojekyll

echo "_site/ assemblé :"
du -sh _site
