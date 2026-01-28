from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from django.http import JsonResponse
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.password_validation import validate_password
import logging

from .utils import generate_verification_token
from .token_serializers import CustomTokenObtainPairSerializer
from .tasks import send_email_verification, send_password_reset_email, send_welcome_email

from account.models import (
    CustomUser,
    StaffProfile,
    CustomerProfile,
    UserRole,
)
from account.serializers import (
    StaffProfileSerializer,
    CustomerProfileSerializer,
    AdminStaffProfileSerializer,
    AdminCustomerProfileSerializer,
    ChangePasswordSerializer,
)


class BaseOwnProfileViewSet(viewsets.ModelViewSet):
    """
    Base class for 'my profile' behavior:
    - Only authenticated users
    - List returns the current user's profile as a single object (not array)
    - Retrieve/update/destroy limited to current user's profile
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Child classes must implement `get_profile_queryset_for_user`.
        base_qs = self.get_profile_queryset_for_user(self.request.user)
        return base_qs

    def get_profile_queryset_for_user(self, user):
        raise NotImplementedError

    def perform_create(self, serializer):
        # Child classes should pass in the correct `user` instance.
        serializer.save(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        Override list to return a single object instead of an array.
        Returns the current user's profile or 404 if not found.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get the first (and should be only) profile for the user
        profile = queryset.first()
        
        if profile is None:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Handle GET (list)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request, *args, **kwargs):
        """
        Update the current user's profile.
        Supports both PUT (full update) and PATCH (partial update).
        This custom action allows PUT/PATCH on the list endpoint.
        """
        queryset = self.filter_queryset(self.get_queryset())
        profile = queryset.first()
        
        if profile is None:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        partial = request.method == 'PATCH'
        serializer = self.get_serializer(profile, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class StaffProfileViewSet(BaseOwnProfileViewSet):
    """
    CRUD for the authenticated staff/admin user's own profile.
    """

    serializer_class = StaffProfileSerializer

    def get_profile_queryset_for_user(self, user):
        if not user.is_authenticated or user.role != UserRole.STAFF:
            return StaffProfile.objects.none()
        return StaffProfile.objects.select_related('user').filter(user=user)


class CustomerProfileViewSet(BaseOwnProfileViewSet):
    """
    CRUD for the authenticated customer's own profile.
    Customers can browse and book tours - no commission or referral logic.
    """

    serializer_class = CustomerProfileSerializer

    def get_profile_queryset_for_user(self, user):
        if not user.is_authenticated:
            return CustomerProfile.objects.none()
        # Check if user has customer profile
        if not user.is_customer:
            return CustomerProfile.objects.none()
        return CustomerProfile.objects.select_related('user').filter(user=user)
    
    def perform_create(self, serializer):
        """
        Create customer profile for current user.
        Customers don't need approval - instant access to browse and book tours.
        """
        # Check if user already has a customer profile
        if hasattr(self.request.user, 'customer_profile'):
            raise ValidationError(
                {"detail": "You already have a customer profile."}
            )
        serializer.save(user=self.request.user)


# ==================== ADMIN VIEWSETS ====================
# Admin-only viewsets for managing all profiles (CRUD except delete)


class BaseAdminProfileViewSet(viewsets.ModelViewSet):
    """
    Base class for admin profile management:
    - Admin-only access (is_staff required)
    - Full CRUD except delete (destroy disabled)
    - Lists all profiles, not just current user's
    - Supports auto-creating user when creating profile
    """

    permission_classes = [permissions.IsAdminUser]

    def get_user_role(self):
        """Override in subclasses to return the appropriate UserRole."""
        raise NotImplementedError("Subclasses must implement get_user_role()")

    def _create_user_if_needed(self, validated_data):
        """Create user if email and password provided and user not set."""
        email = validated_data.pop("email", None)
        password = validated_data.pop("password", None)
        user = validated_data.get("user")
        
        if not user and email and password:
            try:
                with transaction.atomic():
                    user_role = self.get_user_role()
                    # Staff users need is_staff=True to access admin endpoints
                    is_staff = user_role == UserRole.STAFF
                    # Staff users automatically have their email verified
                    email_verified = user_role == UserRole.STAFF
                    email_verified_at = timezone.now() if email_verified else None
                    user = CustomUser.objects.create_user(
                        email=email,
                        password=password,
                        role=user_role,
                        is_active=True,
                        is_staff=is_staff,
                        email_verified=email_verified,
                        email_verified_at=email_verified_at,
                    )
                    validated_data["user"] = user
            except IntegrityError as e:
                # Check if it's an email uniqueness constraint violation
                error_message = str(e)
                if "email" in error_message.lower() or "account_customuser_email_key" in error_message:
                    raise serializers.ValidationError(
                        {"email": [f"Email {email} sudah terdaftar. Silakan gunakan email lain."]}
                    )
                # For other integrity errors, re-raise with a generic message
                raise serializers.ValidationError(
                    {"non_field_errors": ["Terjadi kesalahan saat membuat pengguna. Data mungkin sudah ada."]}
                )
        elif user:
            # Validate that existing user has the correct role
            expected_role = self.get_user_role()
            if user.role != expected_role:
                raise serializers.ValidationError(
                    {"user": f"User must have role '{expected_role}', but has '{user.role}'."}
                )
        
        return validated_data

    def _update_user_data(self, instance, data):
        """Update user email if provided."""
        email = data.pop("email", None)
        # Note: is_active is handled by a separate activate/deactivate endpoint
        
        if instance.user and email is not None:
            if email != instance.user.email:
                if CustomUser.objects.filter(email=email).exclude(pk=instance.user.pk).exists():
                    raise serializers.ValidationError(
                        {"email": [f"Email {email} sudah terdaftar. Silakan gunakan email lain."]}
                    )
                try:
                    instance.user.email = email
                    instance.user.save()
                except IntegrityError as e:
                    error_message = str(e)
                    if "email" in error_message.lower() or "account_customuser_email_key" in error_message:
                        raise serializers.ValidationError(
                            {"email": [f"Email {email} sudah terdaftar. Silakan gunakan email lain."]}
                        )
                    raise serializers.ValidationError(
                        {"email": ["Terjadi kesalahan saat memperbarui email. Silakan coba lagi."]}
                    )

    def create(self, request, *args, **kwargs):
        """Create profile. If user doesn't exist and email/password provided, auto-create user."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data.copy()
        validated_data = self._create_user_if_needed(validated_data)
        
        # Remove user creation fields from serializer's validated_data before saving
        serializer.validated_data.pop("email", None)
        serializer.validated_data.pop("password", None)
        
        # Update serializer's validated_data with the user (if created)
        if "user" in validated_data:
            serializer.validated_data["user"] = validated_data["user"]
        
        profile = serializer.save()
        
        response_serializer = self.get_serializer(profile)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """Update profile. Also allows updating user email."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        data = request.data.copy()
        
        self._update_user_data(instance, data)
        
        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """
        Disable delete action for profiles.
        Deactivate the associated user instead.
        """
        return Response(
            {
                "error": "Delete is not allowed. Deactivate the associated user account instead."
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class AdminStaffProfileViewSet(BaseAdminProfileViewSet):
    """Admin-only CRUD (except delete) for managing all staff profiles."""

    queryset = StaffProfile.objects.select_related("user").order_by("-created_at")
    serializer_class = AdminStaffProfileSerializer
    filterset_fields = ["user__is_active"]
    search_fields = ["full_name", "user__email"]
    
    def list(self, request, *args, **kwargs):
        """
        List all staff profiles with pagination.
        Use parent's list method which properly handles pagination via DEFAULT_PAGINATION_CLASS.
        """
        # Use parent's list method - it automatically applies pagination from settings
        # DEFAULT_PAGINATION_CLASS is 'rest_framework.pagination.PageNumberPagination'
        # which respects PAGE_SIZE_QUERY_PARAM='page_size' to allow custom page sizes
        return super().list(request, *args, **kwargs)

    def get_user_role(self):
        return UserRole.STAFF


class AdminCustomerProfileViewSet(BaseAdminProfileViewSet):
    """Admin-only CRUD (except delete) for managing all customer profiles."""

    queryset = CustomerProfile.objects.select_related("user").order_by("-created_at")
    serializer_class = AdminCustomerProfileSerializer
    filterset_fields = ["user__is_active"]
    search_fields = ["full_name", "user__email", "contact_phone"]
    
    def list(self, request, *args, **kwargs):
        """
        List all customer profiles with pagination.
        Use parent's list method which properly handles pagination via DEFAULT_PAGINATION_CLASS.
        """
        # Use parent's list method - it automatically applies pagination from settings
        # DEFAULT_PAGINATION_CLASS is 'rest_framework.pagination.PageNumberPagination'
        # which respects PAGE_SIZE_QUERY_PARAM='page_size' to allow custom page sizes
        return super().list(request, *args, **kwargs)

    def get_user_role(self):
        return UserRole.CUSTOMER


# ==================== USER INFO ENDPOINT ====================


class CurrentUserView(APIView):
    """
    API endpoint to get current authenticated user information.
    Used by frontend to get user info since tokens are in httpOnly cookies.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Return current user information."""
        user = request.user
        from account.models import UserRole
        
        # Get profile info - now supports dual roles
        full_name = user.email
        photo_url = None
        
        # Check for staff profile
        if user.role == UserRole.STAFF and hasattr(user, "staff_profile"):
            try:
                profile = user.staff_profile
                if not full_name or full_name == user.email:
                    full_name = profile.full_name
                if not photo_url and profile.photo:
                    photo_url = request.build_absolute_uri(profile.photo.url) if request else profile.photo.url
            except Exception:
                pass
        
        # Check for customer profile
        if user.role == UserRole.CUSTOMER and hasattr(user, "customer_profile"):
            try:
                profile = user.customer_profile
                if not full_name or full_name == user.email:
                    full_name = profile.full_name
                if not photo_url and profile.photo:
                    photo_url = request.build_absolute_uri(profile.photo.url) if request else profile.photo.url
            except Exception:
                pass
        
        return Response({
            'id': user.id,
            'email': user.email,
            'role': user.role,  # Primary role for backward compatibility
            'full_name': full_name,
            'profile_picture_url': photo_url,
            'email_verified': user.email_verified,
            'roles_display': user.get_roles_display(),
        })


# ==================== LOGOUT ENDPOINT ====================

class LogoutView(APIView):
    """
    API endpoint to logout user by clearing httpOnly cookies.
    Also blacklists the refresh token if provided.
    """
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated access
    authentication_classes = []  # No authentication required for logout

    def post(self, request):
        """Logout user by clearing authentication cookies."""
        
        logger = logging.getLogger(__name__)
        
        # Try to blacklist the refresh token if available
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info("Refresh token blacklisted successfully")
            except Exception as e:
                # If blacklisting fails, continue with logout anyway
                logger.warning(f"Failed to blacklist token: {e}")
        
        # Use Django's JsonResponse for better cookie handling
        response = JsonResponse({'detail': 'Successfully logged out.'})
        
        # Use Django's delete_cookie - this is the most reliable way
        # It sets the cookie to empty string with max_age=0 and expires in the past
        response.delete_cookie('access_token', path='/')
        response.delete_cookie('refresh_token', path='/')
        response.delete_cookie('csrftoken', path='/')
        response.delete_cookie('sessionid', path='/')
        
        logger.info(f"Logout: delete_cookie called for all auth cookies")
        
        return response


# ==================== PASSWORD CHANGE ENDPOINT ====================
# Universal endpoint for all user types to change their password

class ChangePasswordView(APIView):
    """
    API endpoint for authenticated users to change their password.
    Works for all user types (STAFF, SUPPLIER, RESELLER).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """Change the authenticated user's password."""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        # Verify old password
        if not user.check_password(old_password):
            return Response(
                {'old_password': ['Current password is incorrect.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        try:
            user.set_password(new_password)
            user.save()
            
            # Log password change for audit trail
            import logging
            logger = logging.getLogger(__name__)
            logger.info(
                f"Password changed",
                extra={
                    'user_id': user.id,
                    'user_role': user.role,
                    'ip_address': self.get_client_ip(request),
                }
            )
            
            return Response(
                {'detail': 'Password has been successfully changed.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': f'An error occurred while changing password: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @staticmethod
    def get_client_ip(request):
        """Extract client IP address from request, handling proxies."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


# ==================== EMAIL VERIFICATION ENDPOINTS ====================

class SendEmailVerificationView(APIView):
    """
    API endpoint for admin to send email verification to a user.
    Also allows users to send verification to themselves.
    Works for all user types (STAFF, CUSTOMER).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        """Send email verification email to the specified user."""
        try:
            user = CustomUser.objects.get(pk=user_id)
            
            # Allow users to send verification to themselves, or require admin for others
            if not request.user.is_staff and request.user.id != user_id:
                return Response(
                    {'detail': 'You do not have permission to send verification email to this user.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Send verification email asynchronously
            send_email_verification.delay(user.id)
            
            return Response(
                {'detail': f'Verification email has been sent to {user.email}.'},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'An error occurred while sending verification email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RequestPasswordResetView(APIView):
    """
    Public API endpoint for users to request password reset by email.
    Works for all user types (STAFF, CUSTOMER).
    No authentication required.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Send password reset email to the user with the provided email."""
        email = request.data.get('email')
        
        if not email:
            return Response(
                {'email': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = CustomUser.objects.get(email=email.lower().strip())
            
            # Generate password reset token using utility function
            from account.utils import generate_verification_token
            uidb64, token = generate_verification_token(user)
            reset_token = f"{uidb64}/{token}"
            
            # Send password reset email asynchronously
            send_password_reset_email.delay(user.id, reset_token)
            
            # Always return success message (security: don't reveal if email exists)
            return Response(
                {'detail': 'If an account with that email exists, a password reset email has been sent.'},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            # Don't reveal if email exists or not (security best practice)
            return Response(
                {'detail': 'If an account with that email exists, a password reset email has been sent.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': f'An error occurred while sending password reset email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResetPasswordView(APIView):
    """
    API endpoint for admin to send password reset email to a user.
    Works for all user types (STAFF, CUSTOMER).
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, user_id):
        """Send password reset email to the specified user."""
        try:
            user = CustomUser.objects.get(pk=user_id)
            
            # Generate password reset token using utility function
            
            uidb64, token = generate_verification_token(user)
            reset_token = f"{uidb64}/{token}"
            
            # Send password reset email asynchronously
            send_password_reset_email.delay(user.id, reset_token)
            
            return Response(
                {'detail': f'Password reset email has been sent to {user.email}.'},
                status=status.HTTP_200_OK
            )
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'detail': f'An error occurred while sending password reset email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResetPasswordConfirmView(APIView):
    """
    API endpoint to reset user password using uid and token from email link.
    No authentication required - uses token-based verification.
    
    Token Security:
    - Tokens are generated using Django's make_token() with 1-day expiration
    - Tokens are automatically invalidated when the password changes
    - This is because tokens include a hash of the current password
    - Cannot be reused after password reset
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        """Reset user password using uid and token."""
        try:
            # Decode user ID from base64
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid password reset link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if token is valid
        # Django's token includes password hash, so it's automatically invalidated after password change
        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Invalid or expired password reset token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password
        new_password = request.data.get('new_password')
        if not new_password:
            return Response(
                {'new_password': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password using Django's password validators
        try:
            validate_password(new_password, user)
        except Exception as e:
            return Response(
                {'new_password': list(e.messages) if hasattr(e, 'messages') else [str(e)]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Reset the password
        try:
            user.set_password(new_password)
            user.save()
            
            # Log password reset for audit trail
            import logging
            logger = logging.getLogger(__name__)
            logger.info(
                f"Password reset successful",
                extra={
                    'user_id': user.id,
                    'email': user.email,
                }
            )
            
            return Response(
                {
                    'detail': 'Password has been successfully reset. You can now login with your new password.',
                    'email': user.email,
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': f'An error occurred while resetting password: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyEmailView(APIView):
    """
    API endpoint to verify user email using uid and token from email link.
    No authentication required - uses token-based verification.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, uidb64, token):
        """Verify user email using uid and token."""
        try:
            # Decode user ID from base64
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            return Response(
                {'detail': 'Invalid verification link.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if token is valid
        if not default_token_generator.check_token(user, token):
            return Response(
                {'detail': 'Invalid or expired verification token.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if email is already verified
        if user.email_verified:
            return Response(
                {'detail': 'Email has already been verified.'},
                status=status.HTTP_200_OK
            )

        # Verify the email
        try:
            user.email_verified = True
            user.email_verified_at = timezone.now()
            user.save()
            
            return Response(
                {
                    'detail': 'Email has been successfully verified.',
                    'email': user.email,
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': f'An error occurred while verifying email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== ACTIVATE/DEACTIVATE ACCOUNT ENDPOINT ====================


class ActivateDeactivateAccountView(APIView):
    """
    API endpoint for admin to activate or deactivate a user account.
    Works for all user types (CUSTOMER, STAFF, SUPPLIER, RESELLER).
    Accepts profile_type and profile_id to identify which profile to update.
    """
    from account.authentication import CookieJWTAuthentication
    
    # Only use JWT auth (cookie-based), skip SessionAuth to avoid CSRF requirement
    authentication_classes = [CookieJWTAuthentication]
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, profile_type, profile_id):
        is_active = request.data.get('is_active')
        
        if is_active is None:
            return Response(
                {'is_active': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(is_active, bool):
            return Response(
                {'is_active': ['This field must be a boolean.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Get the profile based on type
            if profile_type == 'customers':
                try:
                    profile = CustomerProfile.objects.select_related('user').get(pk=profile_id)
                except CustomerProfile.DoesNotExist:
                    return Response(
                        {'detail': 'Customer profile not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            elif profile_type == 'staff':
                try:
                    profile = StaffProfile.objects.select_related('user').get(pk=profile_id)
                except StaffProfile.DoesNotExist:
                    return Response(
                        {'detail': 'Staff profile not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                return Response(
                    {'detail': f'Invalid profile type: {profile_type}. Must be one of: customers, staff, supplier, reseller.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update user's is_active status
            if profile.user:
                profile.user.is_active = is_active
                profile.user.save()
                
                return Response(
                    {
                        'detail': f'Account has been {"activated" if is_active else "deactivated"} successfully.',
                        'is_active': is_active,
                        'user_id': profile.user.id,
                        'profile_id': profile.id,
                        'profile_type': profile_type
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {'detail': 'Profile does not have an associated user.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'detail': f'An error occurred while updating account status: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ==================== PUBLIC REGISTRATION ENDPOINT ====================


class RegisterCustomerView(APIView):
    """
    Public API endpoint for customer registration.
    Creates a new user with CUSTOMER role and associated CustomerProfile.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = []

    def post(self, request):
        """
        Register a new customer account.
        
        Request body:
        {
            "email": "customer@example.com",
            "password": "securepassword123",
            "full_name": "Jane Doe",
            "contact_phone": "+6281234567890" (optional),
        }
        """
        email = request.data.get('email')
        password = request.data.get('password')
        full_name = request.data.get('full_name')
        contact_phone = request.data.get('contact_phone', '')

        # Normalize email: lowercase and strip whitespace
        if email:
            email = email.lower().strip()

        # Validate required fields
        if not email:
            return Response(
                {'email': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not password:
            return Response(
                {'password': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not full_name:
            return Response(
                {'full_name': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user with this email already exists (case-insensitive)
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {'email': ['A user with this email already exists.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password
        try:
            validate_password(password)
        except Exception as e:
            return Response(
                {'password': list(e.messages) if hasattr(e, 'messages') else [str(e)]},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Create user with CUSTOMER role
                user = CustomUser.objects.create_user(
                    email=email,
                    password=password,
                    role=UserRole.CUSTOMER,
                    is_active=True,
                    email_verified=False,
                )

                # Create customer profile
                CustomerProfile.objects.create(
                    user=user,
                    full_name=full_name,
                    contact_phone=contact_phone,
                )

                # Send email verification
                try:
                    send_email_verification.delay(user.id)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to send verification email for customer: {str(e)}", exc_info=True)

                # Auto-login after registration
                try:
                    
                    refresh_token_obj = CustomTokenObtainPairSerializer.get_token(user)
                    access_token = str(refresh_token_obj.access_token)
                    refresh_token = str(refresh_token_obj)
                    
                    response = Response(
                        {
                            'detail': 'Customer account created successfully. You have been automatically logged in.',
                            'user': {
                                'id': user.id,
                                'email': user.email,
                                'role': user.role,
                            }
                        },
                        status=status.HTTP_201_CREATED
                    )
                    
                    is_secure = not settings.DEBUG
                    max_age_access = int(settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds())
                    max_age_refresh = int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds())
                    
                    response.set_cookie(
                        key='access_token',
                        value=access_token,
                        max_age=max_age_access,
                        httponly=True,
                        secure=is_secure,
                        samesite='Lax',
                        path='/',
                    )
                    
                    response.set_cookie(
                        key='refresh_token',
                        value=refresh_token,
                        max_age=max_age_refresh,
                        httponly=True,
                        secure=is_secure,
                        samesite='Lax',
                        path='/',
                    )
                    
                    return response
                    
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to generate tokens for customer auto-login: {str(e)}", exc_info=True)
                
                return Response(
                    {
                        'detail': 'Customer account created successfully. Please check your email to verify your account.',
                        'user_id': user.id,
                        'email': user.email,
                    },
                    status=status.HTTP_201_CREATED
                )

        except Exception as e:
            return Response(
                {'detail': f'An error occurred during customer registration: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
