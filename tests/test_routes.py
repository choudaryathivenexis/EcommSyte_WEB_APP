"""Route tests.

The headline guarantee: every page and asset the app serves is **byte-for-byte identical**
to its source file, so the Flask app is pixel-identical to the original static build.

Run:  pytest
"""
from __future__ import annotations

from pathlib import Path

import pytest

from ecommsyte import create_app
from ecommsyte.blueprints.pages import BLOG_POSTS, PAGES
from ecommsyte.config import TestingConfig

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "templates"
STATIC = ROOT / "static"


@pytest.fixture()
def client():
    return create_app(TestingConfig).test_client()


def _page_targets():
    """(url, template_file) for every page — clean URL and legacy .html alias."""
    for clean, filename in PAGES.items():
        yield clean, filename
        yield ("/index.html" if clean == "/" else clean + ".html"), filename
    for slug in BLOG_POSTS:
        yield "/" + slug, slug + ".html"
        yield "/" + slug + ".html", slug + ".html"


@pytest.mark.parametrize("url,template", list(_page_targets()))
def test_pages_are_byte_identical(client, url, template):
    resp = client.get(url)
    assert resp.status_code == 200
    assert resp.data == (TEMPLATES / template).read_bytes()


@pytest.mark.parametrize(
    "path",
    [
        "styles.css",
        "script.js",
        "favicon.svg",
        "assets/team/abdul-moeed.jpg",
        "assets/brands/boldify.jpg",
        "assets/brands/toyota-genuine-parts.jpg",
    ],
)
def test_static_is_byte_identical(client, path):
    resp = client.get("/" + path)
    assert resp.status_code == 200
    assert resp.data == (STATIC / path).read_bytes()


def test_unknown_path_renders_on_brand_404(client):
    resp = client.get("/no-such-page")
    assert resp.status_code == 404
    assert "/styles.css" in resp.get_data(as_text=True)  # reuses the site's own CSS


def test_healthz(client):
    resp = client.get("/healthz")
    assert resp.status_code == 200
    assert resp.get_json() == {"status": "ok"}


def test_favicon_ico_is_served(client):
    """A real multi-resolution .ico now lives in static/ (was a 204 shim)."""
    resp = client.get("/favicon.ico")
    assert resp.status_code == 200
    assert resp.data == (STATIC / "favicon.ico").read_bytes()


def test_security_headers(client):
    headers = client.get("/").headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "SAMEORIGIN"


# ---------------------------------------------------------------- SEO surface


def test_robots_txt(client):
    resp = client.get("/robots.txt")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert "Sitemap: https://www.ecommsyte.com/sitemap.xml" in body
    assert "Disallow: /admin" in body


def test_sitemap_lists_every_indexable_page(client):
    resp = client.get("/sitemap.xml")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    # every clean page route except the admin console, plus every blog post
    expected = [r for r in PAGES if r != "/admin"]
    assert body.count("<loc>") == len(expected) + len(BLOG_POSTS)
    assert "/admin" not in body
    for slug in BLOG_POSTS:
        assert f"https://www.ecommsyte.com/{slug}</loc>" in body


@pytest.mark.parametrize("path", ["site.webmanifest", "icons/apple-touch-icon.png",
                                  "icons/icon-512.png", "og/og-home.jpg"])
def test_seo_assets_are_served(client, path):
    assert client.get("/" + path).status_code == 200


@pytest.mark.parametrize("url", [r for r in PAGES if r != "/admin"])
def test_indexable_pages_carry_core_seo_tags(client, url):
    html = client.get(url).get_data(as_text=True)
    assert 'rel="canonical"' in html
    assert 'name="robots"' in html
    assert 'property="og:image"' in html
    assert 'name="twitter:card"' in html
    assert 'rel="manifest"' in html


@pytest.mark.parametrize("url", [r for r in PAGES if r != "/admin"] + ["/" + s for s in BLOG_POSTS])
def test_structured_data_is_valid_json(client, url):
    import json
    import re

    html = client.get(url).get_data(as_text=True)
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', html, re.S)
    assert blocks, f"{url} has no structured data"
    for raw in blocks:
        assert json.loads(raw)["@type"]
