"""Inject structured data (JSON-LD) across the site.

Deliberately conservative: only markup that reflects what is genuinely on the
page. Self-serving Review/AggregateRating markup and JobPosting (no salary or
validThrough data available) are intentionally omitted — invalid or self-serving
markup risks a Search manual action rather than winning rich results.
"""
import os, re, glob, json, html

os.chdir(r"i:\Clients\ECOMMSYTE\WEB")
EOL = "\r\n"
SITE = "https://www.ecommsyte.com"
ORG_ID = f"{SITE}/#organization"
SITE_ID = f"{SITE}/#website"

def ld(obj):
    body = json.dumps(obj, ensure_ascii=False, indent=2)
    return ('  <script type="application/ld+json">' + EOL +
            EOL.join("  " + l for l in body.split("\n")) + EOL +
            "  </script>")

def crumbs(*pairs):
    return {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "name": n, "item": u}
            for i, (n, u) in enumerate(pairs)
        ],
    }

HOME = ("Home", f"{SITE}/")

# ── Organization + WebSite (homepage; referenced by @id elsewhere) ───────────
ORGANIZATION = {
    "@context": "https://schema.org", "@type": "Organization", "@id": ORG_ID,
    "name": "ecommsyte",
    "alternateName": "ecommsyte Amazon Growth Agency",
    "slogan": "Strategy-Driven Amazon Growth",
    "description": ("Full-service Amazon growth agency: account management, PPC and DSP advertising, "
                    "listing SEO, creative, sourcing and FBA operations."),
    "url": f"{SITE}/",
    "logo": {"@type": "ImageObject", "url": f"{SITE}/icons/icon-512.png", "width": 512, "height": 512},
    "image": f"{SITE}/og/og-home.jpg",
    "email": "ecomsyte@gmail.com",
    "foundingDate": "2021",
    "areaServed": [
        {"@type": "Country", "name": "United States"},
        {"@type": "Country", "name": "United Kingdom"},
        {"@type": "Country", "name": "United Arab Emirates"},
        {"@type": "Place", "name": "European Union"},
    ],
    "knowsAbout": ["Amazon Seller Central", "Amazon PPC", "Amazon DSP", "Listing Optimization",
                   "A+ Content", "FBA", "Product Sourcing", "Ecommerce Strategy"],
    "contactPoint": [{
        "@type": "ContactPoint", "contactType": "sales",
        "email": "ecomsyte@gmail.com", "url": f"{SITE}/contact",
        "availableLanguage": ["English"],
        "areaServed": ["US", "GB", "AE", "EU"],
    }],
    "sameAs": ["https://www.linkedin.com/company/ecommsyte/", "https://www.facebook.com/ecommsyte/"],
}

WEBSITE = {
    "@context": "https://schema.org", "@type": "WebSite", "@id": SITE_ID,
    "url": f"{SITE}/", "name": "ecommsyte",
    "description": "Strategy-driven Amazon growth agency.",
    "inLanguage": "en",
    "publisher": {"@id": ORG_ID},
}

SERVICES = [
    ("Product Launch Strategy", "/services#launch", "End-to-end Amazon launch systems that put new ASINs on page one and keep them there profitably."),
    ("Product Research Analysis", "/services#research", "Data-driven product discovery, screening and validation that de-risks your next launch."),
    ("Sourcing & Logistics Solutions", "/services#sourcing", "Supplier vetting, negotiation, quality control and freight coordination built for margin."),
    ("Listing Optimization", "/services#listing", "Keyword research, conversion copywriting and SEO that rank listings and close the sale."),
    ("Creative Design Solutions", "/services#creative", "Listing images, infographics, A+ content and storefronts that build buyer trust."),
    ("PPC Account Management", "/services#ppc", "Profit-first Sponsored Ads and DSP campaigns managed to ACOS and ROAS targets."),
    ("Account Health Support", "/services#health", "Compliance monitoring, listing issue resolution and appeal support."),
    ("Multichannel Integration", "/services#multichannel", "Marketplace integration, inventory syncing and fulfilment automation."),
]

FAQ = [
 ("Is the consultation really free?", "Completely. We audit your account, market, and margins and share our findings — whether or not you decide to work with us. It's how we've earned most of our long-term partnerships."),
 ("Do you require long-term contracts?", "No lock-in theatrics. We work month to month and earn your renewal with results. 96% of our partners choose to stay year after year."),
 ("What size brands do you work with?", "From pre-launch founders to eight-figure brands and aggregators. Our Ignite, Accelerate, and Dominate engagements are built for different stages — we'll recommend the right fit on the call."),
 ("Which marketplaces do you support?", "We actively manage brands across 14 Amazon marketplaces including the US, UK, Germany, and UAE — with localized listings and region-specific ad strategy."),
 ("Can I hire you for just one service?", "Yes. Every service — PPC, SEO, creative, launches, or operations — can run standalone, or as part of a full-service engagement. Start where the biggest opportunity is."),
 ("How quickly will I see results?", "It depends on your starting point, but most partners see meaningful movement in advertising efficiency and conversion within the first 30–60 days, with compounding gains after that."),
]

def webpage(name, url, desc, kind="WebPage"):
    return {"@context": "https://schema.org", "@type": kind, "url": url, "name": name,
            "description": desc, "isPartOf": {"@id": SITE_ID},
            "about": {"@id": ORG_ID}, "inLanguage": "en"}

BLOCKS = {}

BLOCKS["index.html"] = [WEBSITE]     # Organization already present; upgraded separately

