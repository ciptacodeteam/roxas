"""
Management command to mark product items containing "cek" as validation items.
"""
from django.core.management.base import BaseCommand
from main.models import ProductItem


class Command(BaseCommand):
    help = 'Mark product items containing "cek" as validation items'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Find items containing "cek" (case-insensitive)
        validation_items = ProductItem.objects.filter(
            name__icontains='cek'
        )
        
        count = validation_items.count()
        
        if dry_run:
            self.stdout.write(self.style.WARNING(
                f'DRY RUN: Would mark {count} items as validation items:'
            ))
            for item in validation_items:
                self.stdout.write(f'  - {item.product.name}: {item.name} ({item.sku_code})')
        else:
            if count == 0:
                self.stdout.write(self.style.WARNING(
                    'No items found containing "cek"'
                ))
                return
            
            # Update items
            updated = validation_items.update(is_validation_item=True)
            
            self.stdout.write(self.style.SUCCESS(
                f'Successfully marked {updated} items as validation items:'
            ))
            
            # Refresh queryset to show updated items
            validation_items = ProductItem.objects.filter(
                name__icontains='cek',
                is_validation_item=True
            )
            
            for item in validation_items:
                self.stdout.write(f'  ✓ {item.product.name}: {item.name} ({item.sku_code})')
            
            self.stdout.write(self.style.SUCCESS(
                '\nThese items are now hidden from public listings.'
            ))
