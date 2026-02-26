"""
Order and Payment viewsets.
"""
import logging
from datetime import timedelta

from django.conf import settings as django_settings
from django.db.models import Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from account.models import UserRole
from ..integrations.midtrans import MidtransClient, MidtransException
from ..models import Order, OrderStatus, Payment, ProductRating
from ..serializers import (
    OrderCreateSerializer,
    OrderListSerializer,
    OrderSerializer,
    PaymentPublicSerializer,
    PaymentSerializer,
    ProductRatingSerializer,
)
from .permissions import IsAdminOnly, IsOwnerOrAdmin

logger = logging.getLogger(__name__)


def _get_user_profile(user):
    """Return (full_name, phone) for either a STAFF or CUSTOMER user."""
    try:
        if user.role == UserRole.STAFF and hasattr(user, "staff_profile"):
            p = user.staff_profile
            return p.full_name or "Customer", p.contact_phone or ""
        if user.role == UserRole.CUSTOMER and hasattr(user, "customer_profile"):
            p = user.customer_profile
            return p.full_name or "Customer", p.contact_phone or ""
    except Exception:
        pass
    return "Customer", ""


def _build_midtrans_payment(midtrans_client, order, payment_method, customer_details, item_details):
    """
    Call the correct Midtrans charge method based on ``payment_method.type``.
    Returns the raw Midtrans response dict.
    """
    frontend_url = getattr(django_settings, "FRONTEND_URL", "") or ""
    callback_url = (
        f"{frontend_url}/payment?order_id={order.order_number}" if frontend_url else None
    )

    ptype = payment_method.type
    code = payment_method.midtrans_code.lower()

    if ptype == "QRIS":
        try:
            return midtrans_client.charge_gopay(
                order_id=order.order_number,
                gross_amount=order.total_amount,
                customer_details=customer_details,
                item_details=item_details,
                callback_url=callback_url,
            )
        except MidtransException as exc:
            if "402" in str(exc) or "not activated" in str(exc).lower():
                logger.warning(
                    "GoPay returned 402; falling back to standalone QRIS for %s",
                    order.order_number,
                )
                return midtrans_client.charge_qris(
                    order_id=order.order_number,
                    gross_amount=order.total_amount,
                    customer_details=customer_details,
                    item_details=item_details,
                )
            raise

    if ptype == "BANK_TRANSFER":
        if code in ("mandiri", "echannel"):
            return midtrans_client.charge_mandiri_bill(
                order_id=order.order_number,
                gross_amount=order.total_amount,
                customer_details=customer_details,
                item_details=item_details,
            )
        if code == "permata":
            return midtrans_client.charge_permata(
                order_id=order.order_number,
                gross_amount=order.total_amount,
                customer_details=customer_details,
                item_details=item_details,
            )
        return midtrans_client.charge_bank_transfer(
            order_id=order.order_number,
            gross_amount=order.total_amount,
            bank=code,
            customer_details=customer_details,
            item_details=item_details,
        )

    if ptype == "E_WALLET":
        if "gopay" in code:
            return midtrans_client.charge_gopay(
                order_id=order.order_number,
                gross_amount=order.total_amount,
                customer_details=customer_details,
                item_details=item_details,
                callback_url=callback_url,
            )
        if "shopeepay" in code:
            return midtrans_client.charge_shopeepay(
                order_id=order.order_number,
                gross_amount=order.total_amount,
                customer_details=customer_details,
                item_details=item_details,
                callback_url=callback_url,
            )

    if ptype == "CREDIT_CARD":
        raise ValueError(
            "Credit card payment requires 'card_token' to be handled by the view layer."
        )

    # Fallback
    return midtrans_client.charge_qris(
        order_id=order.order_number,
        gross_amount=order.total_amount,
        customer_details=customer_details,
        item_details=item_details,
    )


