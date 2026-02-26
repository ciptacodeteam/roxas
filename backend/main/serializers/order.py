"""Order, Payment, and DigiflazzTransaction serializers."""
import uuid
from datetime import timedelta
from decimal import Decimal

from rest_framework import serializers
from django.utils import timezone

from ..models.order import Order, Payment
from ..models.transaction import DigiflazzTransaction
from ..models.promotion import Coupon, CouponUsage
from ..utils import build_customer_no, validate_customer_data_against_fields
from .payment import PaymentMethodPublicSerializer
from .product import ProductItemSerializer, ProductItemPublicSerializer


class OrderListSerializer(serializers.ModelSerializer):
    """Lightweight order serializer for list views."""
    product_item_name = serializers.SerializerMethodField()
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'product_item_name', 'total_amount',
            'payment_method_name', 'status', 'created_at',
        ]
        read_only_fields = ['id']

    def get_product_item_name(self, obj) -> str:
        if obj.product_item_id:
            item = obj.product_item
            if item.product_id:
                return f"{item.product.name} - {item.name}"
            return item.name
        return "Unknown Product"


class PaymentPublicSerializer(serializers.ModelSerializer):
    """Public serializer for Payment (excludes sensitive webhook data)."""
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'external_id', 'payment_method_name', 'amount', 'status',
            'payment_url', 'va_number', 'qris_string', 'deeplink_url',
            'redirect_url', 'expires_at', 'created_at',
        ]
        read_only_fields = ['id']


class PaymentSerializer(serializers.ModelSerializer):
    """Full payment serializer (admin)."""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number', 'external_id', 'transaction_id',
            'payment_method', 'payment_method_name', 'amount', 'status',
            'payment_url', 'va_number', 'qris_string', 'deeplink_url',
            'redirect_url', 'expires_at', 'webhook_data',
            'created_at', 'updated_at', 'paid_at',
        ]
        read_only_fields = ['id', 'external_id', 'transaction_id', 'created_at', 'updated_at', 'paid_at']


