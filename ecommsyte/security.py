"""Security headers.

Safe, non-breaking hardening only — these headers never alter rendered content, so the
UI/UX stays identical. (No CSP is set, to avoid interfering with the fonts, images,
Formspree and Calendly the pages already load.)
"""
from __future__ import annotations

from flask import Flask, Response


def register_security(app: Flask) -> None:
    @app.after_request
    def _security_headers(resp: Response) -> Response:
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        return resp
