#!/usr/bin/env python3
"""Assemble le dossier de briefing PDF pour la génération des illustrations.

Un modèle d'image comme Gemini ne décompresse ni .zip ni .tar.gz, mais lit un
PDF nativement. Ce document rassemble donc en un seul fichier tout ce dont il a
besoin : la consigne, la palette, les références du matériel et les 19 briefs.

Le texte reste du vrai texte (pas une capture), pour être lu tel quel.

    python3 tools/build-pdf.py [chemin/sortie.pdf]

Dépendances : fpdf2, Pillow.
"""
import os
import sys

from fpdf import FPDF
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KIT = os.path.join(ROOT, 'docs', 'kit-illustrations')
PHOTOS = os.path.join(ROOT, 'assets', 'user-files')
FONTS = '/usr/share/fonts/truetype/dejavu'

INK = (23, 19, 16)
RED = (181, 49, 47)
GREEN = (27, 107, 61)
GREY = (110, 98, 85)

PREAMBULE = (
    "Illustration pour une carte à jouer française des années 1960, dans le style des jeux "
    "édités par Edmond Dujardin. Dessin vectoriel à plat : aucun dégradé, aucune ombre portée, "
    "aucune texture, aucun effet de matière. Contour noir épais et d'épaisseur constante autour "
    "de chaque forme. Palette strictement limitée à ces six couleurs et à aucune autre : "
    "noir #171310, rouge brique #b5312f, vert bouteille #1b6b3d, ocre doré #d3a03c, "
    "chair #e0a86b, crème #f2ecd8. Fond entièrement transparent. Un seul sujet, isolé, dont la "
    "silhouette reste lisible à très petite taille. Personnage aux proportions allongées et "
    "athlétiques, pose sportive franche et immédiatement lisible. Maillot à larges bandes "
    "horizontales. Visage réduit à quelques traits simples. Aucun texte, aucun chiffre, aucun "
    "logo, aucun cadre, aucune bordure. Cadrage portrait, le sujet repose sur le bord inférieur "
    "de l'image."
)

CARTES = [
    ('passe', "Joueur de profil qui pousse le ballon du pied intérieur, jambe d'appui fléchie, ballon au sol devant lui. Maillot cerclé vert-blanc-rouge."),
    ('contre_attaque', "Pas de personnage : un ballon seul, en gros, encadré par deux grosses flèches noires opposées, l'une vers le haut, l'autre vers le bas."),
    ('interception', "Joueur lancé en pleine course qui dévie le ballon du pied, buste très penché en avant, traits de vitesse derrière lui."),
    ('degagement', "Joueur qui frappe une demi-volée, jambe de frappe très haute, corps basculé en arrière, ballon partant au loin. Maillot vert."),
    ('touche', "Joueur de face, pieds au sol, qui lance le ballon à deux mains au-dessus de la tête. Maillot vert."),
    ('tir_au_but', "Joueur en extension arrière qui arme sa frappe, un but esquissé derrière lui, ballon quittant le pied."),
    ('boulet_de_canon', "Retourné acrobatique : corps à l'horizontale, tête en bas, jambes en ciseaux, ballon fusant avec traits de vitesse."),
    ('coup_de_chance', "Joueur déséquilibré, presque en train de tomber, qui touche le ballon par accident. Petites étoiles autour du point de contact."),
    ('but', "Gardien battu, en plongeon horizontal complet, bras tendus dans le vide, le ballon passe hors d'atteinte. Quelques étoiles d'impact."),
    ('but_refuse', "Deux personnages : un arbitre tout en noir qui pointe le doigt vers le côté, et un joueur face à lui qui proteste, buste penché."),
    ('arret', "Gardien en détente verticale qui capte le ballon à deux mains au-dessus de la tête, filet de but suggéré derrière lui. Maillot rouge."),
    ('sortie_de_but', "Gardien qui plonge hors de sa cage et manque le ballon, corps à l'horizontale, montant de but visible. Maillot rouge."),
    ('hors_jeu', "Arbitre en noir, immobile, un bras levé bien droit à la verticale, sifflet à la bouche, l'autre bras pointant le sol."),
    ('faute', "Joueur fauché qui bascule en vrille, jambes en l'air, étoiles de choc autour de lui, ballon échappé au sol."),
    ('coup_franc', "Joueur qui reprend le ballon de la tête, ballon juste au-dessus du front, corps tendu vers le haut. Maillot vert."),
    ('corner', "Deux joueurs qui sautent en duel aérien, épaule contre épaule, et un drapeau de corner rouge au premier plan à gauche."),
    ('penalty', "Gardien seul sur sa ligne, bras et jambes écartés en étoile, cage et filet derrière lui. Maillot vert."),
]

