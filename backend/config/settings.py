"""
Django settings for the Elevate Digital Client Management System.

Local development runs on SQLite by default. Production simply sets
DATABASE_URL to a Postgres URL - no code change required.
"""

from django.core.exceptions import ImproperlyConfigured
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse

import dj_database_url
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend_dist"
SERVE_SPA = FRONTEND_DIST.is_dir()

load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    raw = os.getenv(name, default)
    return [item.strip() for item in raw.split(",") if item.strip()]


def merge_unique(*groups: list[str]) -> list[str]:
    seen: set[str] = set()
    merged: list[str] = []
    for group in groups:
        for item in group:
            if item and item not in seen:
                seen.add(item)
                merged.append(item)
    return merged


RAILWAY_PUBLIC_DOMAIN = os.getenv("RAILWAY_PUBLIC_DOMAIN", "").strip()
RAILWAY_STATIC_URL = os.getenv("RAILWAY_STATIC_URL", "").strip()
RAILWAY_ENVIRONMENT = os.getenv("RAILWAY_ENVIRONMENT", "").strip()

ON_RAILWAY = bool(
    RAILWAY_ENVIRONMENT
    or RAILWAY_PUBLIC_DOMAIN
    or RAILWAY_STATIC_URL
    or os.getenv("RAILWAY_PROJECT_ID")
    or os.getenv("RAILWAY_SERVICE_ID")
    or "railway.app" in os.getenv("DATABASE_URL", "")
)


def railway_public_host() -> str:
    if RAILWAY_PUBLIC_DOMAIN:
        return RAILWAY_PUBLIC_DOMAIN
    if RAILWAY_STATIC_URL:
        parsed = urlparse(
            RAILWAY_STATIC_URL
            if "://" in RAILWAY_STATIC_URL
            else f"https://{RAILWAY_STATIC_URL}"
        )
        return parsed.hostname or ""
    return ""

# ---------------------------------------------------------------------------
# Core
# ---------------------------------------------------------------------------

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-dev-key-change-me-in-production",
)

# On Railway, default to production mode unless DEBUG is set explicitly.
DEBUG = env_bool("DEBUG", False if ON_RAILWAY else True)

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1,[::1]")
if ON_RAILWAY:
    ALLOWED_HOSTS = merge_unique(ALLOWED_HOSTS, [".up.railway.app"])
_railway_host = railway_public_host()
if _railway_host:
    ALLOWED_HOSTS = merge_unique(ALLOWED_HOSTS, [_railway_host])

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    # Local
    "core",
    "accounts",
    "clients",
    "projects",
    "tasks",
    "invoices",
    "payments",
    "activity",
    "reports",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
]

if SERVE_SPA:
    MIDDLEWARE.append("whitenoise.middleware.WhiteNoiseMiddleware")

MIDDLEWARE.extend(
    [
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
        "django.contrib.messages.middleware.MessageMiddleware",
        "django.middleware.clickjacking.XFrameOptionsMiddleware",
    ]
)

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# ---------------------------------------------------------------------------
# Database — local SQLite; production uses PostgreSQL via DATABASE_URL (Railway).
# ---------------------------------------------------------------------------

_SQLITE_DEFAULT = f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if ON_RAILWAY and (not _DATABASE_URL or _DATABASE_URL.startswith("sqlite")):
    raise ImproperlyConfigured(
        "Railway deploy requires PostgreSQL. In the web service, add a variable reference "
        "to the Postgres plugin DATABASE_URL (not an empty or SQLite URL), then redeploy."
    )

DATABASES = {
    "default": dj_database_url.config(
        default=_DATABASE_URL or _SQLITE_DEFAULT,
        conn_max_age=600,
        conn_health_checks=True,
    )
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

AUTHENTICATION_BACKENDS = [
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Localisation - Elevate Digital operates in Tanzania
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("TIME_ZONE", "Africa/Dar_es_Salaam")
USE_I18N = True
USE_TZ = True

DEFAULT_CURRENCY = os.getenv("DEFAULT_CURRENCY", "TZS")

# ---------------------------------------------------------------------------
# Static / media
# ---------------------------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

if SERVE_SPA:
    WHITENOISE_ROOT = FRONTEND_DIST
    WHITENOISE_MAX_AGE = 31536000
    WHITENOISE_SKIP_COMPRESS_EXTENSIONS = ("jpg", "jpeg", "png", "gif", "webp", "ico", "svg")

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_THROTTLE_RATES": {
        "auth_login": "30/minute",
        "auth_setup": "10/minute",
    },
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
    "DATETIME_FORMAT": "%Y-%m-%d %H:%M:%S",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=int(os.getenv("ACCESS_TOKEN_MINUTES", "60"))),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.getenv("REFRESH_TOKEN_DAYS", "7"))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
}

# ---------------------------------------------------------------------------
# CORS - the React dev server
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = env_list(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
)
if ON_RAILWAY:
    _railway_origin = (
        f"https://{_railway_host}"
        if _railway_host
        else (RAILWAY_STATIC_URL.rstrip("/") if RAILWAY_STATIC_URL.startswith("http") else "")
    )
    if _railway_origin:
        CORS_ALLOWED_ORIGINS = merge_unique(CORS_ALLOWED_ORIGINS, [_railway_origin])
        CSRF_TRUSTED_ORIGINS = merge_unique(CSRF_TRUSTED_ORIGINS, [_railway_origin])

# ---------------------------------------------------------------------------
# Production hardening (only applied when DEBUG is off)
# ---------------------------------------------------------------------------

if not DEBUG:
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
