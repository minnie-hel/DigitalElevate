from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/", views.dashboard, name="report-dashboard"),
    path("revenue/", views.revenue, name="report-revenue"),
    path("projects/", views.project_report, name="report-projects"),
    path("clients/", views.client_report, name="report-clients"),
    path("financial/", views.financial_report, name="report-financial"),
    path("tasks/", views.task_report, name="report-tasks"),
]
