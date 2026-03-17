"""
Product, ProductItem and PriceSync viewsets.
"""
import logging
import uuid
from datetime import timedelta
from decimal import ROUND_HALF_UP, Decimal

from django.db import transaction
from django.db.models import Count, Min, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from ..integrations.digiflazz import DigiflazzClient, DigiflazzException
from ..models import (
    DigiflazzAccountCheck,
    PriceSync,
    Product,
    ProductItem,
    ProductRating,
)
from ..serializers import (
    PriceSyncSerializer,
    ProductItemPublicSerializer,
    ProductItemSerializer,
    ProductListSerializer,
    ProductRatingSerializer,
    ProductSerializer,
)
from .permissions import IsAdminOnly

logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────────────────────────────
# Shared helpers
# ───────────────────────────────────────────────────────────────────────

def _product_qs(base_qs):
    """Annotate a Product queryset to avoid N+1 on item counts / min price."""
    return base_qs.annotate(
        active_item_count=Count(
            "items",
            filter=Q(items__is_active=True, items__is_validation_item=False),
            distinct=True,
        ),
        min_sell_price=Min(
            "items__sell_price",
            filter=Q(items__is_active=True, items__is_validation_item=False),
        ),
    )


def _call_digiflazz_validation(client, sku_code, customer_no, ref_id, testing=None):
    """
    Call Digiflazz ``create_transaction`` for account validation and
    return a normalised result dict.

    Returns:
        dict with keys: is_valid, account_name, status, rc, message, raw
    """
    raw = client.create_transaction(
        buyer_sku_code=sku_code,
        customer_no=customer_no,
        ref_id=ref_id,
        testing=testing,
    )
    txn_status = raw.get("status", "")
    rc = raw.get("rc", "")
    message = raw.get("message", "")
    account_name = raw.get("sn", "") or raw.get("customer_name", "")

    # Attempt to extract username from message text (common Digiflazz pattern)
    if not account_name and message:
        for marker in ("Username", "Nama", "Name"):
            if marker in message:
                try:
                    part = message.split(marker)[-1].strip().lstrip(":").strip()
                    token = part.split()[0] if part else ""
                    if token:
                        account_name = token
                        break
                except Exception:
                    pass

    is_valid = txn_status in ("Pending", "Sukses") or rc in ("", "00")

    # Normalise Digiflazz status → our model's DigiflazzStatus choices (uppercase)
    normalised_status = txn_status.upper() if txn_status else "PENDING"
    if normalised_status not in ("PENDING", "SUKSES", "GAGAL"):
        normalised_status = "PENDING"

    return {
        "is_valid": is_valid,
        "account_name": account_name,
        "status": normalised_status,
        "rc": rc,
        "message": message,
        "raw": raw,
    }


def _get_cached_validation(product, customer_no, hours=24):
    """Return a recent valid DigiflazzAccountCheck or None."""
    return (
        DigiflazzAccountCheck.objects.filter(
            customer_no=customer_no,
            product=product,
            created_at__gte=timezone.now() - timedelta(hours=hours),
            is_valid=True,
        )
        .order_by("-created_at")
        .first()
    )


