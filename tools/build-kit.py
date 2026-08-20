#!/usr/bin/env python3
"""Reconstruit le kit d'illustrations à partir des photos du matériel.

Découpe les deux planches de cartes photographiées en vignettes nommées d'après
l'identifiant de chaque carte dans le code, et produit le nuancier.

    python3 tools/build-kit.py            # écrit dans docs/kit-illustrations/
    python3 tools/build-kit.py --archive  # produit en plus une archive .tar.gz

Dépendance : Pillow (pip install pillow).
"""
import argparse
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'user-files')
OUT = os.path.join(ROOT, 'docs', 'kit-illustrations')

# Les deux planches de cartes photographiées forment une grille régulière : on
# découpe chaque vignette et on la nomme comme le fichier à produire.
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


def decouper_planches(dest):
    os.makedirs(dest, exist_ok=True)
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
            # Les planches sont photographiées en 960 px de large : une vignette
            # brute fait à peine 200 px. On l'agrandit — cela n'ajoute aucune
            # information, mais rend la référence exploitable par un modèle
            # d'image comme par l'œil.
            tile = tile.resize((tile.width * 2, tile.height * 2), Image.LANCZOS)
            tile.save(os.path.join(dest, f'{name}.jpg'), quality=90)


def copier_materiel(dest):
    os.makedirs(dest, exist_ok=True)
    for src, dst in MATERIEL.items():
        Image.open(os.path.join(SRC, src)).save(os.path.join(dest, dst), quality=88)


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
                    help='produit aussi canonniers-kit-illustrations.tar.gz')
    args = ap.parse_args()

    if not os.path.isdir(SRC):
        sys.exit(f'Photos introuvables : {SRC}')

    decouper_planches(os.path.join(OUT, 'refs-cartes'))
    nuancier(os.path.join(OUT, 'palette.png'))
    print(f'Kit écrit dans {os.path.relpath(OUT, ROOT)}/')

    if args.archive:
        # L'archive est autonome : elle embarque aussi les photos de matériel,
        # que le dépôt garde de son côté dans assets/user-files/.
        tmp = os.path.join('/tmp', 'canonniers-kit')
        subprocess.run(['rm', '-rf', tmp], check=True)
        subprocess.run(['cp', '-r', OUT, tmp], check=True)
        copier_materiel(os.path.join(tmp, 'refs-materiel'))
        out = os.path.join('/tmp', 'canonniers-kit-illustrations.tar.gz')
        subprocess.run(['tar', 'czf', out, '-C', tmp, '.'], check=True)
        taille = os.path.getsize(out) / 1e6
        print(f'Archive : {out} ({taille:.1f} Mo)')


if __name__ == '__main__':
    main()
