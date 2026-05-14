"""WSGI config for CivicSec Lab."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "civicsec.settings.dev")

application = get_wsgi_application()
