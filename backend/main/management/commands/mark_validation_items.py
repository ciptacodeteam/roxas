"""
Management command to mark product items used for account validation
(e.g. MLCU, FFCEK, plncek) as validation items so they are hidden
from the public storefront but usable by the validate-account endpoint.
"""
from django.core.management.base import BaseCommand
from django.db.models import Q
from main.models import ProductItem

# SKU-code patterns that identify known validation items
_VALIDATION_SKU_PATTERNS = [
    "MLCU",      # Mobile Legends Cek Username
    "FFCEK",     # Free Fire Cek
    "plncek",    # PLN Cek
]


class Command(BaseCommand):
    help = 'Mark product items used for account validation (by name or SKU code)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        # Match items whose name contains "cek" OR whose sku_code matches
        # any of the known validation patterns (case-insensitive).
        q = Q(name__icontains='cek')
        for pattern in _VALIDATION_SKU_PATTERNS:
            q |= Q(sku_code__icontains=pattern)

        validation_items = ProductItem.objects.filter(q)
        count = validation_items.count()

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'DRY RUN: Would mark {count} items as validation items:'
            ))
            for item in validation_items.select_related('product'):
                already = '(already marked)' if item.is_validation_item else ''
                self.stdout.write(
                    f'  - {item.product.name}: {item.name} ({item.sku_code}) {already}'
                )
        else:
            if count == 0:
                self.stdout.write(self.style.WARNING(
                    'No validation items found matching known patterns.'
                ))
                return

            updated = validation_items.update(is_validation_item=True)

            self.stdout.write(self.style.SUCCESS(
                f'Successfully marked {updated} items as validation items:'
            ))

            for item in validation_items.select_related('product'):
                self.stdout.write(
                    f'  ✓ {item.product.name}: {item.name} ({item.sku_code})'
                )

            self.stdout.write(self.style.SUCCESS(
                '\nThese items are now hidden from public listings and '
                'usable by the validate-account endpoint.'
            ))
