#!/bin/sh
# Docker entrypoint: migrate (PostgreSQL tables) then run the container CMD (gunicorn).
set -e
cd /app/backend
if ! python manage.py migrate --noinput; then
  echo "==> migrate failed. On Railway, link PostgreSQL DATABASE_URL to this web service." >&2
  exit 1
fi
if [ "$#" -eq 0 ]; then
  set -- sh -c 'exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --timeout ${GUNICORN_TIMEOUT:-120} --access-logfile - --error-logfile -'
fi
exec "$@"
