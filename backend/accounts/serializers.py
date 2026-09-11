from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import TeamMember

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    team_member_id = serializers.IntegerField(source="team_member.id", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "is_staff",
            "is_superuser",
            "date_joined",
            "team_member_id",
        )
        read_only_fields = ("is_staff", "is_superuser", "date_joined")


class UserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "password",
        )

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class ElevateTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds identity claims to the token and returns the user with the pair."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["role"] = user.role
        token["name"] = user.get_full_name()
        return token

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        if isinstance(email, str):
            attrs[self.username_field] = User.objects.normalize_email(email.strip())
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


class SetupSerializer(serializers.Serializer):
    """First administrator account, allowed only while no users exist."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True, default="")
    last_name = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_email(self, value):
        return User.objects.normalize_email(value)

    def create(self, validated_data):
        return User.objects.create_superuser(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )


class TeamMemberSerializer(serializers.ModelSerializer):
    skill_list = serializers.ListField(child=serializers.CharField(), read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    # Workload figures. Annotated by the viewset queryset; recomputed here as a
    # fallback so the serializer stays usable outside that queryset.
    open_task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()

    class Meta:
        model = TeamMember
        fields = (
            "id",
            "user",
            "user_email",
            "name",
            "email",
            "phone",
            "role",
            "department",
            "skills",
            "skill_list",
            "status",
            "status_display",
            "joined_date",
            "open_task_count",
            "completed_task_count",
            "created_at",
            "updated_at",
        )

    def get_open_task_count(self, obj):
        annotated = getattr(obj, "annotated_open_tasks", None)
        if annotated is not None:
            return annotated
        return obj.tasks.exclude(status="completed").count()

    def get_completed_task_count(self, obj):
        annotated = getattr(obj, "annotated_completed_tasks", None)
        if annotated is not None:
            return annotated
        return obj.tasks.filter(status="completed").count()
