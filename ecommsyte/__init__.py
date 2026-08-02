"""
ecommsyte — Flask application package.

A conventional, production-ready Flask app (application-factory + blueprints). Pages live
in ``templates/`` and are rendered with ``render_template``; CSS/JS/assets live in
``static/`` and are served at the site root (``static_url_path=""``) so the pages' existing
relative paths resolve unchanged. Jinja is tuned to preserve the source files' exact line
endings, so rendered pages are **byte-for-byte identical** to the original HTML — the
UI/UX is unchanged.

    from ecommsyte import create_app
    app = create_app()                       # config from APP_ENV / FLASK_ENV
    app = create_app(DevelopmentConfig)      # or an explicit config class
"""
from __future__ import annotations

from pathlib import Path

from flask import Flask

from .blueprints import register_blueprints
from .config import BaseConfig, get_config
from .errors import register_error_handlers
from .extensions import init_extensions
from .security import register_security

__all__ = ["create_app", "__version__"]
__version__ = "1.0.0"

# Repository root — holds ``templates/`` and ``static/`` (the parent of this package).
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def create_app(config: type[BaseConfig] | None = None) -> Flask:
    """Build and configure the Flask application."""
    app = Flask(
        __name__,
        template_folder=str(PROJECT_ROOT / "templates"),
        static_folder=str(PROJECT_ROOT / "static"),
        static_url_path="",  # serve /styles.css, /script.js, /assets/… at the site root
        instance_relative_config=True,
    )
    app.config.from_object(config or get_config())

    # Keep rendered output byte-identical to the source HTML (all pages are CRLF).
    app.jinja_env.keep_trailing_newline = True
    app.jinja_env.newline_sequence = "\r\n"

    init_extensions(app)          # optional middleware (ProxyFix behind a reverse proxy)
    register_security(app)        # non-breaking security headers
    register_blueprints(app)      # pages · ops
    register_error_handlers(app)  # on-brand 404

    return app
