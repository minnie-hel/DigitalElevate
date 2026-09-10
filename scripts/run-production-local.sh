#!/usr/bin/env bash
# Local production-style build + run (uses SQLite unless DATABASE_URL is set).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "$ROOT/scripts/railway-build.sh"
bash "$ROOT/scripts/railway-release.sh"

echo "==> Starting server on http://127.0.0.1:${PORT:-8000}"
export PORT="${PORT:-8000}"
bash "$ROOT/scripts/railway-start.sh"
