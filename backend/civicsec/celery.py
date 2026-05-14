"""Celery application for CivicSec Lab."""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "civicsec.settings.dev")

app = Celery("civicsec")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()
