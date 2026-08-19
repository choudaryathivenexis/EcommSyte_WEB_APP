"""Inject the technical-SEO head block into every template.

Adds: icon set + manifest, robots directives, og:site_name / og:image (with
dimensions + alt), and a complete twitter card. Idempotent — re-running makes
no further changes.
"""
import os, re, glob, html

os.chdir(r"i:\Clients\ECOMMSYTE\WEB")
EOL = "\r\n"
SITE = "https://www.ecommsyte.com"

# page file -> (og image, image alt)
OG = {
    "index.html":        ("og-home.jpg",         "ecommsyte — we turn Amazon stores into category leaders"),
    "services.html":     ("og-services.jpg",     "ecommsyte services — eight services covering your entire Amazon journey"),
    "about.html":        ("og-about.jpg",        "About ecommsyte — specialists, not generalists"),
    "testimonials.html": ("og-testimonials.jpg", "ecommsyte client results and testimonials"),
    "blog.html":         ("og-blog.jpg",         "ecommsyte insights — growth articles for Amazon brands"),
    "careers.html":      ("og-careers.jpg",      "Careers at ecommsyte — do the best work of your career"),
    "contact.html":      ("og-contact.jpg",      "Contact ecommsyte — book your free consultation"),
    "privacy.html":      ("og-privacy.jpg",      "ecommsyte privacy policy"),
    "terms.html":        ("og-terms.jpg",        "ecommsyte terms of service"),
}
NOINDEX = {"404.html", "admin.html"}

ICONS = EOL.join([
    '  <link rel="icon" href="/favicon.ico" sizes="32x32" />',
    '  <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />',
    '  <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />',
    '  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />',
    '  <link rel="manifest" href="/site.webmanifest" />',
])

ROBOTS = ('  <meta name="robots" content="index, follow, max-image-preview:large, '
          'max-snippet:-1, max-video-preview:-1" />')

changed = []
for path in sorted(glob.glob("templates/*.html")):
    name = os.path.basename(path)
    t = open(path, "rb").read().decode("utf-8")
    before = t

    # ---- 1. icon set + manifest, right after the existing SVG favicon --------
    if "site.webmanifest" not in t:
        m = re.search(r'[ \t]*<link rel="icon" type="image/svg\+xml"[^>]*/>', t)
        if m:
            t = t[:m.end()] + EOL + ICONS + t[m.end():]

    # ---- 2. robots directives ----------------------------------------------
    if not re.search(r'<meta name="robots"', t) and name not in NOINDEX:
        m = re.search(r'[ \t]*<meta name="author" content="ecommsyte" />', t)
        if not m:
            m = re.search(r'[ \t]*<link rel="canonical"[^>]*/>', t)
        if m:
            t = t[:m.end()] + EOL + ROBOTS + t[m.end():]

    # ---- 3. og:site_name ----------------------------------------------------
    if "og:site_name" not in t and "og:type" in t:
        m = re.search(r'[ \t]*<meta property="og:type"[^>]*/>', t)
        t = (t[:m.end()] + EOL +
             '  <meta property="og:site_name" content="ecommsyte" />' + t[m.end():])

    # ---- 4. og:image (+ dimensions/alt) and the twitter card ----------------
    if name in OG:
        img, alt = OG[name]
        url = f"{SITE}/og/{img}"
        block = [
            f'  <meta property="og:image" content="{url}" />',
            '  <meta property="og:image:width" content="1200" />',
            '  <meta property="og:image:height" content="630" />',
            f'  <meta property="og:image:alt" content="{html.escape(alt, quote=True)}" />',
        ]
        if "og:image" not in t:
            m = re.search(r'[ \t]*<meta property="og:url"[^>]*/>', t)
            t = t[:m.end()] + EOL + EOL.join(block) + t[m.end():]

        # complete twitter card (title/description mirror the OG values)
        if "twitter:card" not in t:
            ogt = re.search(r'<meta property="og:title" content="([^"]*)"', t)
            ogd = re.search(r'<meta property="og:description" content="([^"]*)"', t)
            tw = [
                '  <meta name="twitter:card" content="summary_large_image" />',
                f'  <meta name="twitter:title" content="{ogt.group(1) if ogt else "ecommsyte"}" />',
            ]
            if ogd:
                tw.append(f'  <meta name="twitter:description" content="{ogd.group(1)}" />')
            tw.append(f'  <meta name="twitter:image" content="{url}" />')
            tw.append(f'  <meta name="twitter:image:alt" content="{html.escape(alt, quote=True)}" />')
            anchor = re.search(r'[ \t]*<meta property="og:image:alt"[^>]*/>', t)
            t = t[:anchor.end()] + EOL + EOL.join(tw) + t[anchor.end():]
        elif "twitter:image" not in t:
            m = re.search(r'[ \t]*<meta name="twitter:description"[^>]*/>', t) or \
                re.search(r'[ \t]*<meta name="twitter:card"[^>]*/>', t)
            t = t[:m.end()] + EOL + f'  <meta name="twitter:image" content="{url}" />' + t[m.end():]

    # ---- 5. blog posts already carry og:image — give them a twitter:image ---
    if name.startswith("blog-") and "twitter:image" not in t:
        ogi = re.search(r'<meta property="og:image" content="([^"]+)"', t)
        if ogi:
            m = re.search(r'[ \t]*<meta name="twitter:description"[^>]*/>', t) or \
                re.search(r'[ \t]*<meta name="twitter:card"[^>]*/>', t)
            if m:
                t = t[:m.end()] + EOL + f'  <meta name="twitter:image" content="{ogi.group(1)}" />' + t[m.end():]

    if t != before:
        open(path, "wb").write(t.encode("utf-8"))
        changed.append(name)

print(f"  updated {len(changed)} templates")
for c in changed:
    print(f"    {c}")
