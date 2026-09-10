from django.http import JsonResponse


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