class OrderSerializer(serializers.ModelSerializer):
    """Full order serializer."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    product_item = ProductItemSerializer(read_only=True)
    payment_method = PaymentMethodPublicSerializer(read_only=True)
    payment = serializers.SerializerMethodField()
    digiflazz_transaction = serializers.SerializerMethodField()
    product_rating = serializers.SerializerMethodField()
    coupon_discount = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_email', 'user_name', 'product_item',
            'customer_data', 'original_price', 'final_price', 'coupon_discount',
            'payment_fee', 'vat_amount', 'total_amount', 'payment_method',
            'payment_expires_at', 'status', 'payment', 'digiflazz_transaction',
            'failure_reason', 'completion_data',
            'refund_amount', 'refund_reason', 'refunded_at',
            'product_rating',
            'created_at', 'updated_at', 'paid_at', 'completed_at',
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at', 'paid_at', 'completed_at']

    def get_user_name(self, obj) -> str | None:
        user = obj.user
        if not user:
            return None
        if hasattr(user, 'customer_profile') and user.customer_profile:
            return user.customer_profile.full_name or None
        if hasattr(user, 'staff_profile') and user.staff_profile:
            return user.staff_profile.full_name or None
        return None

    def get_payment(self, obj):
        if hasattr(obj, 'payment'):
            p = obj.payment
            return {
                'id': str(p.id),
                'external_id': p.external_id,
                'transaction_id': p.transaction_id,
                'payment_method': PaymentMethodPublicSerializer(p.payment_method).data if p.payment_method else None,
                'amount': p.amount,
                'status': p.status,
                'payment_url': p.payment_url,
                'va_number': p.va_number,
                'qris_string': p.qris_string,
                'deeplink_url': p.deeplink_url,
                'redirect_url': p.redirect_url,
                'expires_at': p.expires_at,
                'paid_at': p.paid_at,
                'created_at': p.created_at,
            }
        return None

    def get_digiflazz_transaction(self, obj):
        if hasattr(obj, 'digiflazz_transaction'):
            tx = obj.digiflazz_transaction
            return {
                'ref_id': tx.ref_id,
                'trx_id': tx.trx_id,
                'status': tx.status,
                'message': tx.message,
                'serial_number': tx.serial_number,
                'sku_code': tx.sku_code,
                'customer_no': tx.customer_no,
                'created_at': tx.created_at,
                'updated_at': tx.updated_at,
            }
        return None

    def get_product_rating(self, obj) -> int | None:
        """Return the star rating (1-5) the user gave for this order, or null."""
        rating = obj.product_rating.filter(is_active=True).first()
        return rating.rating if rating else None

    def get_coupon_discount(self, obj) -> int | None:
        """Return the coupon discount amount applied to this order, or null."""
        try:
            usage = obj.coupon_usage
            return int(usage.discount_amount) if usage else None
        except Exception:
            return None


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with pricing calculation and coupon handling."""
    coupon_code = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Order
        fields = ['product_item', 'customer_data', 'payment_method', 'coupon_code']

    def validate_product_item(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Produk ini tidak tersedia.")
        if value.digiflazz_status == 'INACTIVE':
            raise serializers.ValidationError("Produk ini sedang tidak aktif di sistem.")
        return value

    def validate_payment_method(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Metode pembayaran ini tidak tersedia.")
        return value

    def validate_customer_data(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Data pelanggan harus berupa object.")
        return value

    def validate(self, data):
        product_item = data.get('product_item')
        payment_method = data.get('payment_method')
        customer_data = data.get('customer_data', {})
        coupon_code = data.get('coupon_code', '').strip().upper()

        if not product_item or not payment_method:
            raise serializers.ValidationError("Product item dan payment method harus diisi.")

        # ── Validate customer_data against this product's input_fields ──
        product = product_item.product
        input_fields = product.input_fields or []
        field_errors = validate_customer_data_against_fields(customer_data, input_fields)
        if field_errors:
            raise serializers.ValidationError({'customer_data': field_errors})

        # Verify the template can be rendered with the supplied data
        template = product.customer_no_template or ''
        if template:
            try:
                build_customer_no(customer_data, template)
            except ValueError as e:
                raise serializers.ValidationError({'customer_data': str(e)})


        original_price = product_item.sell_price
        final_price = original_price
        coupon_discount = 0
        applied_coupon = None

        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                now = timezone.now()
                if coupon.start_date and now < coupon.start_date:
                    raise serializers.ValidationError({'coupon_code': 'Kupon belum dapat digunakan.'})
                if coupon.end_date and now > coupon.end_date:
                    raise serializers.ValidationError({'coupon_code': 'Kupon sudah kadaluarsa.'})
                if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
                    raise serializers.ValidationError({'coupon_code': 'Kupon sudah habis digunakan.'})
                user = self.context.get('request').user if self.context.get('request') else None
                if user and coupon.user_limit:
                    if CouponUsage.objects.filter(coupon=coupon, user=user).count() >= coupon.user_limit:
                        raise serializers.ValidationError(
                            {'coupon_code': 'Anda sudah mencapai batas penggunaan kupon ini.'}
                        )
                if coupon.min_purchase and original_price < coupon.min_purchase:
                    raise serializers.ValidationError(
                        {'coupon_code': f'Minimal pembelian Rp {coupon.min_purchase:,} untuk kupon ini.'}
                    )
                if coupon.discount_type == 'PERCENTAGE':
                    coupon_discount = int(original_price * coupon.discount_value / 100)
                    if coupon.max_discount:
                        coupon_discount = min(coupon_discount, coupon.max_discount)
                else:
                    coupon_discount = int(coupon.discount_value)
                final_price = max(0, original_price - coupon_discount)
                applied_coupon = coupon
            except Coupon.DoesNotExist:
                raise serializers.ValidationError({'coupon_code': 'Kode kupon tidak valid.'})

        # Payment fee
        payment_fee = 0
        if payment_method.fee_type == 'PERCENTAGE':
            payment_fee = int(final_price * float(payment_method.fee_value) / 100)
        else:
            payment_fee = int(payment_method.fee_value)

        # VAT
        vat_amount = 0
        if payment_method.vat_type == 'PERCENTAGE':
            vat_amount = int((final_price + payment_fee) * float(payment_method.vat_value) / 100)
        else:
            vat_amount = int(payment_method.vat_value)

        data['_calculated_values'] = {
            'original_price': original_price,
            'final_price': final_price,
            'coupon_discount': coupon_discount,
            'payment_fee': payment_fee,
            'vat_amount': vat_amount,
            'total_amount': final_price + payment_fee + vat_amount,
            'applied_coupon': applied_coupon,
        }
        return data

    def create(self, validated_data):
        calc = validated_data.pop('_calculated_values')
        validated_data.pop('coupon_code', None)

        order_number = f"ORD-{uuid.uuid4().hex[:12].upper()}"
        payment_expires_at = timezone.now() + timedelta(hours=24)

        order = Order.objects.create(
            order_number=order_number,
            original_price=calc['original_price'],
            final_price=calc['final_price'],
            payment_fee=calc['payment_fee'],
            vat_amount=calc['vat_amount'],
            total_amount=calc['total_amount'],
            payment_expires_at=payment_expires_at,
            status='PENDING',
            **validated_data,
        )

        if calc['applied_coupon']:
            coupon = calc['applied_coupon']
            CouponUsage.objects.create(
                coupon=coupon,
                user=order.user,
                order=order,
                discount_amount=calc['coupon_discount'],
            )
            # usage_count is kept in sync by the post_save signal in signals.py
        return order


# ── Digiflazz transaction ─────────────────────────────────────────────────────

class DigiflazzTransactionSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = DigiflazzTransaction
        fields = [
            'id', 'order', 'order_number', 'ref_id', 'trx_id', 'sku_code',
            'customer_no', 'status', 'message', 'serial_number',
            'response_data', 'webhook_data', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
