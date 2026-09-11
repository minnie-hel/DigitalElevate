from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .throttling import LoginRateThrottle, SetupRateThrottle
from activity.services import log_activity
from core.permissions import IsAdmin, IsAdminOrManager

from .models import TeamMember
from .serializers import (
    ChangePasswordSerializer,
    ElevateTokenObtainPairSerializer,
    SetupSerializer,
    TeamMemberSerializer,
    UserSerializer,
    UserWriteSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ -> access + refresh tokens and the user object."""

    serializer_class = ElevateTokenObtainPairSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]


class LogoutView(APIView):
    """
    POST /api/auth/logout/ -> blacklists the supplied refresh token.

    Only the token sent in the request is revoked (this browser/session).
    Other devices signed in with the same account keep working until they sign out.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "A refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response(
                {"detail": "Token is invalid or already blacklisted."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET/PATCH /api/auth/me/ -> the signed-in user's own profile."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        # Role changes must go through user administration, not self-service.
        serializer.validated_data.pop("role", None)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated."})


class SetupView(APIView):
    """
    One-time bootstrap when the database has no users yet.

    GET  -> { needs_setup: true|false }
    POST -> create the first administrator (201)
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [SetupRateThrottle]

    def get(self, request):
        return Response({"needs_setup": not User.objects.exists()})

    def post(self, request):
        if User.objects.exists():
            return Response(
                {"detail": "An administrator account already exists. Sign in instead."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = SetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    """Administration of login accounts."""

    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name"]
    ordering_fields = ["email", "first_name", "date_joined"]

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return UserWriteSerializer
        return UserSerializer


class TeamMemberViewSet(viewsets.ModelViewSet):
    serializer_class = TeamMemberSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_fields = ["status", "department", "role"]
    search_fields = ["name", "email", "role", "department", "skills"]
    ordering_fields = ["name", "joined_date", "created_at"]

    def get_queryset(self):
        return TeamMember.objects.select_related("user").annotate(
            annotated_open_tasks=Count(
                "tasks",
                filter=~Q(tasks__status="completed"),
                distinct=True,
            ),
            annotated_completed_tasks=Count(
                "tasks",
                filter=Q(tasks__status="completed"),
                distinct=True,
            ),
        )

    def perform_create(self, serializer):
        member = serializer.save()
        log_activity(
            actor=self.request.user,
            action="created",
            entity="team_member",
            entity_id=member.pk,
            entity_name=member.name,
            description=f"added team member {member.name}",
        )

    def perform_update(self, serializer):
        member = serializer.save()
        log_activity(
            actor=self.request.user,
            action="updated",
            entity="team_member",
            entity_id=member.pk,
            entity_name=member.name,
            description=f"updated team member {member.name}",
        )

    def perform_destroy(self, instance):
        name = instance.name
        pk = instance.pk
        instance.delete()
        log_activity(
            actor=self.request.user,
            action="deleted",
            entity="team_member",
            entity_id=pk,
            entity_name=name,
            description=f"removed team member {name}",
        )

    @action(detail=False, methods=["get"])
    def workload(self, request):
        """Open vs completed task counts per active member, for the Team page."""
        members = self.get_queryset().filter(status=TeamMember.Status.ACTIVE)
        return Response(
            [
                {
                    "id": member.id,
                    "name": member.name,
                    "role": member.role,
                    "open_tasks": member.annotated_open_tasks,
                    "completed_tasks": member.annotated_completed_tasks,
                }
                for member in members
            ]
        )