HORS_CARTES = [
    ('cover', "4:5, sujet en bas à gauche",
     "Joueur de football vu de trois quarts, grande figure occupant toute la hauteur, corps très "
     "étiré en diagonale. Jambe droite lancée à l'horizontale dans le geste de frappe, jambe gauche "
     "repliée sous le corps, les deux bras largement écartés pour l'équilibre. Maillot rouge à "
     "bandes blanches, culotte blanche, bas rouges à anneaux blancs, chaussures noires. Ballon ocre "
     "doré propulsé vers la droite, avec un court sillage de traits nets derrière lui. Fond "
     "transparent. Le ballon doit rester dans l'image, à droite."),
    ('dos-de-carte', "5:7 à fond perdu, SANS transparence",
     "Dos de carte à jouer, motif géométrique plat en bleu marine #213e73 sur fond blanc cassé. "
     "Terrain de football vu du dessus, très schématique : ligne médiane, rond central, deux "
     "surfaces de réparation, le tout en trait blanc sur aplat bleu, avec une trame régulière de "
     "petits points blancs. Composition symétrique, lisible tête-bêche. Aucun texte. Bord franc, "
     "pas d'ombre."),
]


class Doc(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font('DejaVu', '', 7.5)
        self.set_text_color(*GREY)
        self.cell(0, 6, 'Les Canonniers — kit illustrations', align='L')
        self.cell(0, 6, f'{self.page_no()}', align='R')
        self.ln(9)

    def footer(self):
        pass

    # -- petits utilitaires de mise en page -----------------------------------

    def titre(self, texte, taille=19, couleur=INK, space=4):
        self.set_font('DejaVu', 'B', taille)
        self.set_text_color(*couleur)
        self.multi_cell(0, taille * 0.52, texte)
        self.ln(space)

    def para(self, texte, taille=9.5, couleur=INK, space=3.2, style=''):
        self.set_font('DejaVu', style, taille)
        self.set_text_color(*couleur)
        self.multi_cell(0, taille * 0.52, texte)
        self.ln(space)

    def bandeau(self, texte, fond=GREEN):
        self.set_fill_color(*fond)
        self.set_text_color(255, 255, 255)
        self.set_font('DejaVu', 'B', 10)
        self.cell(0, 8, '  ' + texte, fill=True)
        self.ln(11)


def image_ajustee(pdf, chemin, x, y, largeur_max, hauteur_max):
    """Place une image dans une boîte sans la déformer ; renvoie sa hauteur."""
    with Image.open(chemin) as im:
        w, h = im.size
    ratio = min(largeur_max / w, hauteur_max / h)
    lw, lh = w * ratio, h * ratio
    pdf.image(chemin, x=x + (largeur_max - lw) / 2, y=y, w=lw, h=lh)
    return lh


def construire(sortie):
    if not os.path.isdir(os.path.join(KIT, 'refs-cartes')):
        sys.exit(
            "Les vignettes de cartes sont absentes de docs/kit-illustrations/refs-cartes/.\n"
            "Lancer d'abord : python3 tools/build-kit.py\n"
            "(qui a lui-même besoin des photos d'origine — voir "
            "assets/user-files/README.md).")

    pdf = Doc(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(True, margin=16)
    pdf.add_font('DejaVu', '', f'{FONTS}/DejaVuSans.ttf')
    pdf.add_font('DejaVu', 'B', f'{FONTS}/DejaVuSans-Bold.ttf')
    pdf.set_margins(16, 14, 16)
    W = 210 - 32  # largeur utile

    # ---------------------------------------------------------------- page 1
    pdf.add_page()
    pdf.set_fill_color(*GREEN)
    pdf.rect(0, 0, 210, 62, 'F')
    pdf.set_xy(16, 16)
    pdf.set_font('DejaVu', 'B', 26)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 12, 'Les Canonniers')
    pdf.ln(13)
    pdf.set_x(16)
    pdf.set_font('DejaVu', '', 12)
    pdf.cell(0, 8, 'Kit de génération des illustrations')
    pdf.ln(9)
    pdf.set_x(16)
    pdf.set_font('DejaVu', '', 9)
    pdf.cell(0, 6, "19 illustrations : 17 cartes, la couverture, le dos de carte")

    pdf.set_xy(16, 74)
    pdf.set_text_color(*INK)
    pdf.titre('La règle qui décide de tout', 14)
    pdf.para(
        "Le risque n'est pas de rater une carte, c'est que les 19 ne forment pas une famille. "
        "Une illustration superbe mais isolée abîme l'ensemble plus qu'un dessin moyen mais "
        "cohérent.")
    pdf.para(
        "Méthode : générer d'abord « passe », la plus simple. La retoucher jusqu'à ce qu'elle "
        "soit juste. Puis la joindre en image de référence à chacune des 18 suivantes, avec la "
        "mention « même style graphique, même palette, même épaisseur de contour et mêmes "
        "proportions de personnage que l'image de référence ». Sans cela, la carte 12 n'aura "
        "plus rien à voir avec la carte 1.")
    pdf.ln(1)
    pdf.titre('Format attendu', 14)
    pdf.para(
        "Portrait, environ 600 × 800 px, fond transparent (sauf le dos de carte), moins de "
        "60 Ko une fois converti en WebP. PNG, WebP, JPG ou SVG : le format importe peu, "
        "c'est la cohérence de la série qui compte.")

    pal = os.path.join(KIT, 'palette.png')
    if os.path.isfile(pal):
        pdf.ln(2)
        pdf.titre('Les six couleurs autorisées', 14, space=2)
        image_ajustee(pdf, pal, 16, pdf.get_y(), W, 34)

    # ---------------------------------------------------------------- page 2
    pdf.add_page()
    pdf.titre('Le préambule, à répéter mot pour mot')
    pdf.para("À placer en tête de chaque génération, sans le modifier :", 9, GREY)
    pdf.set_fill_color(246, 243, 234)
    pdf.set_draw_color(*INK)
    pdf.set_line_width(0.5)
    y0 = pdf.get_y()
    pdf.set_font('DejaVu', '', 9)
    pdf.set_text_color(*INK)
    pdf.multi_cell(W, 5, PREAMBULE, border=1, fill=True, padding=4)
    pdf.ln(6)
    pdf.para(
        "Puis, à la suite, le sujet de la carte (pages suivantes), et la référence de style.",
        9, GREY)

    pdf.ln(2)
    pdf.titre('Contrôle avant de valider une carte', 14)
    for n, txt in enumerate([
        "Réduire l'image à 110 px de large — sa taille réelle dans la main sur mobile. "
        "Reconnaît-on encore le sujet ?",
        "Le fond est-il vraiment transparent ? Pas de halo blanc sur les contours.",
        "Une couleur hors palette s'est-elle glissée ? Les modèles ajoutent volontiers un bleu "
        "de ciel ou un vert de pelouse qui n'ont rien à faire là.",
        "Posée à côté des cartes déjà validées, tient-elle dans la famille ? "
        "C'est ce point qui décide, pas la beauté de la carte prise isolément.",
    ], 1):
        pdf.set_font('DejaVu', 'B', 9.5)
        pdf.set_text_color(*RED)
        pdf.cell(6, 5, f'{n}.')
        pdf.set_font('DejaVu', '', 9.5)
        pdf.set_text_color(*INK)
        pdf.multi_cell(W - 6, 5, txt)
        pdf.ln(1.5)

    # ------------------------------------------------- pages : les 17 cartes
    pdf.add_page()
    pdf.titre('Les 17 cartes')
    pdf.para(
        "La photo de la carte d'origine sert à caler la pose et l'esprit. Ce n'est pas un modèle "
        "à décalquer : le but est une illustration nouvelle dans la même manière.", 9, GREY)

    for nom, sujet in CARTES:
        vignette = os.path.join(KIT, 'refs-cartes', f'{nom}.jpg')
        besoin = 30
        if pdf.get_y() + besoin > 275:
            pdf.add_page()
        y = pdf.get_y()
        if os.path.isfile(vignette):
            image_ajustee(pdf, vignette, 16, y, 20, 27)
        pdf.set_xy(40, y)
        pdf.set_font('DejaVu', 'B', 10)
        pdf.set_text_color(*GREEN)
        pdf.cell(0, 5, f'{nom}.webp')
        pdf.ln(5.5)
        pdf.set_x(40)
        pdf.set_font('DejaVu', '', 9)
        pdf.set_text_color(*INK)
        pdf.multi_cell(W - 24, 4.6, sujet)
        pdf.set_y(max(pdf.get_y(), y + 29))
        pdf.ln(1)

    # --------------------------------------------- page : les 2 hors cartes
    pdf.add_page()
    pdf.titre('Les 2 visuels hors cartes')
    for nom, cadrage, sujet in HORS_CARTES:
        pdf.bandeau(f'{nom}.webp  —  {cadrage}')
        pdf.para(sujet)
        pdf.ln(2)

    ref_cover = os.path.join(PHOTOS, 'selected_image_1162996159401495761.jpg')
    ref_dos = os.path.join(PHOTOS, 'selected_image_2736927693930519049.jpg')
    y = pdf.get_y()
    if os.path.isfile(ref_cover):
        h = image_ajustee(pdf, ref_cover, 16, y, W / 2 - 3, 62)
    if os.path.isfile(ref_dos):
        image_ajustee(pdf, ref_dos, 16 + W / 2 + 3, y, W / 2 - 3, 62)
    pdf.set_y(y + 64)
    pdf.set_font('DejaVu', '', 8)
    pdf.set_text_color(*GREY)
    pdf.cell(W / 2, 4, 'Référence : couverture de la boîte', align='C')
    pdf.cell(W / 2, 4, 'Référence : dos des cartes', align='C')

    # ------------------------------------------- pages : planches et matériel
    for fichier, legende in [
        ('selected_image_8093748423783392546.jpg',
         "Planche 1 — contre-attaque, arrêt, passe, coup franc / hors-jeu, sortie de but, but refusé, interception"),
        ('selected_image_8272358985945425724.jpg',
         "Planche 2 — tir au but, boulet de canon, touche, coup de chance / faute, corner, penalty, but, dégagement"),
        ('selected_image_5667138468716070368.jpg',
         "Le plateau : moitié verte, moitié blanc cassé, rond central bicolore, ballon de cuir clair"),
    ]:
        chemin = os.path.join(PHOTOS, fichier)
        if not os.path.isfile(chemin):
            continue
        pdf.add_page()
        pdf.titre('Référence du matériel', 14, space=2)
        pdf.para(legende, 9, GREY, space=3)
        image_ajustee(pdf, chemin, 16, pdf.get_y(), W, 210)

    pdf.output(sortie)
    return sortie


if __name__ == '__main__':
    dest = sys.argv[1] if len(sys.argv) > 1 else '/tmp/canonniers-kit-illustrations.pdf'
    chemin = construire(dest)
    print(f'PDF écrit : {chemin} ({os.path.getsize(chemin) / 1e6:.1f} Mo)')
