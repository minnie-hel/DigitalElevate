"""Root URL configuration for the Elevate Digital CMS API."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from .views import api_root, spa_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls_auth")),
    path("api/", include("accounts.urls")),
    path("api/", include("clients.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("tasks.urls")),
    path("api/", include("invoices.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("activity.urls")),
    path("api/reports/", include("reports.urls")),
]

if settings.SERVE_SPA:
    urlpatterns.extend(
        [
            path("", spa_index, name="spa-index"),
            re_path(
                r"^(?!api/|admin/|static/|media/|assets/).*$",
                spa_index,
                name="spa-fallback",
            ),
        ]
    )
else:
    urlpatterns.insert(0, path("", api_root, name="api-root"))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
