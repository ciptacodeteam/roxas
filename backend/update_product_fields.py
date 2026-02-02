"""
Update product input_fields based on category
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main.models import Product, Category

# Define input_fields templates based on category
GAME_FIELDS = [
    {
        "name": "userId",
        "label": "User ID",
        "type": "text",
        "placeholder": "Enter User ID",
        "required": True,
        "dialog": {
            "title": "How to find User ID",
            "steps": [
                "Open the game",
                "Go to profile/settings",
                "Copy your User ID"
            ]
        }
    },
    {
        "name": "serverId",
        "label": "Server ID",
        "type": "text",
        "placeholder": "Enter Server ID",
        "required": True,
        "dialog": {
            "title": "How to find Server ID",
            "steps": [
                "Open the game",
                "Go to profile/settings",
                "Copy your Server ID"
            ]
        }
    }
]

PULSA_FIELDS = [
    {
        "name": "phoneNumber",
        "label": "Nomor HP",
        "type": "tel",
        "placeholder": "08xxxxxxxxxx",
        "required": True,
        "validation": {
            "pattern": "^08[0-9]{8,11}$",
            "message": "Format nomor HP tidak valid"
        }
    }
]

PLN_FIELDS = [
    {
        "name": "meterNumber",
        "label": "Nomor Meter / ID Pelanggan",
        "type": "text",
        "placeholder": "Enter meter number",
        "required": True,
        "validation": {
            "pattern": "^[0-9]{11,12}$",
            "message": "Nomor meter harus 11-12 digit"
        }
    }
]

VOUCHER_FIELDS = [
    {
        "name": "userId",
        "label": "User ID / Email",
        "type": "text",
        "placeholder": "Enter User ID or Email",
        "required": True
    }
]

def update_products():
    """Update all products with appropriate input_fields"""
    
    # Get categories
    games_cat = Category.objects.filter(name='Games').first()
    pulsa_cat = Category.objects.filter(name='Pulsa').first()
    pln_cat = Category.objects.filter(name='PLN').first()
    voucher_cat = Category.objects.filter(name='Voucher').first()
    
    updated_count = 0
    
    # Update Games (except Mobile Legends which already has fields)
    if games_cat:
        game_products = Product.objects.filter(category=games_cat)
        for product in game_products:
            if not product.input_fields or product.input_fields == []:
                product.input_fields = GAME_FIELDS
                product.save()
                print(f"✓ Updated {product.name} with game fields")
                updated_count += 1
            else:
                print(f"- Skipped {product.name} (already has fields)")
    
    # Update Pulsa
    if pulsa_cat:
        pulsa_products = Product.objects.filter(category=pulsa_cat)
        for product in pulsa_products:
            if not product.input_fields or product.input_fields == []:
                product.input_fields = PULSA_FIELDS
                product.save()
                print(f"✓ Updated {product.name} with pulsa fields")
                updated_count += 1
            else:
                print(f"- Skipped {product.name} (already has fields)")
    
    # Update PLN
    if pln_cat:
        pln_products = Product.objects.filter(category=pln_cat)
        for product in pln_products:
            if not product.input_fields or product.input_fields == []:
                product.input_fields = PLN_FIELDS
                product.save()
                print(f"✓ Updated {product.name} with PLN fields")
                updated_count += 1
            else:
                print(f"- Skipped {product.name} (already has fields)")
    
    # Update Voucher
    if voucher_cat:
        voucher_products = Product.objects.filter(category=voucher_cat)
        for product in voucher_products:
            if not product.input_fields or product.input_fields == []:
                product.input_fields = VOUCHER_FIELDS
                product.save()
                print(f"✓ Updated {product.name} with voucher fields")
                updated_count += 1
            else:
                print(f"- Skipped {product.name} (already has fields)")
    
    print(f"\n{'='*60}")
    print(f"Updated {updated_count} products")
    print(f"{'='*60}")
    
    # Show summary
    print("\nSummary by category:")
    for cat in Category.objects.all():
        products = Product.objects.filter(category=cat)
        with_fields = sum(1 for p in products if p.input_fields and p.input_fields != [])
        print(f"  {cat.name}: {with_fields}/{products.count()} products have input_fields")

if __name__ == '__main__':
    print("Updating product input_fields...\n")
    update_products()