def _extract_payment_fields(resp):
    """Parse Midtrans response to extract va_number, qris_string, deeplink_url."""
    # VA number
    va_number = None
    if resp.get("va_numbers"):
        va_number = resp["va_numbers"][0].get("va_number")
    elif resp.get("permata_va_number"):
        va_number = resp["permata_va_number"]
    elif resp.get("biller_code"):
        va_number = f"{resp['biller_code']}{resp.get('bill_key', '')}"

    # QRIS — prefer generate-qr-code-v2
    qris_string = None
    actions = resp.get("actions") or []
    if actions:
        qr_action = next(
            (a for a in actions if a.get("name") in ("generate-qr-code-v2", "generate-qr-code") and a.get("url")),
            None,
        )
        if qr_action:
            qris_string = qr_action["url"]
    if not qris_string:
        qris_string = resp.get("qr_string")

    # Deeplink (only "deeplink-redirect")
    deeplink_url = next(
        (a.get("url") for a in actions if a.get("name") == "deeplink-redirect"),
        None,
    )

    return va_number, qris_string, deeplink_url


class OrderViewSet(viewsets.ModelViewSet):
    """
    Order API for authenticated users.  Staff can see all orders; customers see only their own.
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["order_number"]
    filterset_fields = ["status", "payment_method"]
    ordering_fields = ["created_at", "total_amount"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "STAFF":
            return Order.objects.all().select_related(
                "user", "product_item__product", "payment_method"
            ).order_by("-created_at")
        return Order.objects.filter(user=user).select_related(
            "product_item__product", "payment_method"
        ).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action == "list":
            return OrderListSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        """Create an Order then immediately charge via Midtrans."""
        order = serializer.save(user=self.request.user)

        logger.info(
            "Order created: %s | Product: %s | Method: %s | Total: %s",
            order.order_number,
            order.product_item.name,
            order.payment_method.name if order.payment_method else "None",
            order.total_amount,
        )

        if not order.payment_method:
            logger.error("Order %s created without payment_method.", order.order_number)
            return order

        try:
            midtrans_client = MidtransClient()
            user_name, user_phone = _get_user_profile(self.request.user)

            customer_details = {
                "email": self.request.user.email,
                "first_name": user_name,
                "phone": user_phone,
            }
            item_details = [
                {
                    "id": str(order.product_item.id),
                    "name": order.product_item.name,
                    "price": int(order.final_price),
                    "quantity": 1,
                }
            ]
            if order.payment_fee > 0:
                item_details.append({
                    "id": "payment_fee",
                    "name": f"Biaya {order.payment_method.name}",
                    "price": int(order.payment_fee),
                    "quantity": 1,
                })
            if order.vat_amount > 0:
                item_details.append({
                    "id": "vat",
                    "name": "PPN",
                    "price": int(order.vat_amount),
                    "quantity": 1,
                })

            # Handle credit card separately (requires card_token from frontend)
            payment_response = None
            if order.payment_method.type == "CREDIT_CARD":
                card_token = self.request.data.get("card_token")
                if not card_token:
                    raise ValueError(
                        "Credit card payment requires 'card_token'. "
                        "Provide the Midtrans.js token in the request."
                    )
                payment_response = midtrans_client.charge_credit_card(
                    order_id=order.order_number,
                    gross_amount=order.total_amount,
                    card_token=card_token,
                    customer_details=customer_details,
                    item_details=item_details,
                )
            else:
                payment_response = _build_midtrans_payment(
                    midtrans_client, order, order.payment_method, customer_details, item_details
                )

            if payment_response:
                logger.info(
                    "Midtrans response for %s: transaction_id=%s, payment_type=%s",
                    order.order_number,
                    payment_response.get("transaction_id"),
                    payment_response.get("payment_type"),
                )
                va_number, qris_string, deeplink_url = _extract_payment_fields(payment_response)
                logger.info(
                    "Creating Payment for %s: VA=%s, QRIS=%s, Deeplink=%s",
                    order.order_number,
                    va_number,
                    bool(qris_string),
                    bool(deeplink_url),
                )
                Payment.objects.create(
                    order=order,
                    external_id=order.order_number,
                    transaction_id=payment_response.get("transaction_id"),
                    payment_method=order.payment_method,
                    amount=order.total_amount,
                    status="pending",
                    payment_url=payment_response.get("payment_url"),
                    va_number=va_number,
                    qris_string=qris_string,
                    deeplink_url=deeplink_url,
                    expires_at=order.payment_expires_at,
                    webhook_data=payment_response,
                )

        except MidtransException as exc:
            logger.error(
                "Midtrans error for order %s (method: %s): %s",
                order.order_number,
                order.payment_method.name if order.payment_method else "None",
                exc,
                exc_info=True,
            )
        except Exception as exc:
            logger.error(
                "Unexpected error creating payment for order %s: %s",
                order.order_number,
                exc,
                exc_info=True,
            )

        return order

    def create(self, request, *args, **kwargs):
        """Override to return payment details alongside the new order."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = self.perform_create(serializer)

        payment = Payment.objects.filter(order=order).first()
        order_data = OrderSerializer(order).data
        if payment:
            order_data["payment"] = PaymentPublicSerializer(payment).data

        headers = self.get_success_headers(order_data)
        return Response(order_data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"])
    def rate(self, request, pk=None):
        """Submit a product rating for a completed order."""
        order = self.get_object()

        if order.user != request.user:
            return Response(
                {"error": "You can only rate your own orders"},
                status=status.HTTP_403_FORBIDDEN,
            )
        if order.status != "COMPLETED":
            return Response(
                {"error": "You can only rate completed orders"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rating_value = request.data.get("rating")
        if not rating_value or not isinstance(rating_value, int) or not (1 <= rating_value <= 5):
            return Response(
                {"error": "Rating must be an integer between 1 and 5"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product = order.product_item.product
        if ProductRating.objects.filter(product=product, user=request.user, order=order).exists():
            return Response(
                {"error": "You have already rated this product for this order"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user_name, _ = _get_user_profile(request.user)
        if not user_name or user_name == "Customer":
            user_name = request.user.email

        rating = ProductRating.objects.create(
            product=product,
            user=request.user,
            order=order,
            rating=rating_value,
            user_name=user_name,
            is_active=True,
        )
        return Response(
            {
                "message": "Rating submitted successfully",
                "rating": rating_value,
                "product": product.name,
                "created_at": rating.created_at,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="leaderboard",
        permission_classes=[permissions.AllowAny],
    )
    def leaderboard(self, request):
        """
        Public leaderboard — top 10 spenders for today / this week / this month.

        GET /api/v1/orders/leaderboard/

        Returns three groups with masked user names and total spending.
        """
        from account.models import CustomerProfile

        def _mask(name: str) -> str:
            name = (name or "").strip()
            if not name:
                return "Anonim**********"
            return name[:3] + "**********"

        def _top_spenders(start_dt):
            rows = (
                Order.objects
                .filter(status=OrderStatus.COMPLETED, completed_at__gte=start_dt)
                .values("user_id")
                .annotate(total=Sum("total_amount"))
                .order_by("-total")[:10]
            )
            user_ids = [r["user_id"] for r in rows]
            profiles = {
                p.user_id: p.full_name
                for p in CustomerProfile.objects
                .filter(user_id__in=user_ids)
                .only("user_id", "full_name")
            }
            return [
                {"name": _mask(profiles.get(r["user_id"], "")), "amount": r["total"]}
                for r in rows
            ]

        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=today_start.weekday())
        month_start = today_start.replace(day=1)

        return Response([
            {"title": "Top 10 - Hari Ini",   "items": _top_spenders(today_start)},
            {"title": "Top 10 - Minggu Ini", "items": _top_spenders(week_start)},
            {"title": "Top 10 - Bulan Ini",  "items": _top_spenders(month_start)},
        ])

    @action(
        detail=False,
        methods=["get"],
        url_path="lookup",
        permission_classes=[permissions.AllowAny],
    )
    def lookup(self, request):
        """
        Public invoice status lookup — no authentication required.

        GET /api/v1/orders/lookup/?invoice={order_number}

        Returns only safe, non-sensitive fields:
        order_number, status, product name, total, payment method, timestamps.
        """
        invoice = request.query_params.get("invoice", "").strip().upper()
        if not invoice:
            return Response(
                {"error": "Parameter 'invoice' wajib diisi"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.select_related(
                "product_item__product", "payment_method"
            ).get(order_number=invoice)
        except Order.DoesNotExist:
            return Response(
                {"error": "Nomor invoice tidak ditemukan. Pastikan nomor sudah benar."},
                status=status.HTTP_404_NOT_FOUND,
            )

        item = order.product_item
        product_name = (
            f"{item.product.name} – {item.name}"
            if item and item.product_id
            else (item.name if item else "—")
        )

        return Response(
            {
                "order_number": order.order_number,
                "status": order.status,
                "product_name": product_name,
                "total_amount": order.total_amount,
                "payment_method_name": order.payment_method.name if order.payment_method_id else None,
                "created_at": order.created_at,
                "paid_at": order.paid_at,
                "completed_at": order.completed_at,
            }
        )


class AdminOrderViewSet(viewsets.ModelViewSet):
    """
    Admin API for all orders.
    Status is driven by webhooks only; manual status change is blocked.
    Admin may cancel (→ EXPIRED) any PENDING unpaid order.
    """

    queryset = Order.objects.all().select_related(
        "user",
        "user__customer_profile",
        "user__staff_profile",
        "product_item",
        "payment_method",
    ).order_by("-created_at")
    serializer_class = OrderSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["order_number", "user__email"]
    filterset_fields = ["status", "payment_method", "product_item__product"]
    ordering_fields = ["created_at", "total_amount", "status"]

    def update(self, request, *args, **kwargs):
        return Response(
            {
                "error": (
                    "Order status cannot be changed manually. "
                    "Status is set by Digiflazz and Midtrans webhooks. "
                    "Use POST /cancel/ for PENDING orders."
                ),
            },
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel an unpaid (PENDING) order by setting its status to EXPIRED."""
        order = self.get_object()
        if order.status != OrderStatus.PENDING:
            return Response(
                {"error": "Only PENDING (unpaid) orders can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = OrderStatus.EXPIRED
        order.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"])
    def refund(self, request, pk=None):
        """Initiate an order refund."""
        order = self.get_object()
        if order.status not in ("PAID", "PROCESSING", "COMPLETED"):
            return Response(
                {"error": "Hanya pesanan yang sudah dibayar yang dapat di-refund"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.status = "REFUNDED"
        order.refund_amount = request.data.get("refund_amount", order.total_amount)
        order.refund_reason = request.data.get("refund_reason", "")
        order.refunded_at = timezone.now()
        order.save()
        # Trigger async Midtrans refund + notification
        from main.tasks import process_midtrans_refund
        process_midtrans_refund.delay(
            str(order.id),
            int(order.refund_amount),
            order.refund_reason or '',
        )
        return Response(OrderSerializer(order).data)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only Payment API. Staff see all payments; customers see only their own.
    """

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "payment_method"]
    ordering_fields = ["created_at", "paid_at"]

    def get_queryset(self):
        user = self.request.user
        if user.role == "STAFF":
            return Payment.objects.all().select_related("order", "payment_method").order_by("-created_at")
        return (
            Payment.objects.filter(order__user=user)
            .select_related("order", "payment_method")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.user.role == "STAFF":
            return PaymentSerializer
        return PaymentPublicSerializer
