#!/usr/bin/env bash
# Build the React app and stage files for Django to serve (SPA + /assets).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend"
DIST="$BACKEND/frontend_dist"

echo "==> Building frontend (VITE_API_URL=${VITE_API_URL:-/api})"
cd "$FRONTEND"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi
VITE_API_URL="${VITE_API_URL:-/api}" npm run build

echo "==> Copying frontend dist to backend/frontend_dist"
rm -rf "$DIST"
cp -a "$FRONTEND/dist" "$DIST"

echo "==> Installing Python dependencies"
cd "$BACKEND"
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt

echo "==> Collecting Django static files (admin, etc.)"
python3 manage.py collectstatic --noinput

echo "==> Build complete."
