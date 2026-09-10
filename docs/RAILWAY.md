# Deploying to Railway

This project ships as **one web service**: Gunicorn runs Django, serves the REST API under `/api/`, and serves the built React app for all other routes.

## Prerequisites

- [Railway](https://railway.app/) account
- Git repo connected to Railway (GitHub/GitLab or `railway up`)
- **PostgreSQL** plugin on the same Railway project (recommended for production)

## Quick start

1. **New project** → **Deploy from GitHub** (this repository).

2. **Choose a builder** (pick one — if the build fails with “Railpack could not determine how to build”, use **Dockerfile**):

   | Builder | What to do |
   |---------|------------|
   | **Dockerfile** (recommended) | Service → **Settings** → **Build** → Builder: **Dockerfile**, path `Dockerfile`. Or set variable `RAILWAY_DOCKERFILE_PATH=Dockerfile`. |
   | **Railpack** | Leave default builder; repo includes [`railpack.json`](railpack.json), [`start.sh`](start.sh), and [`build.sh`](build.sh). |

   Config files: [`railway.json`](railway.json), [`railway.toml`](railway.toml). Link the config file in **Settings → Config file path** if Railway does not pick it up automatically (`/railway.json`).

3. **Add PostgreSQL** → Railway injects `DATABASE_URL` into the web service.

4. **Generate a public URL** (no custom domain needed):

   - Open your **web service** → **Settings** → **Networking** → **Generate Domain**.
   - Railway sets `RAILWAY_PUBLIC_DOMAIN` (e.g. `digital-elevate-production.up.railway.app`).
   - This app **automatically** adds that host to `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS`.

5. **Set one required variable**:

   | Variable | Value |
   |----------|--------|
   | `SECRET_KEY` | long random string |

   Generate one locally:

   ```bash
   bash scripts/railway-print-env.sh
   ```

   You do **not** need `ALLOWED_HOSTS` or `CSRF_TRUSTED_ORIGINS` for the default `*.up.railway.app` URL.

6. **Deploy**. On each deploy:

   - Frontend is built with `VITE_API_URL=/api` (same origin).
   - `collectstatic` runs for Django admin assets.
   - Migrations run via Docker entrypoint + Railway `releaseCommand`.

6. **First login** — open your `https://….up.railway.app` URL in a browser. If no users exist, use the **setup** form to create the first admin. Or run locally against the same DB:

   ```bash
   cd backend && python manage.py create_admin --email admin@elevate.co.tz --password 'YourPassword'
   ```

## Shell scripts

| Script | Purpose |
|--------|---------|
| [`scripts/railway-build.sh`](scripts/railway-build.sh) | Build frontend, copy to `backend/frontend_dist`, `collectstatic` |
| [`scripts/railway-release.sh`](scripts/railway-release.sh) | `migrate --noinput` |
| [`scripts/railway-start.sh`](scripts/railway-start.sh) | Gunicorn on `$PORT` |
| [`scripts/run-production-local.sh`](scripts/run-production-local.sh) | Test production build locally |
| [`scripts/docker-entrypoint.sh`](scripts/docker-entrypoint.sh) | Used by Dockerfile (migrate + exec) |

Make them executable once:

```bash
chmod +x scripts/*.sh
```

### Nixpacks (without Docker)

If you prefer not to use the Dockerfile, set the Railway service **Build Command** to:

```bash
bash scripts/railway-build.sh
```

**Start Command:**

```bash
bash scripts/railway-start.sh
```

**Release Command:**

```bash
bash scripts/railway-release.sh
```

Ensure the service has **Node 20+** and **Python 3.12+** (Railway Nixpacks or custom image).

## Health check

`railway.toml` uses `/` as the health check path (SPA or API root).

## Split frontend + API (optional)

The default Dockerfile serves everything from one domain. If you deploy the API and a static frontend separately:

1. Build frontend with `VITE_API_URL=https://your-api.up.railway.app/api`.
2. Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` on the API to the frontend URL.
3. Do **not** copy `frontend_dist` into the API image (API-only deploy).

## Troubleshooting

- **Railpack could not determine how to build / start.sh not found** — Switch the service builder to **Dockerfile** (`Dockerfile` at repo root), or redeploy after pulling the latest commit (includes `railpack.json`, `start.sh`, `build.sh`). Remove any stray root `package-lock.json` without a `package.json`.
- **502 / crash on boot** — check deploy logs; confirm `DATABASE_URL` and `SECRET_KEY` are set.
- **DisallowedHost** — add your Railway domain to `ALLOWED_HOSTS`.
- **CSRF / login fails over HTTPS** — set `CSRF_TRUSTED_ORIGINS=https://...` and `DEBUG=False`.
- **Blank page** — confirm the Docker build finished the frontend stage; `backend/frontend_dist/index.html` must exist in the image.

## Questions?

If you use a **custom domain**, **Railway team/environment layout**, or want **separate staging/production** services, note your setup and we can adjust `ALLOWED_HOSTS` / build vars accordingly.
