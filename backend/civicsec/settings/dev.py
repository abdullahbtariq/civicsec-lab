"""Development settings for CivicSec Lab."""

from .base import *  # noqa: F403

DEBUG = True
ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,backend")  # noqa: F405
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
