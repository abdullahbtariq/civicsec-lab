# Deployment Guide

This guide covers running CivicSec Lab in environments beyond local Docker Compose development.

**Prerequisites for all deployment targets**: a running PostgreSQL 15+ database, a Redis 7+ instance, and the ability to set environment variables.

> **Data safety**: never deploy with real personal data until production hardening is complete. See the security checklist at the bottom of this page.

---

## Option A: Local Docker Compose (development/demo)

The quickest way to run the full stack locally.

```powershell
git clone https://github.com/your-org/civicsec-lab.git
cd civicsec-lab
Copy-Item .env.example .env
docker compose up --build
```

Then seed:

```powershell
docker compose exec backend python manage.py seed_demo
docker compose exec backend python manage.py generate_synthetic_logs
docker compose exec backend python manage.py run_loglens_detection
docker compose exec backend python manage.py seed_observatory
docker compose exec backend python manage.py seed_playbooks
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin/

---

## Option B: Railway (recommended for quick hosted demo)

[Railway](https://railway.app) can deploy the backend and frontend from a single repo.

### 1. Create a Railway project

```bash
railway login
railway init
```

### 2. Add services

Add three services from the Railway dashboard:
- **PostgreSQL** plugin
- **Redis** plugin
- **Backend** (from `./backend/` directory)

### 3. Configure backend environment variables

In the Railway backend service settings, set:

```
DJANGO_SETTINGS_MODULE=civicsec.settings.production
SECRET_KEY=<generate a strong random value>
DEBUG=False
ALLOWED_HOSTS=<your-railway-backend-domain>
DATABASE_URL=<Railway PostgreSQL connection string>
REDIS_URL=<Railway Redis connection string>
CSRF_TRUSTED_ORIGINS=https://<your-railway-backend-domain>
CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>
CORS_ALLOW_CREDENTIALS=True
```

### 4. Set the start command

In Railway, set the backend start command to:

```bash
python manage.py migrate --noinput && python manage.py runserver 0.0.0.0:$PORT
```

For a production deployment, replace `runserver` with `gunicorn`:

```bash
python manage.py migrate --noinput && gunicorn civicsec.wsgi:application --bind 0.0.0.0:$PORT
```

Add `gunicorn` to `backend/requirements.txt` if not already present.

### 5. Deploy the frontend

Add a **Static Site** service for `./frontend/`:
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<your-railway-backend-domain>`

### 6. Seed the database

After the backend is running, use the Railway CLI to run seed commands:

```bash
railway run python manage.py seed_demo
railway run python manage.py generate_synthetic_logs
railway run python manage.py run_loglens_detection
railway run python manage.py seed_observatory
railway run python manage.py seed_playbooks
```

---

## Option C: fly.io

[fly.io](https://fly.io) is a good option for persistent hobby deployments.

### Backend

```bash
cd backend
fly launch --name civicsec-backend --no-deploy
```

Update the generated `fly.toml`:

```toml
[build]
  dockerfile = "Dockerfile"

[env]
  DJANGO_SETTINGS_MODULE = "civicsec.settings.production"
  DEBUG = "False"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

Add secrets:

```bash
fly secrets set SECRET_KEY="<strong random value>"
fly secrets set DATABASE_URL="<fly postgres connection string>"
fly secrets set REDIS_URL="<fly redis connection string>"
fly secrets set ALLOWED_HOSTS="civicsec-backend.fly.dev"
```

Deploy:

```bash
fly deploy
fly ssh console -C "python manage.py migrate --noinput"
fly ssh console -C "python manage.py seed_demo"
```

### Frontend

Build and host the React app as a static site on fly.io, Vercel, Netlify, or Cloudflare Pages.

```bash
cd frontend
VITE_API_BASE_URL=https://civicsec-backend.fly.dev npm run build
# deploy the dist/ folder to your static hosting provider
```

---

## Backend Dockerfile

A minimal production Dockerfile for the backend:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=civicsec.settings.production

CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn civicsec.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2"]
```

---

## Production Settings

`civicsec.settings.production` (or create if not present) should set:

```python
from .base import *

DEBUG = False
SECRET_KEY = env("SECRET_KEY")
ALLOWED_HOSTS = env.list("ALLOWED_HOSTS")
DATABASES = {"default": env.db("DATABASE_URL")}
CACHES = {"default": env.cache("REDIS_URL")}

# Security headers
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## Production Security Checklist

Before exposing the platform to real users or real data:

- [ ] `DEBUG = False`
- [ ] `SECRET_KEY` is a long random string, not the development default
- [ ] `ALLOWED_HOSTS` is explicitly set to your domain(s)
- [ ] `SECURE_SSL_REDIRECT = True` (HTTPS only)
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] Database credentials are strong and rotated from the dev defaults
- [ ] Redis is not publicly accessible (internal network only)
- [ ] Static files served via whitenoise or CDN, not Django's `runserver`
- [ ] `DEBUG`-level logging disabled in production
- [ ] Demo seed accounts changed or removed
- [ ] No real personal data uploaded until this list is complete
- [ ] Rate limiting added to trigger endpoints (KEV ingest, detection run)
- [ ] File upload size limits reviewed for your storage quota
- [ ] `CORS_ALLOWED_ORIGINS` set to your exact frontend domain (not `*`)

---

## spaCy Model (Observatory NLP)

The Observatory NLP pipeline requires the spaCy `en_core_web_sm` model. If deploying from scratch:

```bash
python -m spacy download en_core_web_sm
```

In Docker, add this to the Dockerfile or to the `requirements.txt`-equivalent post-install step:

```dockerfile
RUN python -m spacy download en_core_web_sm
```

---

## Celery Workers (optional)

In v1.0 the NLP pipeline and KEV ingestion run synchronously. If you want to move them to async Celery tasks in a future version, start a Celery worker alongside the backend:

```bash
celery -A civicsec worker --loglevel=info
```

The `REDIS_URL` environment variable is already wired as the Celery broker.
