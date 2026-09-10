#!/usr/bin/env bash
# Production web server for Railway / Docker.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

: "${PORT:=8000}"
: "${WEB_CONCURRENCY:=2}"
: "${GUNICORN_TIMEOUT:=120}"

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers "${WEB_CONCURRENCY}" \
  --timeout "${GUNICORN_TIMEOUT}" \
  --access-logfile - \
  --error-logfile -
