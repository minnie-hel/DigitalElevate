from rest_framework.routers import DefaultRouter

from .views import TeamMemberViewSet, UserViewSet

router = DefaultRouter()
router.register("team-members", TeamMemberViewSet, basename="team-member")
router.register("users", UserViewSet, basename="user")

urlpatterns = router.urls
