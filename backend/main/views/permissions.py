"""
Custom DRF permission classes for the main app.
"""
from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read-only for everyone; write access only for admin/staff."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STAFF"
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """Object-level: owners can access their own objects; admin can access all."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == "STAFF":
            return True
        return obj.user == request.user


class IsAdminOnly(permissions.BasePermission):
    """Only authenticated admin/staff users are allowed."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STAFF"
        )
