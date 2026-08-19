"""Operational + SEO endpoints (health, robots.txt, sitemap.xml).

robots.txt and sitemap.xml are generated from the page registry rather than
hand-maintained, so adding a route or a blog post keeps them correct with no
extra step.
"""
from __future__ import annotations

from datetime import date

from flask import Blueprint, Response, current_app, url_for

from .pages import BLOG_POSTS, PAGES

bp = Blueprint("ops", __name__)

#: Canonical origin used in absolute URLs. Override with SITE_URL in config.
DEFAULT_SITE_URL = "https://www.ecommsyte.com"

#: Routes deliberately kept out of search results.
EXCLUDED = {"/admin"}

#: Relative priority / change cadence per section.
_PRIORITY = {"/": ("1.0", "weekly"), "/services": ("0.9", "monthly"), "/contact": ("0.9", "monthly")}
_DEFAULT = ("0.7", "monthly")
_LEGAL = ("0.3", "yearly")
_POST = ("0.6", "yearly")


def _site_url() -> str:
    return (current_app.config.get("SITE_URL") or DEFAULT_SITE_URL).rstrip("/")


def _entries():
    """(loc, priority, changefreq) for every indexable page, in a sensible order."""
    base = _site_url()
    for route in PAGES:
        if route in EXCLUDED:
            continue
        pri, freq = _LEGAL if route in ("/privacy", "/terms") else _PRIORITY.get(route, _DEFAULT)
        yield (f"{base}/" if route == "/" else f"{base}{route}"), pri, freq
    for slug in BLOG_POSTS:
        pri, freq = _POST
        yield f"{base}/{slug}", pri, freq


@bp.route("/robots.txt")
def robots_txt():
    base = _site_url()
    lines = [
        "# ecommsyte — https://www.ecommsyte.com",
        "User-agent: *",
        "Allow: /",
        "",
        "# Admin console and API-ish endpoints carry no search value",
        "Disallow: /admin",
        "Disallow: /admin.html",
        "Disallow: /healthz",
        "",
        "# Legacy .html aliases stay crawlable on purpose: each one carries a canonical",
        "# tag pointing at the clean URL, which is how the duplicates get consolidated.",
        "# Blocking them would hide that signal and risk url-only indexing.",
        "",
        f"Sitemap: {base}/sitemap.xml",
        "",
    ]
    return Response("\n".join(lines), mimetype="text/plain")


@bp.route("/sitemap.xml")
def sitemap_xml():
    today = date.today().isoformat()
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for loc, pri, freq in _entries():
        out += ["  <url>",
                f"    <loc>{loc}</loc>",
                f"    <lastmod>{today}</lastmod>",
                f"    <changefreq>{freq}</changefreq>",
                f"    <priority>{pri}</priority>",
                "  </url>"]
    out.append("</urlset>")
    return Response("\n".join(out) + "\n", mimetype="application/xml")


@bp.route("/healthz")
def healthz():
    """Liveness probe for load balancers / uptime monitors."""
    return {"status": "ok"}, 200
