from django.http import FileResponse, JsonResponse


def api_root(request):
    """
    Friendly response at /. The React app is the user interface; this
    server is JSON-only under /api/.
    """
    return JsonResponse(
        {
            "service": "Elevate Digital Client Management API",
            "message": "Use the React frontend for the UI, or call the API paths below.",
            "frontend": "http://localhost:5173/",
            "endpoints": {
                "login": "/api/auth/login/",
                "setup": "/api/auth/setup/",
                "admin": "/admin/",
                "clients": "/api/clients/",
                "projects": "/api/projects/",
                "tasks": "/api/tasks/",
                "invoices": "/api/invoices/",
                "payments": "/api/payments/",
                "team_members": "/api/team-members/",
                "reports_dashboard": "/api/reports/dashboard/",
            },
        }
    )


def spa_index(request):
    """React router paths — serve the built SPA entry."""
    from django.conf import settings

    index_path = settings.FRONTEND_DIST / "index.html"
    if not index_path.is_file():
        return api_root(request)
    return FileResponse(index_path.open("rb"), content_type="text/html; charset=utf-8")
