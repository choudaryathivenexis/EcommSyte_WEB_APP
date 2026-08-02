# ecommsyte — Strategy-Driven Amazon Growth Agency

A premium, hand-built marketing website for **ecommsyte**, a full-service Amazon growth
agency — served by a small, modular **Flask** application. The pages (`templates/`) and
assets (`static/`) are hand-written HTML, CSS, and vanilla JavaScript; there is no build
step and no CSS/JS framework. Flask renders the pages **byte-for-byte** (Jinja tuned to
preserve the exact source bytes), so the rendered UI/UX is 100% hand-authored.

---

## Quick start

```bash
python -m pip install -r requirements.txt
python run.py                          # dev  → http://127.0.0.1:5000
```

---

## Running & deploying

```bash
python run.py                          # dev server (debug on)  → http://127.0.0.1:5000
gunicorn wsgi:app                      # production — Linux / macOS
waitress-serve --port=8000 wsgi:app    # production — Windows
flask --app wsgi run                   # Flask CLI (reads .flaskenv / .env)
pytest                                 # run the test suite (byte-identity + routes)
```

### Deploy to Vercel

The repo is Vercel-ready: [`api/index.py`](api/index.py) exposes the Flask app as a
serverless function and [`vercel.json`](vercel.json) routes every request to it (with
`templates/`, `static/`, and `ecommsyte/` bundled in). No source files are exposed.

1. Push this repo to GitHub.
2. On **vercel.com → Add New → Project**, import the repo. Vercel auto-detects the Python
   function from `vercel.json` — leave the build settings as default and **Deploy**.
3. (Optional but recommended) In **Project → Settings → Environment Variables** add
   `SECRET_KEY` (any random string) and `APP_ENV=production`.
4. That's it — the whole site (all pages + assets) is served by the function, identical to
   local. The careers CMS keeps talking to Supabase from the browser.

Or from the CLI: `npm i -g vercel` → `vercel` (preview) → `vercel --prod`.

### Other hosts

Deploy to any Python host (Render, Railway, Fly.io, a VPS…) — a `Procfile` is included.
Config comes from the environment (`APP_ENV`, `SECRET_KEY`, `PORT`, `USE_PROXY_FIX`, …);
see [.env.example](.env.example). Contact/booking forms post to Formspree client-side.

## Project structure

```
WEB/
├── templates/                 all page HTML (rendered by Flask) + 404.html
├── static/                    styles.css · script.js · favicon.svg · assets/
├── ecommsyte/                 the Flask application package
│   ├── __init__.py            create_app() application factory
│   ├── config.py              Base / Development / Production / Testing (env-driven)
│   ├── extensions.py          optional middleware (ProxyFix behind a proxy)
│   ├── security.py            non-breaking security headers
│   ├── errors.py              on-brand 404 handler
│   └── blueprints/
│       ├── pages.py           marketing pages (clean URL + legacy .html alias)
│       └── ops.py             /healthz · /favicon.ico
├── tests/test_routes.py       asserts every route is byte-for-byte identical
├── instance/                  Flask instance folder (git-ignored contents)
├── wsgi.py  run.py            production entry · dev server
└── requirements*.txt  Procfile  .flaskenv  .env.example
```

Pages live in `templates/` (rendered with `render_template`); `static/` is served at the
**site root** (`static_url_path=""`) so the HTML's relative paths (`styles.css`, `assets/…`)
resolve unchanged — **no HTML was modified**, and `pytest` proves every response is
byte-for-byte identical to its source file.

**Routing.** Every page is reachable at a clean URL **and** its legacy `.html` URL
(so existing internal links keep working unchanged):

