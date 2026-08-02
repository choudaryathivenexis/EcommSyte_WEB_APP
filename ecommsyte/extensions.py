"""Optional middleware / third-party extensions.

The site is static content, so this stays intentionally light. Add real extensions
(caching, rate limiting, etc.) here and wire them in :func:`init_extensions`.
"""
from __future__ import annotations

from flask import Flask
from werkzeug.middleware.proxy_fix import ProxyFix


def init_extensions(app: Flask) -> None:
    """Initialise extensions/middleware based on configuration."""
    if app.config.get("USE_PROXY_FIX"):
        # Correct client IP / scheme / host when running behind one reverse proxy.
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)  # type: ignore[assignment]