def _build_customer_no_for_validation(customer_data: dict, product) -> str:
    """
    Build the ``customer_no`` string for validation using the product's
    template, falling back to simple concatenation for game ID fields.
    """
    from ..utils import build_customer_no

    template = getattr(product, "customer_no_template", "") or ""
    if template:
        try:
            return build_customer_no(customer_data, template)
        except (ValueError, KeyError):
            pass

    # Fallback: userId + serverId (legacy game validation)
    user_id = customer_data.get("userId", "")
    server_id = customer_data.get("serverId", "") or customer_data.get("zoneId", "")
    return f"{user_id}{server_id}" if server_id else user_id


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only API for active products (slug-based lookup).
    """

    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "description"]
    filterset_fields = ["category__slug"]
    ordering_fields = ["name", "sort_order", "created_at"]

    def get_queryset(self):
        qs = _product_qs(
            Product.objects.filter(is_active=True).select_related("category")
        )
        category_slug = self.request.query_params.get("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug, category__is_active=True)
        return qs.order_by("sort_order", "name")

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductSerializer

    @action(detail=True, methods=["get"])
    def ratings(self, request, slug=None):
        """Get active ratings for a product."""
        product = self.get_object()
        ratings = (
            ProductRating.objects.filter(product=product, is_active=True)
            .select_related("user")
            .order_by("-created_at")
        )
        return Response(ProductRatingSerializer(ratings, many=True).data)

    @action(detail=True, methods=["post"], url_path="validate-account")
    def validate_account(self, request, slug=None):
        """
        Generic account validation using the product's validation item.

        Accepts *any* customer-data fields and builds ``customer_no`` via the
        product's ``customer_no_template``.  Falls back to legacy
        ``user_id + server_id`` concatenation for backward-compatibility.

        POST /api/v1/products/{slug}/validate-account/
        Body: { "customer_data": {"userId": "...", "serverId": "..."} }
              OR legacy: { "user_id": "...", "server_id": "..." }
        """
        product = self.get_object()
        validation_item = product.get_validation_item()

        if not validation_item:
            # Mobile Legends fallback: all ML variants use the same Digiflazz
            # validation SKU (MLCU) that lives on the global product. Allow
            # validation to proceed using that shared SKU even if this specific
            # product has no validation item attached.
            name = (product.name or "").lower()
            if "mobile legends" in name or "mobile legend" in name:
                from ..models import ProductItem  # local import to avoid cycles

                validation_item = (
                    ProductItem.objects.filter(
                        is_active=True,
                        is_validation_item=True,
                        sku_code="MLCU",
                    )
                    .order_by("created_at")
                    .first()
                )

            if not validation_item:
                return Response(
                    {
                        "valid": False,
                        "error": "Validasi akun tidak tersedia untuk produk ini",
                        "message": "No validation item configured for this product",
                    },
                    status=status.HTTP_404_NOT_FOUND,
                )

        # ── Accept either new or legacy payload ───────────────────────
        customer_data = request.data.get("customer_data")
        if customer_data and isinstance(customer_data, dict):
            # New dynamic payload — strip all values
            customer_data = {k: str(v).strip() for k, v in customer_data.items()}
        else:
            # Legacy payload with explicit user_id / server_id keys
            customer_data = {
                "userId": request.data.get("user_id", "").strip(),
                "serverId": request.data.get("server_id", "").strip(),
            }

        # At least one non-empty value is required
        if not any(customer_data.values()):
            return Response(
                {"valid": False, "error": "Data akun tidak boleh kosong"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        customer_no = _build_customer_no_for_validation(customer_data, product)
        if not customer_no:
            return Response(
                {"valid": False, "error": "Gagal membangun nomor pelanggan"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine which SKU to use for validation.
        # For Mobile Legends, all regions share the same Digiflazz validation SKU (MLCU),
        # even if individual region products have their own validation items with
        # derived/local SKUs.
        product_name_lower = (product.name or "").lower()
        if ("mobile legends" in product_name_lower or "mobile legend" in product_name_lower) and validation_item.sku_code != "MLCU":
            buyer_sku_code = "MLCU"
        else:
            buyer_sku_code = validation_item.sku_code

        # ── 24-h cache ────────────────────────────────────────────────
        recent = _get_cached_validation(product, customer_no)
        if recent:
            logger.info("Cached validation hit for %s on %s", customer_no, product.slug)
            return Response(
                {
                    "valid": True,
                    "customer_data": customer_data,
                    "account_name": recent.account_name,
                    "status": recent.status,
                    "check_id": str(recent.id),
                    "message": "Akun valid (dari cache)",
                    "cached": True,
                }
            )

        # ── Create pending check record ───────────────────────────────
        ref_id = f"CHECK-{uuid.uuid4().hex[:12].upper()}"
        account_check = DigiflazzAccountCheck.objects.create(
            ref_id=ref_id,
            product=product,
            sku_code=buyer_sku_code,
            customer_no=customer_no,
            user_id=customer_data.get("userId", ""),
            server_id=customer_data.get("serverId", ""),
            status="PENDING",
        )

        # ── Call Digiflazz ────────────────────────────────────────────
        try:
            client = DigiflazzClient()
            result = _call_digiflazz_validation(
                client, buyer_sku_code, customer_no, ref_id
            )

            account_check.status = result["status"]
            account_check.message = result["message"]
            account_check.rc = result["rc"]
            account_check.response_data = result["raw"]
            account_check.account_name = result["account_name"] or ""
            account_check.is_valid = result["is_valid"]
            account_check.save()

            if result["is_valid"]:
                account_name = result["account_name"]
                if not account_name and result["status"] == "PENDING":
                    account_name = None  # will be resolved via polling
                elif not account_name:
                    first_val = next(
                        (v for v in customer_data.values() if v), "Unknown"
                    )
                    account_name = f"Player {first_val}"
                return Response(
                    {
                        "valid": True,
                        "customer_data": customer_data,
                        "account_name": account_name,
                        "status": result["status"],
                        "check_id": str(account_check.id),
                        "message": (
                            "Akun valid"
                            if result["status"] == "SUKSES"
                            else result["message"]
                        ),
                    }
                )

            return Response(
                {
                    "valid": False,
                    "error": result["raw"].get("message", "Akun tidak ditemukan"),
                    "message": "Account not found",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except DigiflazzException as exc:
            logger.error("Digiflazz validation error for %s: %s", product.slug, exc)
            return Response(
                {"valid": False, "error": str(exc), "message": "Validation service error"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as exc:
            logger.error("Unexpected validation error for %s: %s", product.slug, exc, exc_info=True)
            return Response(
                {"valid": False, "error": "Terjadi kesalahan saat validasi", "message": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(
        detail=True,
        methods=["get"],
        url_path=r"check-validation-status/(?P<check_id>[^/.]+)",
    )
    def check_validation_status(self, request, slug=None, check_id=None):
        """Poll validation status for a pending account check."""
        try:
            check = DigiflazzAccountCheck.objects.get(id=check_id)
            return Response(
                {
                    "valid": check.is_valid,
                    "customer_data": {
                        "userId": check.user_id or "",
                        "serverId": check.server_id or "",
                    },
                    "account_name": check.account_name or None,
                    "status": check.status,
                    "message": check.message,
                }
            )
        except DigiflazzAccountCheck.DoesNotExist:
            return Response(
                {"valid": False, "error": "Validation check not found"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as exc:
            logger.error("Error checking validation status: %s", exc, exc_info=True)
            return Response(
                {"valid": False, "error": "Failed to check validation status"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class AdminProductViewSet(viewsets.ModelViewSet):
    """
    Admin full-CRUD API for products.
    """

    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "slug", "description"]
    filterset_fields = ["category", "is_active"]
    ordering_fields = ["name", "sort_order", "created_at"]

    def get_queryset(self):
        return _product_qs(
            Product.objects.all().select_related("category")
        ).order_by("-created_at")

    def get_serializer_class(self):
        return ProductSerializer

    @action(detail=True, methods=["post"], url_path="bulk-update-prices")
    def bulk_update_prices(self, request, pk=None):
        """
        Bulk-update sell prices for all non-validation items using a markup %.

        POST /api/v1/admin/products/{id}/bulk-update-prices/
        { "markup_percentage": 10.5, "apply_to_all": true }
        """
        product = self.get_object()
        raw_markup = request.data.get("markup_percentage")

        if raw_markup is None:
            return Response(
                {"error": "markup_percentage is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            markup_pct = Decimal(str(raw_markup))
        except (ValueError, TypeError):
            return Response(
                {"error": "markup_percentage must be a valid number"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        items = ProductItem.objects.filter(product=product)
        if not items.exists():
            return Response(
                {"error": "No product items found for this product"},
                status=status.HTTP_404_NOT_FOUND,
            )

        updated, skipped = [], []
        multiplier = Decimal("1") + (markup_pct / Decimal("100"))

        with transaction.atomic():
            for item in items.select_related("product"):
                if item.is_validation_item:
                    skipped.append({"id": str(item.id), "name": item.name, "reason": "Validation item"})
                    continue
                if not item.base_price or item.base_price <= 0:
                    skipped.append({"id": str(item.id), "name": item.name, "reason": "No base price"})
                    continue

                old_price = item.sell_price
                new_price = int((Decimal(str(item.base_price)) * multiplier).quantize(
                    Decimal("1"), rounding=ROUND_HALF_UP
                ))
                item.sell_price = new_price
                item.save(update_fields=["sell_price", "updated_at"])
                updated.append({
                    "id": str(item.id),
                    "name": item.name,
                    "sku_code": item.sku_code,
                    "base_price": item.base_price,
                    "old_sell_price": old_price,
                    "new_sell_price": new_price,
                    "markup_applied": float(markup_pct),
                })

        return Response(
            {
                "success": True,
                "message": f"Updated {len(updated)} product items",
                "markup_percentage": float(markup_pct),
                "updated_items": updated,
                "skipped_items": skipped,
                "total_items": items.count(),
                "updated_count": len(updated),
                "skipped_count": len(skipped),
            }
        )


class ProductItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only API for active non-validation product items.
    """

    serializer_class = ProductItemPublicSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "sku_code"]
    filterset_fields = ["product", "product__category"]
    ordering_fields = ["name", "sell_price", "sort_order"]

    def get_queryset(self):
        return ProductItem.objects.filter(
            is_active=True, is_validation_item=False
        ).select_related("product", "product__category")


