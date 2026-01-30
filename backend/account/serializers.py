from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.conf import settings

from account.models import (
    CustomUser,
    StaffProfile,
    CustomerProfile,
    UserRole,
)


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change requests."""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        """Validate the new password meets requirements."""
        validate_password(value)
        return value

    def validate(self, attrs):
        """Validate that old and new passwords are different."""
        if attrs['old_password'] == attrs['new_password']:
            raise serializers.ValidationError({
                'new_password': ['New password must be different from old password.']
            })
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "role",
            "google_id",
            "email_verified",
            "email_verified_at",
            "is_active",
            "is_staff",
            "is_superuser",
            "last_login",
            "date_joined",
        ]
        read_only_fields = [
            "is_staff",
            "is_superuser",
            "google_id",
            "email_verified",
            "email_verified_at",
            "last_login",
            "date_joined",
        ]


class StaffProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_data = UserSerializer(source="user", read_only=True)

    class Meta:
        model = StaffProfile
        fields = [
            "id",
            "user",
            "user_data",
            "full_name",
            "contact_phone",
            "photo",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "user_data", "created_at", "updated_at"]


class CustomerProfileSerializer(serializers.ModelSerializer):
    """Serializer for customer profile CRUD operations."""
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_data = UserSerializer(source="user", read_only=True)

    class Meta:
        model = CustomerProfile
        fields = [
            "id",
            "user",
            "user_data",
            "full_name",
            "contact_phone",
            "photo",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "user_data", "created_at", "updated_at"]


# ==================== ADMIN SERIALIZERS ====================
# Admin serializers that allow setting the user field and include nested user data


class BaseAdminProfileSerializer(serializers.ModelSerializer):
    """Base admin serializer with common functionality for all profile types."""
    
    user_data = UserSerializer(source="user", read_only=True)
    
    # User creation fields (for auto-creating user when creating profile)
    email = serializers.EmailField(write_only=True, required=False)
    password = serializers.CharField(
        write_only=True,
        required=False,
        style={"input_type": "password"},
        validators=[validate_password],
    )
    # User update fields (for updating user properties)
    # Note: is_active is handled by a separate activate/deactivate endpoint
    
    def validate(self, attrs):
        """Validate that if creating new user, email and password are provided."""
        email = attrs.get("email")
        password = attrs.get("password")
        user = attrs.get("user")
        
        # If user is not provided, email and password are required
        if not user:
            if email and not password:
                raise serializers.ValidationError(
                    {"password": "Password is required when creating a new user."}
                )
            if password and not email:
                raise serializers.ValidationError(
                    {"email": "Email is required when creating a new user."}
                )
        
        return attrs


class AdminStaffProfileSerializer(BaseAdminProfileSerializer, StaffProfileSerializer):
    """Admin serializer that allows setting the user field and includes nested user data."""

    user = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=UserRole.STAFF),
        required=False,
        allow_null=True,
    )

    class Meta(StaffProfileSerializer.Meta):
        fields = StaffProfileSerializer.Meta.fields + ["email", "password"]
        read_only_fields = ["id", "user", "user_data", "created_at", "updated_at"]


class AdminCustomerProfileSerializer(BaseAdminProfileSerializer, CustomerProfileSerializer):
    """Admin serializer that allows setting the user field and includes nested user data."""

    user = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.filter(role=UserRole.CUSTOMER),
        required=False,
        allow_null=True,
    )

    class Meta(CustomerProfileSerializer.Meta):
        fields = CustomerProfileSerializer.Meta.fields + ["email", "password"]
        read_only_fields = ["id", "user", "user_data", "created_at", "updated_at"]


class GoogleAuthSerializer(serializers.Serializer):
    """
    Serializer for Google OAuth authentication.
    Accepts Google user info from frontend.
    Only creates/returns CUSTOMER role users (not for admin staff).
    """
    email = serializers.EmailField(required=True)
    google_id = serializers.CharField(required=True)
    full_name = serializers.CharField(required=False, allow_blank=True)
    picture = serializers.URLField(required=False, allow_blank=True)
    email_verified = serializers.BooleanField(required=False, default=True)

    def validate_email(self, value):
        """Validate email is provided."""
        if not value:
            raise serializers.ValidationError("Email is required.")
        return value.lower()

    def validate_email_verified(self, value):
        """Ensure email is verified by Google."""
        if not value:
            raise serializers.ValidationError("Email must be verified by Google.")
        return value

    def create(self, validated_data):
        """
        This method is not used directly but required by serializer.
        Actual user creation happens in the view.
        """
        return validated_data
