"""
Diagnostic script to test Digiflazz signature generation

This script helps you verify:
1. Your environment variables are loaded correctly
2. The signature is generated correctly
3. Compares with a sample signature

Usage (from backend directory):
    # If running locally:
    python test_digiflazz_signature.py
    
    # If running in Docker:
    docker-compose exec backend python test_digiflazz_signature.py
"""

import os
import hashlib
import sys
import django
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def test_signature():
    """Test Digiflazz signature generation"""
    
    print("=" * 70)
    print("DIGIFLAZZ SIGNATURE DIAGNOSTIC TEST")
    print("=" * 70)
    
    # Get credentials
    username = os.environ.get("DIGIFLAZZ_USERNAME", "").strip()
    api_key = os.environ.get("DIGIFLAZZ_API_KEY", "").strip()
    environment = os.environ.get("DIGIFLAZZ_ENVIRONMENT", "production")
    
    print(f"\n1. ENVIRONMENT CHECK:")
    print(f"   Environment: {environment}")
    print(f"   Username: '{username}'")
    print(f"   Username length: {len(username)}")
    
    if not username:
        print("   ❌ ERROR: DIGIFLAZZ_USERNAME is empty!")
        return False
    
    # Mask API key for security
    if api_key:
        masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "***"
        print(f"   API Key: {masked_key}")
        print(f"   API Key length: {len(api_key)}")
    else:
        print("   ❌ ERROR: DIGIFLAZZ_API_KEY is empty!")
        return False
    
    # Check for whitespace issues
    print(f"\n2. WHITESPACE CHECK:")
    username_stripped = username.strip()
    api_key_stripped = api_key.strip()
    
    if username != username_stripped:
        print(f"   ⚠️  WARNING: Username has whitespace!")
        print(f"   Before strip: '{username}' (len={len(username)})")
        print(f"   After strip: '{username_stripped}' (len={len(username_stripped)})")
    else:
        print("   ✓ Username has no leading/trailing whitespace")
    
    if api_key != api_key_stripped:
        print(f"   ⚠️  WARNING: API Key has whitespace!")
        print(f"   Before strip length: {len(api_key)}")
        print(f"   After strip length: {len(api_key_stripped)}")
    else:
        print("   ✓ API Key has no leading/trailing whitespace")
    
    # Test signature generation
    print(f"\n3. SIGNATURE GENERATION TEST:")
    
    # Test with the actual ref_id from your logs
    test_ref_id = "CHECK-E05B7EFE8594"
    
    # Generate signature
    signature_string = f"{username}{api_key}{test_ref_id}"
    signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()
    
    print(f"   Test Ref ID: {test_ref_id}")
    print(f"   Signature string length: {len(signature_string)}")
    print(f"   Signature string first 50 chars: {signature_string[:50]}...")
    print(f"   Signature string last 30 chars: ...{signature_string[-30:]}")
    print(f"   Generated signature: {signature}")
    
    # Test with example from documentation
    print(f"\n4. DOCUMENTATION EXAMPLE TEST:")
    doc_username = "username"
    doc_api_key = "apiKey123"
    doc_ref_id = "some1d"
    doc_signature_string = f"{doc_username}{doc_api_key}{doc_ref_id}"
    doc_signature = hashlib.md5(doc_signature_string.encode('utf-8')).hexdigest()
    
    print(f"   Example: username='{doc_username}', apiKey='{doc_api_key}', ref_id='{doc_ref_id}'")
    print(f"   Example signature string: '{doc_signature_string}'")
    print(f"   Example generated signature: {doc_signature}")
    print(f"   Expected from docs: 740b00a1b8784e028cc8078edf66d12b")
    
    # Verify production vs development keys
    print(f"\n5. ENVIRONMENT VERIFICATION:")
    if environment == "production":
        print("   ✓ Using PRODUCTION environment")
        if "dev" in username.lower() or "test" in username.lower():
            print("   ⚠️  WARNING: Username contains 'dev' or 'test'")
            print("   ℹ️  Make sure you're using PRODUCTION credentials!")
    else:
        print("   ⚠️  Using DEVELOPMENT environment")
        print("   ℹ️  This is OK for testing, but use production for real transactions")
    
    # Check for common issues
    print(f"\n6. COMMON ISSUES CHECK:")
    issues_found = []
    
    # Check if using development credentials in production
    if environment == "production":
        if "sandbox" in username.lower() or "sandbox" in api_key.lower():
            issues_found.append("Using sandbox credentials in production mode")
        if "dev" in username.lower():
            issues_found.append("Username contains 'dev' - might be development credentials")
    
    # Check for special characters that might cause issues
    special_chars = [' ', '\t', '\n', '\r']
    for char in special_chars:
        if char in username or char in api_key:
            issues_found.append(f"Credentials contain special character: {repr(char)}")
    
    if issues_found:
        print("   ⚠️  POTENTIAL ISSUES FOUND:")
        for issue in issues_found:
            print(f"      - {issue}")
    else:
        print("   ✓ No common issues detected")
    
    print(f"\n" + "=" * 70)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 70)
    
    print("\nℹ️  NEXT STEPS:")
    print("1. Verify the username and API key match what's in Digiflazz member area")
    print("2. Ensure you're using PRODUCTION credentials (not development/sandbox)")
    print("3. Check IP whitelist at: https://member.digiflazz.com/buyer-area/connection/api")
    print("4. Your production IP should be: 167.71.197.123")
    print("5. If signature still fails, contact Digiflazz support with:")
    print(f"   - Your username: {username}")
    print(f"   - API endpoint: https://api.digiflazz.com/v1/transaction")
    print(f"   - Error: rc: 41 - Signature Anda salah")
    
    return True

if __name__ == "__main__":
    try:
        test_signature()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