class AdminProductItemViewSet(viewsets.ModelViewSet):
    """
    Admin full-CRUD API for product items.
    """

    queryset = ProductItem.objects.all().select_related("product").order_by("-created_at")
    serializer_class = ProductItemSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "sku_code", "product__name"]
    filterset_fields = ["product", "is_active", "digiflazz_status"]
    ordering_fields = ["name", "sell_price", "created_at", "last_synced_at"]

    @action(detail=False, methods=["post"], url_path="sync-prices", url_name="sync-prices")
    def sync_prices(self, request):
        """
        Trigger Digiflazz price sync via Celery.

        POST /api/admin/product-items/sync-prices/
        Body: { "type": "FULL"|"PREPAID"|"PASCA", "category": "...", "brand": "..." }
        """
        from main.tasks import sync_digiflazz_products

        category = request.data.get("category")
        brand = request.data.get("brand")
        task = sync_digiflazz_products.delay(category_filter=category, brand_filter=brand)

        return Response(
            {
                "success": True,
                "message": "Price sync started successfully",
                "task_id": task.id,
                "result": {
                    "itemsUpdated": 0,
                    "itemsCreated": 0,
                    "itemsFailed": 0,
                    "syncedAt": timezone.now().isoformat(),
                },
            }
        )

    @action(detail=False, methods=["get"], url_path="sync-status", url_name="sync-status")
    def sync_status(self, request):
        """
        Return the most recent sync status.

        GET /api/admin/product-items/sync-status/
        """
        last = (
            ProductItem.objects.filter(last_synced_at__isnull=False)
            .order_by("-last_synced_at")
            .first()
        )
        is_recent = (
            bool(last and last.last_synced_at)
            and (timezone.now() - last.last_synced_at) < timedelta(seconds=30)
        )
        return Response(
            {
                "is_syncing": is_recent,
                "last_synced_at": last.last_synced_at if last else None,
                "sync_status": "SUCCESS" if last else "NEVER_SYNCED",
                "sync_message": (
                    f"Last synced {last.last_synced_at.strftime('%Y-%m-%d %H:%M:%S')}"
                    if last
                    else "No sync performed yet"
                ),
            }
        )


class AdminPriceSyncViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin read-only API for price-sync history.
    """

    queryset = PriceSync.objects.all().order_by("-started_at")
    serializer_class = PriceSyncSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "sync_type"]
    ordering_fields = ["started_at", "completed_at"]
