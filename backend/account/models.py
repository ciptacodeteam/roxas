from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

from .managers import CustomUserManager


class UserRole(models.TextChoices):
    STAFF = "STAFF", _("Admin staff")
    CUSTOMER = "CUSTOMER", _("Customer")


class CustomUser(AbstractUser):
    email = models.EmailField(verbose_name="Email Address", unique=True)
    role = models.CharField(
        max_length=8,
        choices=UserRole.choices,
        verbose_name="Role",
        help_text=_("High-level role used for permissions and routing."),
    )
    email_verified = models.BooleanField(
        default=False,
        verbose_name="Email Verified",
        help_text=_("Whether the email address has been verified."),
    )
    email_verified_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Email Verified At",
        help_text=_("Timestamp when email was verified."),
    )
    google_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        unique=True,
        verbose_name="Google ID",
        help_text=_("Google OAuth user ID for social login."),
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated At")
    
    # We use email as the unique identifier instead of username/first/last name.
    username = None
    first_name = None
    last_name = None

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        roles_display = self.get_roles_display()
        return f"{self.email} | ({roles_display})"

    @property
    def is_customer(self) -> bool:
        """
        Check if user has customer profile.
        Customers are end-users who book tours.
        """
        return hasattr(self, 'customer_profile')

    @property
    def is_admin_staff(self) -> bool:
        """
        Convenience flag for your code to distinguish marketplace staff.
        Note: Django's `is_staff` is still used for admin-site access.
        """
        return self.role == UserRole.STAFF
    
    def get_roles_display(self) -> str:
        """
        Get a human-readable string of all roles this user has.
        Example: "Customer" or "Admin Staff"
        """
        roles = []
        if self.is_customer:
            roles.append("Customer")
        if self.is_admin_staff:
            roles.append("Admin Staff")
        return ", ".join(roles) if roles else "No roles"
    

    class Meta:
        ordering = ["-is_active", "email"]
        verbose_name = "User"
        verbose_name_plural = "User List"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["role", "is_active"]),
            models.Index(fields=["email_verified"]),
            models.Index(fields=["is_active", "role", "email_verified"]),
            models.Index(fields=["google_id"]),
        ]


class StaffProfile(models.Model):
    """
    Profile for internal admin / operations staff accounts.
    """

    user = models.OneToOneField(
        "CustomUser",
        on_delete=models.CASCADE,
        related_name="staff_profile",
        limit_choices_to={"role": UserRole.STAFF},
    )
    full_name = models.CharField(
        max_length=255,
        help_text=_("Full name of the staff member."),
    )
    contact_phone = models.CharField(
        max_length=50,
        blank=True,
        help_text=_("Contact phone number."),
    )
    photo = models.ImageField(
        upload_to="profile_photos/staff/",
        blank=True,
        null=True,
        verbose_name="Profile Photo",
        help_text=_("Staff profile photo."),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Staff Profile"
        verbose_name_plural = "Staff Profiles"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.user.email})"


class CustomerProfile(models.Model):
    """
    Profile for customer accounts.
    """

    user = models.OneToOneField(
        "CustomUser",
        on_delete=models.CASCADE,
        related_name="customer_profile",
        limit_choices_to={"role": UserRole.CUSTOMER},
    )
    full_name = models.CharField(
        max_length=255,
        help_text=_("Full name of the customer.")
    )
    contact_phone = models.CharField(
        max_length=50,
        blank=True,
        help_text=_("Contact phone number.")
    )
    photo = models.ImageField(
        upload_to="profile_photos/customers/",
        blank=True,
        null=True,
        verbose_name="Profile Photo",
        help_text=_("Customer profile photo.")
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Customer Profile"
        verbose_name_plural = "Customer Profiles"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["full_name"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.full_name} ({self.user.email})"
