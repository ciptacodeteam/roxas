from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from account.token_views import CustomTokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

# Import admin configuration to customize admin site
import backend.admin_config  # noqa

from backend.health import health_check
from account.token_views import CustomTokenObtainPairView
from account.views import (
    StaffProfileViewSet,
    CustomerProfileViewSet,
    AdminStaffProfileViewSet,
    AdminCustomerProfileViewSet,
    CurrentUserView,
    LogoutView,
    ChangePasswordView,
    SendEmailVerificationView,
    VerifyEmailView,
    RequestPasswordResetView,
    ResetPasswordView,
    ResetPasswordConfirmView,
    ActivateDeactivateAccountView,
    RegisterCustomerView,
    GoogleAuthView,
)

router = DefaultRouter()
router.register(r"admin/staff/me/profile", StaffProfileViewSet, basename="staff-profile")
router.register(r"customers/me/profile", CustomerProfileViewSet, basename="customer-profile")

# Admin currency management
router.register(r"admin/staff", AdminStaffProfileViewSet, basename="admin-staff-profile")
router.register(r"admin/customers", AdminCustomerProfileViewSet, basename="admin-customer-profile")

# API Documentation endpoints
api_docs_patterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Import webhook views for direct access
from main.webhooks import digiflazz_webhook, midtrans_webhook

# API v1 endpoints
api_v1_patterns = [
    path("", include(router.urls)),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("token/logout/", LogoutView.as_view(), name="token_logout"),
    path("token/me/", CurrentUserView.as_view(), name="token_me"),
    # Public registration endpoints
    path("register/customer/", RegisterCustomerView.as_view(), name="register-customer"),
    # Google OAuth endpoint
    path("auth/google/", GoogleAuthView.as_view(), name="google-auth"),
    # Password change endpoint (works for all user types)
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    # Email verification endpoints
    path("users/<int:user_id>/send-verification-email/", SendEmailVerificationView.as_view(), name="send-verification-email"),
    path("verify-email/<str:uidb64>/<str:token>/", VerifyEmailView.as_view(), name="verify-email"),
    # Password reset endpoints
    path("request-password-reset/", RequestPasswordResetView.as_view(), name="request-password-reset"),
    path("users/<int:user_id>/reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("reset-password/<str:uidb64>/<str:token>/", ResetPasswordConfirmView.as_view(), name="reset-password-confirm"),
    # Activate/Deactivate account endpoint
    path("admin/<str:profile_type>/<int:profile_id>/activate-deactivate/", ActivateDeactivateAccountView.as_view(), name="activate-deactivate-account"),
    # Main app endpoints (products, orders, payments, etc.)
    path("", include("main.urls")),
]

urlpatterns = [
    # Django Admin
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health"),
    # API Documentation
    *api_docs_patterns,
    # API v1
    path("api/v1/", include(api_v1_patterns)),
    # Backward compatibility: keep old endpoints working
    path("api/", include(api_v1_patterns)),
    # Direct webhook endpoints for compatibility with external services
    path("api/main/webhooks/digiflazz/", digiflazz_webhook, name="digiflazz-webhook-compat"),
    path("api/main/webhooks/midtrans/", midtrans_webhook, name="midtrans-webhook-compat"),
    # REST framework auth URLs (for browsable API)
    path("api-auth/", include("rest_framework.urls")),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
