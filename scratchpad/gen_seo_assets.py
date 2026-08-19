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


def og_image(out, eyebrow, title, sub):
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(im)

    # vertical brand gradient + warm glow in the top-right
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)],
               fill=(int(INK_3[0] + (INK[0] - INK_3[0]) * t),
                     int(INK_3[1] + (INK[1] - INK_3[1]) * t),
                     int(INK_3[2] + (INK[2] - INK_3[2]) * t)))
    glow = Image.new("RGB", (W, H), INK)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W - 520, -340, W + 240, 300], fill=ORANGE)
    glow = glow.filter(ImageFilter.GaussianBlur(120))   # diffuse, no hard arc
    im = Image.blend(im, glow, 0.30)
    d = ImageDraw.Draw(im)

    # subtle grid texture
    for x in range(0, W, 40):
        d.line([(x, 0), (x, H)], fill=(38, 40, 44))
    for y in range(0, H, 40):
        d.line([(0, y), (W, y)], fill=(38, 40, 44))

    PAD = 74
    badge = draw_mark(96)
    im.paste(badge, (PAD, PAD), badge)
    d.text((PAD + 118, PAD + 20), "ecomm", font=font(FONT_BOLD, 38), fill=WHITE)
    wlen = d.textlength("ecomm", font=font(FONT_BOLD, 38))
    d.text((PAD + 118 + wlen, PAD + 20), "syte", font=font(FONT_BOLD, 38), fill=ORANGE)

    y = 250
    if eyebrow:
        d.text((PAD, y), eyebrow.upper(), font=font(FONT_SEMI, 22), fill=ORANGE)
        y += 46

    f_title = font(FONT_BOLD, 62)
    for line in wrap(d, title, f_title, W - PAD * 2 - 40)[:3]:
        d.text((PAD, y), line, font=f_title, fill=WHITE)
        y += 74

    if sub:
        y += 12
        f_sub = font(FONT_REG, 27)
        for line in wrap(d, sub, f_sub, W - PAD * 2 - 120)[:2]:
            d.text((PAD, y), line, font=f_sub, fill=MUTED)
            y += 38

    # brand rule along the bottom edge
    for x in range(W):
        t = x / W
        d.line([(x, H - 9), (x, H)],
               fill=(int(ORANGE[0] + (AMBER[0] - ORANGE[0]) * t),
                     int(ORANGE[1] + (AMBER[1] - ORANGE[1]) * t),
                     int(ORANGE[2] + (AMBER[2] - ORANGE[2]) * t)))

    im.save(out, "JPEG", quality=88, optimize=True, progressive=True)
    return os.path.getsize(out)


os.makedirs("static/og", exist_ok=True)
PAGES = [
    ("og-default.jpg",      "Strategy-Driven Amazon Growth", "The full-service Amazon growth agency", "Strategy, advertising, creative and operations — one accountable team."),
    ("og-home.jpg",         "Amazon Growth Agency",          "We turn Amazon stores into category leaders", "120+ brands scaled. Profit-first advertising, premium creative, real operations."),
    ("og-services.jpg",     "What we do",                    "Eight services covering your entire Amazon journey", "From product research and sourcing to PPC, creative and multichannel."),
    ("og-about.jpg",        "About ecommsyte",               "Specialists, not generalists",              "A remote-first team scaling brands across the US, UK, EU and UAE."),
    ("og-testimonials.jpg", "Client results",                "What our partners say",                     "Founders and brand owners on what it's like to grow with ecommsyte."),
    ("og-blog.jpg",         "Insights",                      "Growth insights, minus the fluff",          "Tactics, marketplace updates and data we actually use with clients."),
    ("og-careers.jpg",      "Careers",                       "Do the best work of your career",            "Remote-first, senior-only teams, real ownership."),
    ("og-contact.jpg",      "Get in touch",                  "Book your free consultation",                "A 30-minute call, a full account audit, and a plan you keep."),
    ("og-privacy.jpg",      "Privacy Policy",                "Your data, handled with care",               "What we collect, why, and the control you have over it."),
    ("og-terms.jpg",        "Terms of Service",              "The terms we work by",                       "Clear ground rules for using our site and working with our team."),
]
total = 0
for name, eyebrow, title, sub in PAGES:
    total += og_image(f"static/og/{name}", eyebrow, title, sub)
print(f"  og images: {len(PAGES)} files, {total/1024:.0f} KB total")