BLOCKS["services.html"] = [
    webpage("Amazon Services", f"{SITE}/services",
            "Eight services covering the entire Amazon journey, from product research and sourcing to PPC, creative and multichannel operations."),
    {"@context": "https://schema.org", "@type": "ItemList",
     "name": "ecommsyte Amazon services", "numberOfItems": len(SERVICES),
     "itemListElement": [
         {"@type": "ListItem", "position": i + 1,
          "item": {"@type": "Service", "name": n, "url": SITE + u, "description": d,
                   "serviceType": n, "provider": {"@id": ORG_ID},
                   "areaServed": ["US", "GB", "AE", "EU"]}}
         for i, (n, u, d) in enumerate(SERVICES)]},
    crumbs(HOME, ("Services", f"{SITE}/services")),
]

BLOCKS["about.html"] = [
    webpage("About ecommsyte", f"{SITE}/about",
            "A remote-first team of Amazon specialists scaling 120+ brands across the US, UK, EU and UAE.",
            kind="AboutPage"),
    crumbs(HOME, ("About", f"{SITE}/about")),
]

BLOCKS["contact.html"] = [
    webpage("Contact ecommsyte", f"{SITE}/contact",
            "Book a free Amazon account audit and consultation with the ecommsyte team.",
            kind="ContactPage"),
    {"@context": "https://schema.org", "@type": "FAQPage",
     "mainEntity": [{"@type": "Question", "name": q,
                     "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]},
    crumbs(HOME, ("Contact", f"{SITE}/contact")),
]

BLOCKS["testimonials.html"] = [
    webpage("Client testimonials", f"{SITE}/testimonials",
            "What founders, ecommerce directors and brand owners say about growing with ecommsyte."),
    crumbs(HOME, ("Testimonials", f"{SITE}/testimonials")),
]

BLOCKS["careers.html"] = [
    webpage("Careers at ecommsyte", f"{SITE}/careers",
            "Open roles at a remote-first Amazon growth agency scaling 120+ brands."),
    crumbs(HOME, ("Careers", f"{SITE}/careers")),
]

BLOCKS["privacy.html"] = [
    webpage("Privacy Policy", f"{SITE}/privacy",
            "How ecommsyte collects, uses, shares and protects your information."),
    crumbs(HOME, ("Privacy Policy", f"{SITE}/privacy")),
]

BLOCKS["terms.html"] = [
    webpage("Terms of Service", f"{SITE}/terms",
            "The terms that govern ecommsyte's website and services."),
    crumbs(HOME, ("Terms of Service", f"{SITE}/terms")),
]

# blog index: Blog + the post list
posts = []
for p in sorted(glob.glob("templates/blog-*.html")):
    t = open(p, encoding="utf-8").read()
    m = re.search(r'<script type="application/ld\+json">(.*?)</script>', t, re.S)
    if not m:
        continue
    d = json.loads(m.group(1))
    posts.append((os.path.basename(p)[:-5], d.get("headline", ""), d.get("datePublished", "")))

BLOCKS["blog.html"] = [
    {"@context": "https://schema.org", "@type": "Blog", "@id": f"{SITE}/blog#blog",
     "url": f"{SITE}/blog", "name": "ecommsyte Insights",
     "description": "Amazon growth tactics, marketplace updates and data from the ecommsyte team.",
     "inLanguage": "en", "publisher": {"@id": ORG_ID},
     "blogPost": [{"@type": "BlogPosting", "headline": h, "url": f"{SITE}/{s}",
                   "datePublished": dt} for s, h, dt in posts]},
    crumbs(HOME, ("Blog", f"{SITE}/blog")),
]

# ── Apply ───────────────────────────────────────────────────────────────────
changed = []
for path in sorted(glob.glob("templates/*.html")):
    name = os.path.basename(path)
    t = open(path, "rb").read().decode("utf-8")
    before = t

    # upgrade the homepage Organization block in place
    if name == "index.html" and '"@id": "' + ORG_ID not in t:
        m = re.search(r'[ \t]*<script type="application/ld\+json">.*?</script>', t, re.S)
        if m:
            t = t[:m.start()] + ld(ORGANIZATION) + t[m.end():]

    # blog posts: add the publisher logo Google recommends + a breadcrumb trail
    if name.startswith("blog-"):
        m = re.search(r'<script type="application/ld\+json">(.*?)</script>', t, re.S)
        if m:
            d = json.loads(m.group(1))
            if "logo" not in d.get("publisher", {}):
                d["publisher"] = {"@type": "Organization", "name": "ecommsyte", "url": f"{SITE}/",
                                  "logo": {"@type": "ImageObject", "url": f"{SITE}/icons/icon-512.png",
                                           "width": 512, "height": 512}}
                d["inLanguage"] = "en"
                d["isPartOf"] = {"@id": f"{SITE}/blog#blog"}
                line_start = t.rfind(EOL, 0, m.start()) + len(EOL)
                t = t[:line_start] + ld(d) + t[m.end():]
        if "BreadcrumbList" not in t:
            head = t.rindex("</head>")
            ls = t.rfind(EOL, 0, head) + len(EOL)
            slug = name[:-5]
            title = re.search(r"<title>(.*?)(?: &mdash;| —|\|).*?</title>", t, re.S)
            label = html.unescape(title.group(1)).strip() if title else "Article"
            t = t[:ls] + ld(crumbs(HOME, ("Blog", f"{SITE}/blog"), (label, f"{SITE}/{slug}"))) + EOL + t[ls:]

    # everything else: append its blocks before </head>
    for blk in BLOCKS.get(name, []):
        marker = f'"@type": "{blk["@type"]}"'
        if marker in t:
            continue
        head = t.rindex("</head>")
        ls = t.rfind(EOL, 0, head) + len(EOL)
        t = t[:ls] + ld(blk) + EOL + t[ls:]

    if t != before:
        open(path, "wb").write(t.encode("utf-8"))
        changed.append(name)

print(f"  structured data written to {len(changed)} templates")
