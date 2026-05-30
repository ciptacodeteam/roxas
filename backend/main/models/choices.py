"""
All TextChoices / enums for the main app models.
Centralising them here avoids circular imports and makes it easy
to compare statuses from anywhere without importing full models.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    SETTLEMENT = "SETTLEMENT", _("Settlement")
    EXPIRE = "EXPIRE", _("Expired")
    CANCEL = "CANCEL", _("Cancelled")
    DENY = "DENY", _("Denied")
    REFUND = "REFUND", _("Refunded")


class DigiflazzStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    SUKSES = "SUKSES", _("Success")
    GAGAL = "GAGAL", _("Failed")


class DigiflazzItemStatus(models.TextChoices):
    ACTIVE = "ACTIVE", _("Active")
    INACTIVE = "INACTIVE", _("Inactive")


class PriceSyncStatus(models.TextChoices):
    SUCCESS = "SUCCESS", _("Success")
    FAILED = "FAILED", _("Failed")
    IN_PROGRESS = "IN_PROGRESS", _("In Progress")


class PriceSyncType(models.TextChoices):
    PREPAID = "PREPAID", _("Prepaid")
    PASCA = "PASCA", _("Postpaid")
    FULL = "FULL", _("Full Sync")


class FeeType(models.TextChoices):
    PERCENTAGE = "PERCENTAGE", _("Percentage")
    FIXED = "FIXED", _("Fixed Amount")


class PaymentMethodType(models.TextChoices):
    QRIS = "QRIS", _("QRIS")
    E_WALLET = "E_WALLET", _("E-Wallet")
    MOBILE_BANKING = "MOBILE_BANKING", _("Mobile Banking")
    CREDIT_CARD = "CREDIT_CARD", _("Credit Card")
    BANK_TRANSFER = "BANK_TRANSFER", _("Bank Transfer")


class OrderStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending - Awaiting Payment")
    PAID = "PAID", _("Paid - Processing Top-up")
    PROCESSING = "PROCESSING", _("Processing - Sent to Provider")
    COMPLETED = "COMPLETED", _("Completed - Top-up Successful")
    FAILED = "FAILED", _("Failed - Top-up Failed")
    REFUNDED = "REFUNDED", _("Refunded")
    EXPIRED = "EXPIRED", _("Expired - Payment Timeout")


class ApiProvider(models.TextChoices):
    DIGIFLAZZ = "DIGIFLAZZ", _("Digiflazz")
    MIDTRANS = "MIDTRANS", _("Midtrans")
    RESEND = "RESEND", _("Resend")


class ApiLogStatus(models.TextChoices):
    SUCCESS = "SUCCESS", _("Success")
    FAILED = "FAILED", _("Failed")
    TIMEOUT = "TIMEOUT", _("Timeout")
    ERROR = "ERROR", _("Error")


class DiscountType(models.TextChoices):
    PERCENTAGE = "PERCENTAGE", _("Percentage Discount")
    FIXED_AMOUNT = "FIXED_AMOUNT", _("Fixed Amount Discount")


class EmailStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    PROCESSING = "PROCESSING", _("Processing")
    SENT = "SENT", _("Sent")
    FAILED = "FAILED", _("Failed")


class EmailPriority(models.TextChoices):
    LOW = "LOW", _("Low")
    NORMAL = "NORMAL", _("Normal")
    HIGH = "HIGH", _("High")
