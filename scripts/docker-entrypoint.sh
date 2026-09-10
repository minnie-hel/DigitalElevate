#!/bin/sh
# Docker entrypoint: migrate then run the container CMD (gunicorn).
set -e
cd /app/backend
python manage.py migrate --noinput
exec "$@"