| Clean URL | Legacy URL | Serves |
|-----------|-----------|--------|
| `/` | `/index.html` | `index.html` |
| `/about` · `/services` · `/testimonials` · `/blog` · `/careers` · `/contact` | `…​.html` | the matching page |
| `/blog-2026-growth-playbook` (all 7 posts) | `…​.html` | the article |
| `/styles.css` · `/script.js` · `/favicon.svg` · `/assets/<path>` | — | static assets at the site root |
| `/healthz` | — | JSON health check |

Pages are served from the **URL root** (never under a sub-path) so the HTML's relative
asset paths resolve exactly as in the static build — no HTML was modified. Contact/booking
forms continue to post to Formspree client-side, unchanged. Deploy to any Python host
(Render, Railway, Fly.io, a VPS…); a `Procfile` is included.

---

## Pages

| Page | File | Purpose |
|------|------|---------|
| Home | [index.html](index.html) | Hero, services preview, process, results, case studies, testimonials, team, CTA |
| Services | [services.html](services.html) | 8 service detail sections + 3 pricing plans (Ignite / Accelerate / Dominate) |
| About | [about.html](about.html) | Company story, stats, team, journey timeline |
| Testimonials | [testimonials.html](testimonials.html) | Client reviews + results |
| Blog | [blog.html](blog.html) | Article grid + newsletter signup |
| Careers | [careers.html](careers.html) | Culture, 6 open roles, hiring process |
| Contact | [contact.html](contact.html) | Booking form, quick-message form, FAQ |

Shared assets: [styles.css](styles.css) (design system), [script.js](script.js) (all
interactivity), [favicon.svg](favicon.svg) (logo mark).

---

## Tech & design

- **No framework / no build.** Pure HTML + one CSS file + one JS file.
- **Design system** driven by CSS custom properties — 6-color brand palette
  (Orange `#E6862D`, Ink `#1D1E20`, White, Cream `#F6F1E9`, Amber `#F2A65A`, Mist `#9AA3AE`).
- **Fonts:** Sora (headings) + Inter (body), loaded from Google Fonts.
- **JS features:** preloader, sticky nav + scroll progress, mobile menu, scroll-reveal,
  animated counters, 3D tilt, magnetic buttons, parallax, form validation + Formspree
  AJAX, a site-wide CTA modal, and a FAQ accordion.
- **Accessibility & motion:** skip links, ARIA labels, focus trapping in the modal, and
  full `prefers-reduced-motion` / touch fallbacks throughout.
- **SEO:** per-page titles/descriptions, canonical tags, Open Graph + Twitter cards, and
  schema.org Organization markup on the homepage.

---

## ⚠️ Before going live — configuration checklist

The site is feature-complete but ships with placeholders. Search the codebase for
`YOUR_` to find them all.

- [ ] **Formspree form IDs** in `contact.html` (booking + contact) and `blog.html`
      (newsletter): replace `YOUR_BOOKING_FORM_ID`, `YOUR_CONTACT_FORM_ID`,
      `YOUR_NEWSLETTER_FORM_ID`. The modal form in [script.js](script.js) also uses
      `YOUR_BOOKING_FORM_ID`.
- [ ] **Social links** — replace `YOUR_HANDLE` (LinkedIn, Facebook, Instagram, X) in the
      nav, footer, and homepage schema.org block.
- [ ] **WhatsApp number** in `contact.html` (`wa.me/920000000000`).
- [ ] **Domain** — canonical/OG URLs assume `https://www.ecommsyte.com/`.
- [ ] **Sample content** — team names, case-study numbers, and testimonials are
      illustrative placeholders; swap for real content.
- [ ] Optional: add `robots.txt` and `sitemap.xml`.

---

## Contributing / making changes

**When you change the project, update [CONTEXT.md](CONTEXT.md).** It is the single source
of truth for how the site is structured and is written to bring any developer (or AI
assistant) fully up to speed by reading one file. See the checklist at the bottom of that
file for what to keep in sync.

Notable maintenance note: the nav and footer markup is **duplicated on every page** (no
templating). Any change to nav/footer must be applied to all 7 HTML files.
