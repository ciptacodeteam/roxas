from django.db.models import F
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from django.core.files.base import ContentFile
from io import BytesIO
from PIL import Image
import os
import logging

from .models import (
    Order,
    Payment,
    DigiflazzTransaction,
    FlashSaleItem,
    CouponUsage,
    Product,
    ProductItem,
    MarketingBanner,
    CategoryInstructionImage,
    PaymentMethod,
)


# ============================================
# ORDER SIGNALS
# ============================================

@receiver(post_save, sender=Payment)
def update_order_on_payment_success(sender, instance, created, **kwargs):
    """
    Update order status when payment is successful.
    """
    if instance.status == 'SETTLEMENT' and instance.order:
        order = instance.order
        if order.status == 'PENDING':
            order.status = 'PAID'
            order.paid_at = instance.paid_at or timezone.now()
            order.save(update_fields=['status', 'paid_at', 'updated_at'])


@receiver(post_save, sender=DigiflazzTransaction)
def update_order_on_digiflazz_success(sender, instance, created, **kwargs):
    """
    Update order status when Digiflazz transaction is successful.
    """
    if instance.status == 'SUKSES' and instance.order:
        order = instance.order
        if order.status in ['PAID', 'PROCESSING']:
            order.status = 'COMPLETED'
            order.completed_at = timezone.now()
            order.save(update_fields=['status', 'completed_at', 'updated_at'])
    elif instance.status == 'GAGAL' and instance.order:
        order = instance.order
        if order.status in ['PAID', 'PROCESSING']:
            order.status = 'FAILED'
            order.save(update_fields=['status', 'updated_at'])


# ============================================
# FLASH SALE SIGNALS
# ============================================

@receiver(post_save, sender=Order)
def update_flash_sale_sold_count(sender, instance, created, **kwargs):
    """
    Increment flash sale sold count when order is completed.
    """
    if not created and instance.status == 'COMPLETED':
        # Check if this order has a flash sale item
        flash_sale_item = FlashSaleItem.objects.filter(
            product_item=instance.product_item,
            flash_sale__is_active=True,
            flash_sale__start_time__lte=timezone.now(),
            flash_sale__end_time__gte=timezone.now()
        ).first()
        
        if flash_sale_item:
            FlashSaleItem.objects.filter(pk=flash_sale_item.pk).update(
                sold_count=F('sold_count') + 1
            )


# ============================================
# COUPON SIGNALS
# ============================================

@receiver(post_save, sender=CouponUsage)
def increment_coupon_usage(sender, instance, created, **kwargs):
    """
    Increment coupon usage count when a new usage is created.
    """
    if created:
        from .models import Coupon
        Coupon.objects.filter(pk=instance.coupon_id).update(
            usage_count=F('usage_count') + 1
        )


@receiver(pre_delete, sender=CouponUsage)
def decrement_coupon_usage(sender, instance, **kwargs):
    """
    Decrement coupon usage count when usage is deleted (e.g., order cancelled).
    """
    from .models import Coupon
    Coupon.objects.filter(pk=instance.coupon_id, usage_count__gt=0).update(
        usage_count=F('usage_count') - 1
    )


# ============================================
# IMAGE OPTIMIZATION SIGNALS
# ============================================

logger = logging.getLogger('main')
_optimizing = set()


def _optimize_image_field(instance, field_name, max_width=1920, max_height=1920, quality=85):
    """Helper function to optimize an image field to WebP format."""
    if not instance.pk:
        return
    
    instance_id = f"{instance.__class__.__name__}_{instance.pk}_{field_name}"
    
    if instance_id in _optimizing:
        return
    
    image_field = getattr(instance, field_name, None)
    if image_field and image_field.name and not image_field.name.lower().endswith('.webp'):
        name = image_field.name
        # Skip absolute paths, URLs, and SVG files — they are not media-managed rasterised images
        if (
            name.startswith('/')
            or name.startswith('http://') or name.startswith('https://')
            or name.lower().endswith('.svg')
        ):
            logger.debug(f"Skipping optimization for {field_name}: not a media-managed raster image ({name!r})")
            return
        _optimizing.add(instance_id)
        try:
            # Check if file exists and is accessible in media storage
            if not image_field.storage.exists(name):
                logger.debug(f"Skipping optimization for {field_name}: file does not exist in storage")
                return
            
            # Open image
            image_field.seek(0)
            img = Image.open(image_field)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])
                else:
                    background.paste(img)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize if too large
            if img.width > max_width or img.height > max_height:
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Save to WebP
            output = BytesIO()
            img.save(output, format='WebP', quality=quality, method=6)
            output.seek(0)
            
            # Update filename
            original_name = os.path.basename(image_field.name)
            base_name = os.path.splitext(original_name)[0]
            webp_filename = f"{base_name}.webp"
            
            # Save optimized image
            image_field.save(webp_filename, ContentFile(output.read()), save=False)
            instance.save(update_fields=[field_name])
            
        except Exception as e:
            logger.error(f"Error optimizing image {field_name}: {str(e)}", exc_info=True)
        finally:
            _optimizing.discard(instance_id)

@receiver(post_save, sender=CategoryInstructionImage)
def optimize_category_instruction_image(sender, instance, created, **kwargs):
    """Optimize category instruction image when saved."""
    _optimize_image_field(instance, 'image', max_width=1920, max_height=1080)

@receiver(post_save, sender=Product)
def optimize_product_images(sender, instance, created, **kwargs):
    """Optimize product images when saved."""
    _optimize_image_field(instance, 'image')
    _optimize_image_field(instance, 'banner_image')


@receiver(post_save, sender=ProductItem)
def optimize_product_item_icon(sender, instance, created, **kwargs):
    """Optimize product item icon when saved."""
    _optimize_image_field(instance, 'icon_image', max_width=512, max_height=512)


@receiver(post_save, sender=MarketingBanner)
def optimize_banner_image(sender, instance, created, **kwargs):
    """Optimize marketing banner image when saved."""
    _optimize_image_field(instance, 'image', max_width=2560, max_height=1440)


@receiver(post_save, sender=PaymentMethod)
def optimize_payment_method_icon(sender, instance, created, **kwargs):
    """Optimize payment method icon when saved."""
    _optimize_image_field(instance, 'icon', max_width=512, max_height=512)
