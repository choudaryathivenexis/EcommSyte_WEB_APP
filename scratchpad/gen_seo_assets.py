"""Generate the favicon set and Open Graph share images for ecommsyte.

The brand mark is drawn from the same geometry as static/favicon.svg so every
asset stays identical to the logo.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

os.chdir(r"i:\Clients\ECOMMSYTE\WEB")

INK      = (29, 30, 32)
INK_3    = (43, 46, 51)
ORANGE   = (230, 134, 45)
AMBER    = (242, 166, 90)
WHITE    = (255, 255, 255)
MUTED    = (166, 170, 176)

# favicon.svg geometry, viewBox 0 0 1000 1000
WHITE_BARS  = [(310, 182, 505, 105, 52), (310, 182, 105, 228, 52), (175, 447, 470, 105, 52)]
ORANGE_BARS = [(310, 712, 505, 105, 52), (310, 590, 105, 228, 52)]


def draw_mark(size, bg=INK, radius_ratio=0.18, pad=0.0, ss=4):
    """Render the brand badge at `size` px (supersampled for clean edges)."""
    S = size * ss
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if bg is not None:
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * radius_ratio), fill=bg)
    inner = S * (1 - pad * 2)
    off = S * pad
    k = inner / 1000.0
    for group, colour in ((WHITE_BARS, WHITE), (ORANGE_BARS, ORANGE)):
        for x, y, w, h, r in group:
            d.rounded_rectangle(
                [off + x * k, off + y * k, off + (x + w) * k, off + (y + h) * k],
                radius=r * k, fill=colour)
    return im.resize((size, size), Image.LANCZOS)


# ── 1. Favicons ─────────────────────────────────────────────────────────────
os.makedirs("static/icons", exist_ok=True)
made = []

for size in (16, 32, 48, 180, 192, 512):
    im = draw_mark(size)
    if size == 180:                                   # apple-touch-icon: opaque, safe padding
        flat = Image.new("RGB", (size, size), INK)
        flat.paste(draw_mark(size, radius_ratio=0.0, pad=0.10), (0, 0), draw_mark(size, radius_ratio=0.0, pad=0.10))
        flat.save("static/icons/apple-touch-icon.png", optimize=True)
        made.append("apple-touch-icon.png")
        continue
    name = f"favicon-{size}x{size}.png" if size < 180 else f"icon-{size}.png"
    im.save(f"static/icons/{name}", optimize=True)
    made.append(name)

# maskable icon: full-bleed brand background with the mark inset in the safe zone
mask = Image.new("RGB", (512, 512), INK)
m = draw_mark(512, bg=None, pad=0.20)
mask.paste(m, (0, 0), m)
mask.save("static/icons/maskable-512.png", optimize=True)
made.append("maskable-512.png")

# multi-resolution .ico at the site root
ico = draw_mark(256)
ico.save("static/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
made.append("favicon.ico")
print("  favicons:", ", ".join(made))


# ── 2. Open Graph share images ──────────────────────────────────────────────
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_SEMI = "C:/Windows/Fonts/seguisb.ttf"
FONT_REG  = "C:/Windows/Fonts/segoeui.ttf"


def font(path, size):
    return ImageFont.truetype(path, size)


def wrap(draw, text, f, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if draw.textlength(trial, font=f) <= max_w:
            cur = trial
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines


def track(d, xy, text, f, fill, spacing=0):
    """Draw text with manual letter-spacing (PIL has no native tracking)."""
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + spacing
    return x


def track_width(d, text, f, spacing=0):
    return sum(d.textlength(c, font=f) + spacing for c in text) - spacing


def og_image(out, label):
    """Brand-led share card: the logo is the subject, the page label is a caption."""
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)

    # brand gradient
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)],
               fill=(int(INK_3[0] + (INK[0] - INK_3[0]) * t),
                     int(INK_3[1] + (INK[1] - INK_3[1]) * t),
                     int(INK_3[2] + (INK[2] - INK_3[2]) * t)))

    # two diffuse brand glows framing the mark
    glow = Image.new("RGB", (W, H), INK)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W // 2 - 420, -260, W // 2 + 420, 360], fill=ORANGE)
    gd.ellipse([-260, H - 240, 360, H + 260], fill=AMBER)
    glow = glow.filter(ImageFilter.GaussianBlur(150))
    im = Image.blend(im, glow, 0.26)
    d = ImageDraw.Draw(im)

    # fine grid texture
    for x in range(0, W, 44):
        d.line([(x, 0), (x, H)], fill=(39, 41, 45))
    for y in range(0, H, 44):
        d.line([(0, y), (W, y)], fill=(39, 41, 45))

    # ── the logo, centred and dominant ──────────────────────────────────────
    BADGE = 188
    badge = draw_mark(BADGE)
    bx, by = (W - BADGE) // 2, 116
    # soft halo behind the badge so it lifts off the background
    halo = Image.new("RGB", (W, H), (0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.rounded_rectangle([bx - 26, by - 26, bx + BADGE + 26, by + BADGE + 26],
                         radius=70, fill=(120, 66, 20))
    halo = halo.filter(ImageFilter.GaussianBlur(46))
    im = Image.blend(im, Image.blend(im, halo, 0.0), 0.0)  # keep base
    im.paste(Image.blend(im.crop((0, 0, W, H)), halo, 0.35), (0, 0))
    im.paste(badge, (bx, by), badge)
    d = ImageDraw.Draw(im)

    # wordmark
    f_word = font(FONT_BOLD, 78)
    w1 = d.textlength("ecomm", font=f_word)
    w2 = d.textlength("syte", font=f_word)
    wx = (W - (w1 + w2)) / 2
    wy = by + BADGE + 40
    d.text((wx, wy), "ecomm", font=f_word, fill=WHITE)
    d.text((wx + w1, wy), "syte", font=f_word, fill=ORANGE)

    # tagline, letter-spaced
    f_tag = font(FONT_SEMI, 25)
    tag = "STRATEGY-DRIVEN AMAZON GROWTH"
    tw = track_width(d, tag, f_tag, 4.2)
    track(d, ((W - tw) / 2, wy + 104), tag, f_tag, MUTED, 4.2)

    # page caption
    if label:
        f_lbl = font(FONT_SEMI, 22)
        lw = track_width(d, label.upper(), f_lbl, 3.0)
        ly = wy + 158
        d.rounded_rectangle([(W - lw) / 2 - 22, ly - 12, (W + lw) / 2 + 22, ly + 34],
                            radius=24, outline=(92, 62, 34), width=2)
        track(d, ((W - lw) / 2, ly), label.upper(), f_lbl, ORANGE, 3.0)

    # brand rule
    for x in range(W):
        t = x / W
        d.line([(x, H - 9), (x, H)],
               fill=(int(ORANGE[0] + (AMBER[0] - ORANGE[0]) * t),
                     int(ORANGE[1] + (AMBER[1] - ORANGE[1]) * t),
                     int(ORANGE[2] + (AMBER[2] - ORANGE[2]) * t)))

    im.save(out, "JPEG", quality=90, optimize=True, progressive=True)
    return os.path.getsize(out)


os.makedirs("static/og", exist_ok=True)
PAGES = [
    ("og-default.jpg",      ""),
    ("og-home.jpg",         ""),
    ("og-services.jpg",     "Services"),
    ("og-about.jpg",        "About"),
    ("og-testimonials.jpg", "Testimonials"),
    ("og-blog.jpg",         "Insights"),
    ("og-careers.jpg",      "Careers"),
    ("og-contact.jpg",      "Contact"),
    ("og-privacy.jpg",      "Privacy Policy"),
    ("og-terms.jpg",        "Terms of Service"),
]
total = 0
for name, label in PAGES:
    total += og_image(f"static/og/{name}", label)
print(f"  og images: {len(PAGES)} files, {total/1024:.0f} KB total")
