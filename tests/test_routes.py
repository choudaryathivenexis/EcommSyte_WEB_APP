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


def test_favicon_ico_no_content(client):
    assert client.get("/favicon.ico").status_code == 204


def test_security_headers(client):
    headers = client.get("/").headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "SAMEORIGIN"
