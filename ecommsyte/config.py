"""Environment-driven configuration.

Select with ``APP_ENV`` (or ``FLASK_ENV``): ``production`` (default) · ``development`` ·
``testing``. Everything sensitive comes from environment variables.
"""
from __future__ import annotations

import os


def _flag(name: str, default: bool = False) -> bool:
    return os.environ.get(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


class BaseConfig:
    """Shared defaults."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")
    JSON_SORT_KEYS = False
    # Cache static assets (styles/js/images) for a day in production; pages stay fresh.
    SEND_FILE_MAX_AGE_DEFAULT = int(os.environ.get("SEND_FILE_MAX_AGE_DEFAULT", "0"))
    # Trust one hop of reverse-proxy headers (X-Forwarded-For/Proto/Host).
    USE_PROXY_FIX = _flag("USE_PROXY_FIX", False)


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False
    # Almost always deployed behind a proxy (Render/Railway/Nginx) → on by default.
    USE_PROXY_FIX = _flag("USE_PROXY_FIX", True)


class TestingConfig(BaseConfig):
    TESTING = True


_CONFIGS: dict[str, type[BaseConfig]] = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config(name: str | None = None) -> type[BaseConfig]:
    """Resolve a config class from a name or the environment (defaults to production)."""
    key = (name or os.environ.get("APP_ENV") or os.environ.get("FLASK_ENV") or "production").lower()
    return _CONFIGS.get(key, ProductionConfig)
