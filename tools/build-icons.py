#!/usr/bin/env python3
"""Icônes d'application, dessinées au code plutôt que rognées dans une photo.

Le motif reprend la couverture de la boîte : aplat vert, ballon or cerné de noir,
et le liseré crème du carton. Rien qui ne soit déjà dans la charte du jeu.

    python3 tools/build-icons.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

RACINE = Path(__file__).resolve().parent.parent
SORTIE = RACINE / 'assets' / 'icons'

VERT = (27, 107, 61)
ENCRE = (23, 19, 16)
OR = (211, 160, 60)
OR_OMBRE = (169, 123, 35)
CREME = (242, 236, 216)

# Tracé à 4× puis réduction : les cercles et les filets sortent nets sans
# dépendre d'un moteur d'antialiasing.
SUR = 4


def ballon(d, cx, cy, r, trait):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=OR, outline=ENCRE, width=trait)
    # Les quatre filets du ballon, comme sur le plateau et la favicon : un trait
    # fin, et une corde qui s'arrête sur le cercle plutôt que de le déborder.
    filet = max(1, int(trait * 0.42))
    for f in (-0.42, 0.42):
        corde = r * 0.895   # r·√(1−0,42²), arrondi vers l'intérieur
        d.line([cx - corde, cy + r * f, cx + corde, cy + r * f], fill=OR_OMBRE, width=filet)
        d.line([cx + r * f, cy - corde, cx + r * f, cy + corde], fill=OR_OMBRE, width=filet)


def icone(taille, marge_relative, fond):
    """marge_relative : part du côté laissée libre autour du motif.

    Une icône maskable doit tenir dans le cercle de sécurité (80 % du côté) ;
    l'icône ordinaire peut occuper toute la surface.
    """
    n = taille * SUR
    img = Image.new('RGB', (n, n), fond)
    d = ImageDraw.Draw(img)

    bord = int(n * 0.045)
    if marge_relative == 0:
        d.rectangle([bord, bord, n - bord - 1, n - bord - 1],
                    outline=CREME, width=max(2, int(n * 0.015)))

    r = int(n * (0.31 if marge_relative else 0.355))
    ballon(d, n // 2, n // 2, r, max(2, int(n * 0.028)))
    return img.resize((taille, taille), Image.LANCZOS)


def main():
    SORTIE.mkdir(parents=True, exist_ok=True)
    fichiers = [
        ('icon-192.png', icone(192, 0, VERT)),
        ('icon-512.png', icone(512, 0, VERT)),
        # Maskable : le motif recule pour survivre au rognage rond d'Android.
        ('icon-maskable-512.png', icone(512, 0.2, VERT)),
        # iOS n'applique pas de masque et n'aime pas la transparence.
        ('apple-touch-icon.png', icone(180, 0.12, VERT)),
    ]
    for nom, img in fichiers:
        chemin = SORTIE / nom
        img.save(chemin, optimize=True)
        print(f'  {nom:26} {chemin.stat().st_size / 1024:5.1f} Ko')


if __name__ == '__main__':
    main()
