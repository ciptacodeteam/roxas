"""
Management command to fix missing VA numbers in Payment records.
Extracts VA numbers from webhook_data for payments that don't have va_number set.
"""

from django.core.management.base import BaseCommand
from main.models import Payment
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fix missing VA numbers in Payment records by extracting from webhook_data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find payments with webhook_data but no va_number
        payments_to_fix = Payment.objects.filter(
            va_number__isnull=True,
            webhook_data__isnull=False
        ).exclude(webhook_data={})
        
        self.stdout.write(f"Found {payments_to_fix.count()} payments to check")
        
        fixed_count = 0
        for payment in payments_to_fix:
            webhook_data = payment.webhook_data
            va_number = None
            
            # Try different VA number extraction methods
            if webhook_data.get('va_numbers'):
                # Standard format: va_numbers array
                va_number = webhook_data['va_numbers'][0].get('va_number')
                source = 'va_numbers'
            elif webhook_data.get('permata_va_number'):
                # Permata specific field
                va_number = webhook_data.get('permata_va_number')
                source = 'permata_va_number'
            elif webhook_data.get('biller_code'):
                # Mandiri specific: biller_code + bill_key
                va_number = f"{webhook_data.get('biller_code')}{webhook_data.get('bill_key', '')}"
                source = 'biller_code + bill_key'
            
            if va_number:
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"[DRY RUN] Would update Payment {payment.id} "
                            f"(Order: {payment.order.order_number}): "
                            f"VA={va_number} (from {source})"
                        )
                    )
                else:
                    payment.va_number = va_number
                    payment.save(update_fields=['va_number'])
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✅ Updated Payment {payment.id} "
                            f"(Order: {payment.order.order_number}): "
                            f"VA={va_number}"
                        )
                    )
                fixed_count += 1
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"\n[DRY RUN] Would fix {fixed_count} payments. "
                    f"Run without --dry-run to apply changes."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n✅ Successfully fixed {fixed_count} payments"
                )
            )
