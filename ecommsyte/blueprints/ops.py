"""Operational endpoints (health, favicon shim)."""
from __future__ import annotations

from flask import Blueprint

bp = Blueprint("ops", __name__)


@bp.route("/healthz")
def healthz():
    """Liveness probe for load balancers / uptime monitors."""
    return {"status": "ok"}, 200


@bp.route("/favicon.ico")
def favicon_ico():
    # Browsers auto-request /favicon.ico; the pages declare favicon.svg, so 204 is correct.
    return "", 204
