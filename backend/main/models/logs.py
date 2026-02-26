"""Logging and audit models: ApiLog, AuditLog, EmailQueue."""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

from .base import UUIDModel
from .choices import ApiLogStatus, ApiProvider, EmailPriority, EmailStatus


class ApiLog(UUIDModel):
    """Track external API calls (Digiflazz, Midtrans, etc.)."""

    provider = models.CharField(max_length=15, choices=ApiProvider.choices, verbose_name=_("Provider"))
    endpoint = models.CharField(max_length=255, verbose_name=_("Endpoint"))
    method = models.CharField(max_length=10, default="POST", verbose_name=_("HTTP Method"))

    # Request details
    request_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Request Data"),
        help_text=_("Sanitized request payload"),
    )

    # Response details
    status = models.CharField(max_length=10, choices=ApiLogStatus.choices, verbose_name=_("Status"))
    status_code = models.IntegerField(blank=True, null=True, verbose_name=_("HTTP Status Code"))
    response_data = models.JSONField(blank=True, null=True, verbose_name=_("Response Data"))
    error_message = models.TextField(blank=True, verbose_name=_("Error Message"))

    # Performance tracking
    response_time = models.IntegerField(
        blank=True,
        null=True,
        verbose_name=_("Response Time"),
        help_text=_("Response time in milliseconds"),
    )

    # Context
    order_id = models.UUIDField(blank=True, null=True, verbose_name=_("Order ID"))
    ref_id = models.CharField(max_length=100, blank=True, verbose_name=_("Reference ID"))

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("API Log")
        verbose_name_plural = _("API Logs")
        ordering = ["-created_at"]
        db_table = "api_logs"
        indexes = [
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["provider", "created_at"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["order_id"]),
            models.Index(fields=["ref_id"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.get_provider_display()} - {self.endpoint} ({self.get_status_display()})"


class AuditLog(UUIDModel):
    """Audit trail for important changes."""

    entity_type = models.CharField(
        max_length=100,
        verbose_name=_("Entity Type"),
        help_text=_('e.g., "Order", "Product", "User"'),
    )
    entity_id = models.CharField(max_length=100, verbose_name=_("Entity ID"))
    action = models.CharField(
        max_length=20,
        verbose_name=_("Action"),
        help_text=_('e.g., "CREATE", "UPDATE", "DELETE"'),
    )
    changes = models.JSONField(blank=True, null=True, verbose_name=_("Changes"), help_text=_("Track what changed"))
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="audit_logs_main",
        verbose_name=_("User"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Audit Log")
        verbose_name_plural = _("Audit Logs")
        ordering = ["-created_at"]
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["action"]),
        ]

    def __str__(self):
        return f"{self.entity_type} {self.entity_id} - {self.action}"


class EmailQueue(UUIDModel):
    """Email queue for asynchronous email sending."""

    to = models.EmailField(verbose_name=_("To"))
    subject = models.CharField(max_length=255, verbose_name=_("Subject"))
    html = models.TextField(verbose_name=_("HTML Content"))
    text = models.TextField(blank=True, verbose_name=_("Plain Text Content"))

    status = models.CharField(
        max_length=15,
        choices=EmailStatus.choices,
        default=EmailStatus.PENDING,
        verbose_name=_("Status"),
    )
    priority = models.CharField(
        max_length=10,
        choices=EmailPriority.choices,
        default=EmailPriority.NORMAL,
        verbose_name=_("Priority"),
    )

    attempts = models.IntegerField(default=0, validators=[MinValueValidator(0)], verbose_name=_("Attempts"))
    max_attempts = models.IntegerField(default=3, validators=[MinValueValidator(1)], verbose_name=_("Max Attempts"))
    last_error = models.TextField(blank=True, verbose_name=_("Last Error"))

    scheduled_for = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Scheduled For"),
        help_text=_("For delayed emails"),
    )
    sent_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Sent At"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Email Queue")
        verbose_name_plural = _("Email Queue")
        ordering = ["status", "priority", "scheduled_for", "created_at"]
        db_table = "email_queue"
        indexes = [
            models.Index(fields=["status", "priority", "scheduled_for"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Email to {self.to} - {self.get_status_display()}"
