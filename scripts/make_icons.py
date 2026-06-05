"""Generate BackIn5 PWA icons: blue gradient rounded square with 'B5' in light text."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
GREEN_TOP = (44, 79, 196, 255)     # #2C4FC4
GREEN_BOTTOM = (26, 51, 137, 255)  # #1A3389
TEXT_COLOR = (245, 247, 250, 255)   # #F5F7FA


def linear_gradient(size):
    base = Image.new('RGBA', (1, size), GREEN_TOP)
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(GREEN_TOP[0] * (1 - t) + GREEN_BOTTOM[0] * t)
        g = int(GREEN_TOP[1] * (1 - t) + GREEN_BOTTOM[1] * t)
        b = int(GREEN_TOP[2] * (1 - t) + GREEN_BOTTOM[2] * t)
        base.putpixel((0, y), (r, g, b, 255))
    return base.resize((size, size))


def find_font(size):
    candidates = [
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/SFNS.ttf',
        '/Library/Fonts/Arial Bold.ttf',
        '/System/Library/Fonts/Supplemental/Verdana Bold.ttf',
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def make_icon(size, out_path):
    radius = int(size * 0.22)
    icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    grad = linear_gradient(size)

    mask = Image.new('L', (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    icon.paste(grad, (0, 0), mask)

    font_size = int(size * 0.46)
    font = find_font(font_size)
    draw = ImageDraw.Draw(icon)
    text = 'B5'
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) / 2 - bbox[0]
    ty = (size - th) / 2 - bbox[1] - size * 0.02
    draw.text((tx, ty), text, font=font, fill=TEXT_COLOR)

    icon.save(out_path, 'PNG', optimize=True)
    print(f'Wrote {out_path}')


if __name__ == '__main__':
    os.makedirs(OUT_DIR, exist_ok=True)
    make_icon(192, os.path.join(OUT_DIR, 'icon-192.png'))
    make_icon(512, os.path.join(OUT_DIR, 'icon-512.png'))
