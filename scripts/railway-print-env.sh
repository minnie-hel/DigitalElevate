#!/usr/bin/env bash
# Print the minimum Railway variables (no custom domain required).
set -euo pipefail

SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))' 2>/dev/null || openssl rand -base64 48)"

cat <<EOF
Railway web service — set these in: Project → your service → Variables

  SECRET_KEY=${SECRET}

Optional (auto-configured from RAILWAY_PUBLIC_DOMAIN when Railway assigns *.up.railway.app):
  ALLOWED_HOSTS        — leave unset unless you add a custom domain later
  CSRF_TRUSTED_ORIGINS — leave unset unless you add a custom domain later
  DEBUG                — leave unset (defaults to False on Railway)

Required:
  1. Add PostgreSQL plugin to the project (DATABASE_URL is injected automatically).
  2. Generate public URL: Service → Settings → Networking → Generate Domain.

Then redeploy and open the *.up.railway.app URL in your browser.
EOF
