#!/usr/bin/env python
"""Check Mobile Legends input fields"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main.models import Product

# Find Mobile Legends product
ml = Product.objects.filter(slug__icontains='mobile').first()

if ml:
    print(f"✓ Product found: {ml.name}")
    print(f"✓ Slug: {ml.slug}")
    print(f"✓ Input Fields: {ml.input_fields}")
    
    if not ml.input_fields:
        print("\n⚠ No input fields found! Adding default Mobile Legends input fields...")
        ml.input_fields = [
            {
                "name": "userId",
                "label": "User ID",
                "required": True,
                "dialog": {
                    "title": "Cara Menemukan User ID",
                    "content": "Buka Mobile Legends → Profile → Salin User ID Anda"
                }
            },
            {
                "name": "serverId",
                "label": "Server ID",
                "required": True
            }
        ]
        ml.save()
        print("✓ Input fields added successfully!")
else:
    print("✗ Mobile Legends product not found in database")
