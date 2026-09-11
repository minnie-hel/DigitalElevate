#!/bin/sh
# Docker entrypoint: migrate (PostgreSQL tables) then run gunicorn.
set -e
cd /app/backend
python manage.py migrate --noinput
exec "$@"
