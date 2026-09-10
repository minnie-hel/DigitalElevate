"""
Admin forms for the custom user model.

Django's stock UserCreationForm and UserChangeForm are bound to the built-in
auth.User and expect a `username` field, so the admin needs its own pair
pointed at this project's email-based model.
"""

from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm

from .models import User


class AdminUserCreationForm(BaseUserCreationForm):
    class Meta(BaseUserCreationForm.Meta):
        model = User
        fields = ("email", "first_name", "last_name", "role")


class AdminUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"
