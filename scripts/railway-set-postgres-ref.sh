#!/usr/bin/env bash
# Link DigitalElevate web service to PostgreSQL via DATABASE_URL reference.
#
# Prerequisites:
#   npm install -g @railway/cli
#   railway login
#   railway link   # select project blissful-charisma / DigitalElevate
#
# Usage:
#   bash scripts/railway-set-postgres-ref.sh
#   bash scripts/railway-set-postgres-ref.sh PostgreSQL   # if DB service is not named "Postgres"
#
set -euo pipefail

DB_SERVICE="${1:-Postgres}"
REF='${{ '"${DB_SERVICE}"'.DATABASE_URL }}'

echo "Setting DATABASE_URL reference on linked Railway service:"
echo "  DATABASE_URL=${REF}"
echo ""
echo "If this fails, set it in the dashboard:"
echo "  DigitalElevate → Variables → New Variable → Reference → ${DB_SERVICE} → DATABASE_URL"
echo ""

if ! command -v railway >/dev/null 2>&1; then
  echo "Install CLI: npm install -g @railway/cli && railway login && railway link"
  exit 1
fi

railway variables set "DATABASE_URL=${REF}"

echo ""
echo "Done. Redeploy DigitalElevate in Railway, then check:"
echo "  https://YOUR-APP.up.railway.app/api/auth/setup/"
echo '  Expect: "postgres_linked": true, "database": "postgresql"'
