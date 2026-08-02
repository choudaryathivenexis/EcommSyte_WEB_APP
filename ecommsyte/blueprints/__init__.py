"""Blueprint registry — one place to wire every route group into the app.

Static assets (``/styles.css``, ``/script.js``, ``/favicon.svg``, ``/assets/…``) are handled
by Flask's built-in static endpoint (``static_url_path=""``), so they need no blueprint.
"""
from __future__ import annotations

from flask import Flask

from .ops import bp as ops_bp
from .pages import bp as pages_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(pages_bp)
    app.register_blueprint(ops_bp)
