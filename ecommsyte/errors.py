"""Error handlers.

The 404 reuses the site's own stylesheet/script (via ``/styles.css`` and ``/script.js``),
so it is on-brand without introducing any new design system.
"""
from __future__ import annotations

from flask import Flask, render_template


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(404)
    def not_found(_err):
        return render_template("404.html"), 404
