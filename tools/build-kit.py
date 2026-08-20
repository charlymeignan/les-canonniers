#!/usr/bin/env python3
"""Construit le kit d'illustrations à partir des sources du dépôt.

Principe : ne dégrader aucune source.
  - les photos du matériel sont copiées à l'octet près, sans recompression ;
  - les pages du livret sont extraites du PDF en récupérant les flux JPEG bruts,
    donc sans recompression non plus (1150 x 1638, bien plus net que les photos) ;
  - seules les vignettes de cartes sont recadrées, à leur résolution native et
    sans agrandissement, avec un cadrage resserré détecté automatiquement.

    python3 tools/build-kit.py            # écrit dans docs/kit-illustrations/
    python3 tools/build-kit.py --archive  # produit en plus une archive autonome

Dépendances : Pillow, numpy.
"""
import argparse
import io
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'user-files')
OUT = os.path.join(ROOT, 'docs', 'kit-illustrations')

PLANCHES = [
    dict(file='selected_image_8093748423783392546.jpg', rows=2, cols=4,
         top=0.12, bottom=1.0, left=0.0, right=0.85,
         names=['contre_attaque', 'arret', 'passe', 'coup_franc',
                'hors_jeu', 'sortie_de_but', 'but_refuse', 'interception']),
    dict(file='selected_image_8272358985945425724.jpg', rows=2, cols=5,
         top=0.13, bottom=1.0, left=0.0, right=1.0,
         names=['tir_au_but', 'boulet_de_canon', 'touche', 'coup_de_chance', None,
                'faute', 'corner', 'penalty', 'but', 'degagement']),
]

MATERIEL = {
    'selected_image_1162996159401495761.jpg': 'boite-couverture.jpg',
    'selected_image_5667138468716070368.jpg': 'plateau.jpg',
    'selected_image_2736927693930519049.jpg': 'interieur-boite-dos-de-cartes.jpg',
    'selected_image_3205922158776452115.jpg': 'livret-couverture.jpg',
    'selected_image_8093748423783392546.jpg': 'planche-cartes-1.jpg',
    'selected_image_8272358985945425724.jpg': 'planche-cartes-2.jpg',
}

PALETTE = [
    ('#171310', "noir d'encre"), ('#b5312f', 'rouge brique'),
    ('#1b6b3d', 'vert bouteille'), ('#d3a03c', 'ocre doré'),
    ('#e0a86b', 'chair'), ('#f2ecd8', 'crème carton'),
]


def boite_de_la_carte(tile):
    """Cadre resserré autour de la carte dans une vignette.

    Les cartes sont claires et peu colorées ; la table qui les porte est un ocre
    franc. On isole donc les pixels clairs et peu saturés, puis on prend la zone
    où ils sont majoritaires en ligne comme en colonne.
    """
    a = np.asarray(tile.convert('RGB'), dtype=np.int16)
    mx, mn = a.max(axis=2), a.min(axis=2)
    masque = (mx > 120) & ((mx - mn) < 60)

    def etendue(profil, seuil=0.35):
        actifs = np.nonzero(profil > seuil * profil.max())[0]
        return (int(actifs[0]), int(actifs[-1])) if actifs.size else None

    v = etendue(masque.mean(axis=0))   # colonnes
    h = etendue(masque.mean(axis=1))   # lignes
    if not v or not h:
        return None
    marge = 6
    x0 = max(0, v[0] - marge); x1 = min(tile.width, v[1] + marge)
    y0 = max(0, h[0] - marge); y1 = min(tile.height, h[1] + marge)
    # Un cadrage qui garderait presque toute la vignette n'apporte rien, et un
    # cadrage minuscule signale une détection ratée : dans les deux cas on garde
    # la vignette entière.
    aire = (x1 - x0) * (y1 - y0) / (tile.width * tile.height)
    return (x0, y0, x1, y1) if 0.25 < aire < 0.95 else None


def decouper_planches(dest):
    os.makedirs(dest, exist_ok=True)
    recadrees = 0
    for spec in PLANCHES:
        im = Image.open(os.path.join(SRC, spec['file']))
        w, h = im.size
        im = im.crop((int(spec['left'] * w), int(spec['top'] * h),
                      int(spec['right'] * w), int(spec['bottom'] * h)))
        w, h = im.size
        cw, ch = w // spec['cols'], h // spec['rows']
        for i, name in enumerate(spec['names']):
            if not name:
                continue
            r, c = divmod(i, spec['cols'])
            tile = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
            boite = boite_de_la_carte(tile)
            if boite:
                tile = tile.crop(boite)
                recadrees += 1
            # Résolution native, qualité quasi sans perte : aucun agrandissement,
            # qui n'ajouterait rien à une source déjà limitée.
            tile.save(os.path.join(dest, f'{name}.jpg'), quality=97, subsampling=0)
    print(f'  vignettes de cartes : {recadrees} recadrées automatiquement')


