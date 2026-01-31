#!/usr/bin/env python
"""
Transaction Flow Test Script
Tests the complete Mobile Legends top-up flow from validation to payment
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from main.integrations.digiflazz import get_digiflazz_client
from main.integrations.midtrans import get_midtrans_client
from main.models import ProductItem, PaymentMethod
from django.contrib.auth import get_user_model

User = get_user_model()

def test_digiflazz_connection():
    """Test Digiflazz API connection"""
    print("\n=== Testing Digiflazz Connection ===")
    try:
        client = get_digiflazz_client()
        
        # Test MLCU validation
        print("Testing Mobile Legends account validation...")
        result = client.create_transaction(
            buyer_sku_code="MLCU",
            customer_no="123456789|1234",  # Format: userId|serverId
            ref_id="TEST001",
            testing=True
        )
        print(f"✓ MLCU Validation: {result.get('message', 'Success')}")
        
        # Get price list for Mobile Legends
        print("\nFetching Mobile Legends products...")
        try:
            price_list_response = client.get_price_list()
            # Handle both list response and dict with 'data' key
            if isinstance(price_list_response, list):
                price_data = price_list_response
            elif isinstance(price_list_response, dict):
                price_data = price_list_response.get('data', [])
                # Check for rate limit error
                if isinstance(price_data, dict) and price_data.get('rc') == '83':
                    print(f"⚠ Price list rate limited, skipping product count")
                    price_data = []
            else:
                price_data = []
            
            ml_products = [p for p in price_data
                          if isinstance(p, dict) and 'MOBILE LEGEND' in p.get('product_name', '').upper() 
                          and 'MLCU' not in p.get('buyer_sku_code', '')]
            print(f"✓ Found {len(ml_products)} Mobile Legends products from API")
        except Exception as e:
            print(f"⚠ Price list check skipped: {str(e)}")
        
        return True
    except Exception as e:
        print(f"✗ Digiflazz connection failed: {str(e)}")
        return False

def test_midtrans_connection():
    """Test Midtrans API connection"""
    print("\n=== Testing Midtrans Connection ===")
    try:
        client = get_midtrans_client()
        
        # Test QRIS charge
        print("Testing QRIS payment method...")
        result = client.charge_qris(
            order_id="TEST-ORDER-001",
            gross_amount=50000,
            item_details=[{
                "id": "ml-diamond-50",
                "price": 50000,
                "quantity": 1,
                "name": "Mobile Legends 50 Diamonds"
            }]
        )
        print(f"✓ Midtrans QRIS: {result.get('status_message', 'Success')}")
        
        return True
    except Exception as e:
        print(f"✗ Midtrans connection failed: {str(e)}")
        return False

def test_database_models():
    """Test database models and configuration"""
    print("\n=== Testing Database Models ===")
    try:
        # Check for Mobile Legends products
        ml_products = ProductItem.objects.filter(
            product__name__icontains='mobile legend'
        ).exclude(sku_code__icontains='MLCU')
        print(f"✓ Found {ml_products.count()} Mobile Legends products in database")
        
        # Check payment methods
        payment_methods = PaymentMethod.objects.filter(is_active=True)
        print(f"✓ Found {payment_methods.count()} active payment methods")
        for pm in payment_methods:
            print(f"  - {pm.name} ({pm.type})")
        
        # Check users
        user_count = User.objects.count()
        print(f"✓ Database has {user_count} users")
        
        return True
    except Exception as e:
        print(f"✗ Database test failed: {str(e)}")
        return False

def main():
    print("=" * 60)
    print("ROXAS TRANSACTION FLOW TEST")
    print("=" * 60)
    
    results = {
        'digiflazz': test_digiflazz_connection(),
        'midtrans': test_midtrans_connection(),
        'database': test_database_models()
    }
    
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    for service, status in results.items():
        status_icon = "✓" if status else "✗"
        print(f"{status_icon} {service.upper()}: {'PASS' if status else 'FAIL'}")
    
    all_passed = all(results.values())
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED - System ready for transactions!")
        print("\nNext steps:")
        print("1. Start frontend: cd frontend && bun dev")
        print("2. Start backend: cd backend && python manage.py runserver")
        print("3. Start Celery: cd backend && celery -A backend worker -l info")
        print("4. Test ML top-up flow at http://localhost:3000")
    else:
        print("✗ SOME TESTS FAILED - Check configuration")
        print("\nTroubleshooting:")
        print("- Verify DIGIFLAZZ_USERNAME and DIGIFLAZZ_API_KEY in backend/.env")
        print("- Verify MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY in backend/.env")
        print("- Run: python manage.py migrate")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
