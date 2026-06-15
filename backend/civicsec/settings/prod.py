"""Production settings for CivicSec Lab."""

from .base import *  # noqa: F403

DEBUG = False

# ── Session & cookies ────────────────────────────────────────────────────────
SESSION_COOKIE_SECURE = env_bool("SESSION_COOKIE_SECURE", True)  # noqa: F405
SESSION_COOKIE_HTTPONLY = True
# 8-hour session lifetime; appropriate for a security platform.
SESSION_COOKIE_AGE = int(os.getenv("SESSION_COOKIE_AGE", str(8 * 60 * 60)))  # noqa: F405
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

CSRF_COOKIE_SECURE = env_bool("CSRF_COOKIE_SECURE", True)  # noqa: F405
# Keep CSRF cookie readable by JS so the frontend can send X-CSRFToken.
CSRF_COOKIE_HTTPONLY = False

# ── Security headers ─────────────────────────────────────────────────────────
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)  # noqa: F405
# Enable HSTS (1 day default; raise to 31536000 + preload once stable on HTTPS).
SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "86400"))  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", True)  # noqa: F405
SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", False)  # noqa: F405

# ── DRF: strip browser UI in production ──────────────────────────────────────
REST_FRAMEWORK = {  # type: ignore[assignment]
    **REST_FRAMEWORK,  # noqa: F405
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}