def copier_materiel(dest):
    """Copie brute des photos : aucun pixel, aucun octet n'est touché."""
    os.makedirs(dest, exist_ok=True)
    for src, dst in MATERIEL.items():
        shutil.copyfile(os.path.join(SRC, src), os.path.join(dest, dst))


def extraire_livret(dest):
    """Pages du livret, récupérées telles quelles dans le PDF.

    On repère les flux JPEG par leurs marqueurs et on les écrit sans les
    rouvrir : le fichier produit est l'image d'origine, bit pour bit.
    """
    pdf = os.path.join(SRC, 'canon_rg.pdf')
    if not os.path.isfile(pdf):
        return 0
    os.makedirs(dest, exist_ok=True)
    data = open(pdf, 'rb').read()
    pages, i = [], 0
    while True:
        start = data.find(b'\xff\xd8\xff', i)
        if start < 0:
            break
        end = data.find(b'\xff\xd9', start)
        if end < 0:
            break
        blob = data[start:end + 2]
        try:
            im = Image.open(io.BytesIO(blob))
            im.load()
            # Les pages du livret sont les grandes images ; le PDF contient
            # aussi quelques vignettes sans rapport avec le jeu.
            if im.width >= 1000 and im.height >= 1400:
                pages.append(blob)
        except Exception:
            pass
        i = start + 3
    for n, blob in enumerate(pages, 1):
        open(os.path.join(dest, f'livret-{n:02d}.jpg'), 'wb').write(blob)
    return len(pages)


def nuancier(path):
    sw, sh = 220, 260
    img = Image.new('RGB', (sw * len(PALETTE), sh), '#ffffff')
    d = ImageDraw.Draw(img)
    try:
        gras = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20)
        maigre = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 17)
    except OSError:
        gras = maigre = ImageFont.load_default()
    for i, (hexa, label) in enumerate(PALETTE):
        d.rectangle([i * sw, 0, (i + 1) * sw - 1, 185], fill=hexa)
        d.text((i * sw + 14, 200), hexa.upper(), fill='#171310', font=gras)
        d.text((i * sw + 14, 228), label, fill='#514538', font=maigre)
    img.save(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--archive', action='store_true',
                    help='produit aussi le PDF de briefing et une archive ZIP')
    args = ap.parse_args()

    if not os.path.isdir(SRC):
        sys.exit(f'Sources introuvables : {SRC}')

    decouper_planches(os.path.join(OUT, 'refs-cartes'))
    nuancier(os.path.join(OUT, 'palette.png'))
    print(f'Kit écrit dans {os.path.relpath(OUT, ROOT)}/')

    if args.archive:
        tmp = '/tmp/canonniers-kit'
        shutil.rmtree(tmp, ignore_errors=True)
        shutil.copytree(OUT, tmp)
        copier_materiel(os.path.join(tmp, 'refs-materiel'))
        n = extraire_livret(os.path.join(tmp, 'refs-livret'))
        print('  photos du matériel : copiées sans recompression')
        print(f'  pages du livret    : {n} extraites du PDF sans recompression')

        # Le PDF de briefing : c'est le seul format qu'un modèle d'image lit
        # d'un seul tenant, sans avoir à décompresser quoi que ce soit.
        pdf = os.path.join(tmp, 'BRIEFING.pdf')
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'build-pdf.py'), pdf],
                       check=True)
        shutil.copyfile(pdf, '/tmp/canonniers-briefing.pdf')

        # ZIP plutôt que tar.gz : il s'ouvre d'un double-clic partout.
        base = '/tmp/canonniers-kit-illustrations'
        for reste in (base + '.zip', base + '.tar.gz'):
            if os.path.exists(reste):
                os.remove(reste)
        shutil.make_archive(base, 'zip', tmp)
        print(f'Archive : {base}.zip ({os.path.getsize(base + ".zip") / 1e6:.1f} Mo)')
        print(f'PDF     : /tmp/canonniers-briefing.pdf '
              f'({os.path.getsize("/tmp/canonniers-briefing.pdf") / 1e6:.1f} Mo)')


if __name__ == '__main__':
    main()
