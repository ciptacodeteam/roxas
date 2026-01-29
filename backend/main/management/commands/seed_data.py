"""
Django management command to seed initial data.

Usage:
    python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from account.models import UserRole
from main.models import (
    PaymentMethod, PaymentMethodType, FeeType,
    Coupon, DiscountType
)
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed initial data for the application'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🌱 Starting data seeding...\n'))

        # Create admin user
        self.seed_admin_user()

        # Seed payment methods
        self.seed_payment_methods()

        # Seed coupons
        self.seed_coupons()

        self.stdout.write(self.style.SUCCESS('\n✅ Seeding completed!\n'))

    def seed_admin_user(self):
        """Create admin user if it doesn't exist."""
        self.stdout.write('🌱 Seeding admin user...')

        admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123456')

        if User.objects.filter(email=admin_email).exists():
            self.stdout.write('ℹ️  Admin user already exists: {}'.format(admin_email))
            return

        try:
            admin_user = User.objects.create_superuser(
                email=admin_email,
                password=admin_password,
                role=UserRole.STAFF,
            )
            self.stdout.write(self.style.SUCCESS('✅ Admin user created: {}'.format(admin_email)))
            self.stdout.write('   Password: {}'.format(admin_password))
            self.stdout.write('   Role: STAFF')
        except Exception as e:
            self.stdout.write(self.style.ERROR('❌ Failed to create admin user: {}'.format(str(e))))

    def seed_payment_methods(self):
        """Seed payment methods based on Midtrans pricing."""
        self.stdout.write('\n🌱 Seeding payment methods...')

        # Reference: https://midtrans.com/pricing
        payment_methods = [
            # QRIS - 0.7% (VAT included in fee)
            {
                'type': PaymentMethodType.QRIS,
                'name': 'QRIS (Semua Pembayaran)',
                'description': 'Bayar dengan QRIS melalui semua aplikasi pembayaran',
                'icon': '/svg/QRIS_Logo.svg',
                'fee_type': FeeType.PERCENTAGE,
                'fee_value': 0.7,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 0,  # VAT included in fee
                'is_active': True,
                'midtrans_code': 'qris',
            },
            # E-Wallet - GoPay - 2% (VAT included)
            {
                'type': PaymentMethodType.E_WALLET,
                'name': 'GoPay',
                'description': 'Bayar dengan GoPay melalui aplikasi Gojek',
                'icon': '',
                'fee_type': FeeType.PERCENTAGE,
                'fee_value': 2.0,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 0,  # VAT included in fee
                'is_active': True,
                'midtrans_code': 'gopay',
            },
            # E-Wallet - ShopeePay - 2% (VAT included)
            {
                'type': PaymentMethodType.E_WALLET,
                'name': 'ShopeePay',
                'description': 'Bayar dengan ShopeePay melalui aplikasi Shopee',
                'icon': '',
                'fee_type': FeeType.PERCENTAGE,
                'fee_value': 2.0,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 0,
                'is_active': True,
                'midtrans_code': 'shopeepay',
            },
            # Credit Card - 2.9% + IDR 2,000 (VAT applies)
            {
                'type': PaymentMethodType.CREDIT_CARD,
                'name': 'Kartu Kredit',
                'description': 'Bayar dengan kartu kredit Visa, Mastercard, JCB, atau American Express',
                'icon': '',
                'fee_type': FeeType.PERCENTAGE,
                'fee_value': 2.9,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,  # 11% VAT on fee
                'is_active': True,
                'midtrans_code': 'credit_card',
            },
            # Mobile Banking - BCA - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'BCA Virtual Account',
                'description': 'Transfer melalui BCA Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'bca',
            },
            # Mobile Banking - BNI - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'BNI Virtual Account',
                'description': 'Transfer melalui BNI Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'bni',
            },
            # Mobile Banking - Mandiri - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'Mandiri Virtual Account',
                'description': 'Transfer melalui Mandiri Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'mandiri',
            },
            # Mobile Banking - Permata - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'Permata Virtual Account',
                'description': 'Transfer melalui Permata Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'permata',
            },
            # Mobile Banking - BRI - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'BRI Virtual Account',
                'description': 'Transfer melalui BRI Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'bri',
            },
            # Mobile Banking - BSI - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'BSI Virtual Account',
                'description': 'Transfer melalui BSI Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'bsi',
            },
            # Mobile Banking - Danamon - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'Danamon Virtual Account',
                'description': 'Transfer melalui Danamon Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'danamon',
            },
            # Mobile Banking - CIMB - IDR 4,000 (VAT applies)
            {
                'type': PaymentMethodType.MOBILE_BANKING,
                'name': 'CIMB Virtual Account',
                'description': 'Transfer melalui CIMB Virtual Account',
                'icon': '',
                'fee_type': FeeType.FIXED,
                'fee_value': 4000,
                'vat_type': FeeType.PERCENTAGE,
                'vat_value': 11,
                'is_active': True,
                'midtrans_code': 'cimb',
            },
        ]

        for pm_data in payment_methods:
            try:
                # Check if payment method exists
                existing = PaymentMethod.objects.filter(
                    type=pm_data['type'],
                ).first()

                if existing:
                    # Update existing
                    for key, value in pm_data.items():
                        setattr(existing, key, value)
                    existing.save()
                    self.stdout.write('✅ Payment method updated: {}'.format(pm_data['name']))
                else:
                    # Create new
                    PaymentMethod.objects.create(**pm_data)
                    self.stdout.write(self.style.SUCCESS('✅ Payment method created: {}'.format(pm_data['name'])))

            except Exception as e:
                self.stdout.write(self.style.ERROR('❌ Failed to seed payment method {}: {}'.format(
                    pm_data['name'], str(e)
                )))

        self.stdout.write(self.style.SUCCESS('✅ Payment methods seeded successfully!'))

    def seed_coupons(self):
        """Seed promotional coupons."""
        self.stdout.write('\n🌱 Seeding coupons...')

        coupons = [
            # Welcome coupon - 10% off, max discount 50k
            {
                'code': 'WELCOME10',
                'description': 'Selamat datang! Dapatkan diskon 10% untuk pembelian pertama Anda',
                'discount_type': DiscountType.PERCENTAGE,
                'discount_value': 10,
                'min_purchase': 50000,
                'max_discount': 50000,
                'usage_limit': 1000,
                'user_limit': 1,
                'is_active': True,
            },
            # Flash sale coupon - 15% off, max discount 100k
            {
                'code': 'FLASH15',
                'description': 'Flash sale! Dapatkan diskon 15% untuk pembelian di atas Rp 100.000',
                'discount_type': DiscountType.PERCENTAGE,
                'discount_value': 15,
                'min_purchase': 100000,
                'max_discount': 100000,
                'usage_limit': 500,
                'user_limit': 1,
                'is_active': True,
            },
            # Fixed amount coupon - Rp 20.000 off
            {
                'code': 'DISKON20K',
                'description': 'Potongan langsung Rp 20.000 untuk pembelian minimal Rp 50.000',
                'discount_type': DiscountType.FIXED_AMOUNT,
                'discount_value': 20000,
                'min_purchase': 50000,
                'max_discount': None,
                'usage_limit': 2000,
                'user_limit': 1,
                'is_active': True,
            },
            # Big discount - 25% off, max 200k
            {
                'code': 'BIG25',
                'description': 'Diskon besar! Dapatkan 25% off untuk pembelian di atas Rp 200.000',
                'discount_type': DiscountType.PERCENTAGE,
                'discount_value': 25,
                'min_purchase': 200000,
                'max_discount': 200000,
                'usage_limit': 200,
                'user_limit': 1,
                'is_active': True,
            },
            # New user special - Rp 10.000 off
            {
                'code': 'NEWUSER',
                'description': 'Khusus pengguna baru! Potongan Rp 10.000',
                'discount_type': DiscountType.FIXED_AMOUNT,
                'discount_value': 10000,
                'min_purchase': 30000,
                'max_discount': None,
                'usage_limit': 5000,
                'user_limit': 1,
                'is_active': True,
            },
            # Weekend special - 12% off
            {
                'code': 'WEEKEND12',
                'description': 'Diskon akhir pekan! Dapatkan 12% off',
                'discount_type': DiscountType.PERCENTAGE,
                'discount_value': 12,
                'min_purchase': 75000,
                'max_discount': 75000,
                'usage_limit': None,  # Unlimited
                'user_limit': 1,
                'is_active': True,
            },
        ]

        for coupon_data in coupons:
            try:
                coupon, created = Coupon.objects.update_or_create(
                    code=coupon_data['code'],
                    defaults=coupon_data
                )
                if created:
                    self.stdout.write(self.style.SUCCESS('✅ Coupon created: {}'.format(coupon_data['code'])))
                else:
                    self.stdout.write('✅ Coupon updated: {}'.format(coupon_data['code']))

            except Exception as e:
                self.stdout.write(self.style.ERROR('❌ Failed to seed coupon {}: {}'.format(
                    coupon_data['code'], str(e)
                )))

        self.stdout.write(self.style.SUCCESS('✅ Coupons seeded successfully!'))
