"""Test settings for CivicSec Lab."""

import dj_database_url

from .base import *  # noqa: F403

DEBUG = False

DATABASES = {
    "default": dj_database_url.config(default="sqlite:///:memory:"),
}

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
