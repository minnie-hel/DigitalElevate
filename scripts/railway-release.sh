#!/usr/bin/env bash
# Run database migrations (Railway release phase or manual).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

python3 manage.py migrate --noinput
echo "==> Migrations applied."
