import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main.models import Product, Category

print('=' * 80)
print('PRODUCT INPUT FIELDS VERIFICATION')
print('=' * 80)

products = Product.objects.select_related('category').all().order_by('category__name', 'name')

for p in products:
    field_names = [f['name'] for f in p.input_fields] if p.input_fields else []
    field_count = len(p.input_fields) if p.input_fields else 0
    print(f"{p.category.name:12} | {p.name:35} | {field_count} fields | {field_names}")

print('\n' + '=' * 80)
print('SUMMARY BY CATEGORY')
print('=' * 80)

for cat in Category.objects.all():
    products = Product.objects.filter(category=cat)
    with_fields = sum(1 for p in products if p.input_fields and len(p.input_fields) > 0)
    print(f"{cat.name:12} | {with_fields}/{products.count()} products have input_fields")
