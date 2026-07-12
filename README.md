# ecommsyte — Strategy-Driven Amazon Growth Agency

A premium, hand-built marketing website for **ecommsyte**, a full-service Amazon growth
agency. Static multi-page site — no framework, no build step, no dependencies.

> Built with plain HTML, CSS, and vanilla JavaScript. Just open it in a browser (or run
> the tiny dev server below) — there is nothing to compile or install.

---

## Quick start

```bash
# From the project root (this folder):
python -m http.server 5599
# then open http://localhost:5599
```

There is a matching VS Code launch config in [.claude/launch.json](.claude/launch.json)
(profile: **ecommsyte-static**, port **5599**).

Any static file server works (`npx serve`, Live Server extension, etc.). Opening the
`.html` files directly via `file://` mostly works too, but a server is recommended so
fonts, forms, and relative links behave correctly.

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
