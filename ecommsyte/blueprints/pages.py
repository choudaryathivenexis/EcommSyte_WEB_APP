"""Marketing pages.

Rendered from ``templates/`` with ``render_template``. Every page is served from the URL
**root** (never under a sub-path such as ``/blog/<slug>``, which would break the pages'
relative asset paths) and is reachable at both a clean URL (``/about``) and its legacy
``.html`` URL (``/about.html``) — so existing internal links keep working unchanged.
"""
from __future__ import annotations

from flask import Blueprint, render_template

bp = Blueprint("pages", __name__)

# Clean route -> template file.
PAGES: dict[str, str] = {
    "/": "index.html",
    "/about": "about.html",
    "/services": "services.html",
    "/testimonials": "testimonials.html",
    "/blog": "blog.html",
    "/careers": "careers.html",
    "/contact": "contact.html",
}

# Blog article slugs (each served at the URL root as well).
BLOG_POSTS: list[str] = [
    "blog-2026-growth-playbook",
    "blog-tacos-vs-acos",
    "blog-win-the-buy-box",
    "blog-aplus-content-that-converts",
    "blog-amazon-dsp-mid-size-brands",
    "blog-q4-inventory-planning",
    "blog-amazon-seo-2026",
]


def _register(route: str, template: str, endpoint: str) -> None:
    """Register a page at its clean URL and its legacy ``.html`` alias."""
    view = lambda template=template: render_template(template)
    bp.add_url_rule(route, endpoint, view)
    alias = "/index.html" if route == "/" else route + ".html"
    bp.add_url_rule(alias, endpoint + "_html", view)


for _route, _file in PAGES.items():
    _register(_route, _file, "page_" + _file.rsplit(".", 1)[0].replace("-", "_"))

for _slug in BLOG_POSTS:
    _register("/" + _slug, _slug + ".html", "post_" + _slug.replace("-", "_"))
