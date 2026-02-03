#!/usr/bin/env python
"""
Quick verification script to debug Digiflazz signature issues.
Run inside Docker: docker exec roxas-api-backend python verify_digiflazz.py
"""
import os
import hashlib

# Get credentials from environment
username = os.environ.get('DIGIFLAZZ_USERNAME', '')
api_key = os.environ.get('DIGIFLAZZ_API_KEY', '')

print("=" * 60)
print("DIGIFLAZZ CREDENTIAL VERIFICATION")
print("=" * 60)

# Check for issues
print(f"\n1. USERNAME:")
print(f"   Raw value: '{username}'")
print(f"   Length: {len(username)}")
print(f"   Has leading/trailing whitespace: {username != username.strip()}")
print(f"   Contains quotes: {'\"' in username or \"'\" in username}")
print(f"   Hex dump: {username.encode().hex()}")

print(f"\n2. API KEY:")
print(f"   First 4 chars: '{api_key[:4]}'")
print(f"   Last 4 chars: '{api_key[-4:]}'")
print(f"   Length: {len(api_key)}")
print(f"   Has leading/trailing whitespace: {api_key != api_key.strip()}")
print(f"   Contains quotes: {'\"' in api_key or \"'\" in api_key}")
print(f"   Contains dashes: {'-' in api_key}")
print(f"   Hex dump (first 20 chars): {api_key[:20].encode().hex()}")

# Generate test signature
test_ref_id = "CHECK-A33C62745034"
signature_string = f"{username}{api_key}{test_ref_id}"
signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()

print(f"\n3. SIGNATURE TEST:")
print(f"   Test ref_id: '{test_ref_id}'")
print(f"   Signature string length: {len(signature_string)}")
print(f"   Expected format: username + apiKey + ref_id")
print(f"   Generated signature: {signature}")

# Check if this matches the one from your logs
expected_signature = "ea71fa17917e22672276b3630ecc30e4"
print(f"\n4. SIGNATURE COMPARISON:")
print(f"   Your log signature: {expected_signature}")
print(f"   Our calculation:    {signature}")
print(f"   Match: {signature == expected_signature}")

# Detailed byte-by-byte check
print(f"\n5. DETAILED SIGNATURE STRING ANALYSIS:")
print(f"   Full signature string (first 50 chars): {repr(signature_string[:50])}")
print(f"   Full signature string (last 50 chars): {repr(signature_string[-50:])}")

# Check for invisible characters
import unicodedata
invisible_chars = []
for i, char in enumerate(signature_string):
    if unicodedata.category(char) in ('Cc', 'Cf', 'Co', 'Cs', 'Zl', 'Zp', 'Zs') and char not in (' ', '\t', '\n'):
        invisible_chars.append((i, repr(char), hex(ord(char))))
if invisible_chars:
    print(f"\n   WARNING: Found invisible/control characters:")
    for pos, char_repr, hex_val in invisible_chars:
        print(f"     Position {pos}: {char_repr} ({hex_val})")
else:
    print(f"\n   No invisible/control characters found in signature string")

print("\n" + "=" * 60)
print("MANUAL VERIFICATION")
print("=" * 60)
print("""
To manually verify your signature:

1. Go to: https://www.md5hashgenerator.com/
2. Enter: <your_username><your_api_key><ref_id>
   (NO spaces or separators between them!)
3. Compare the MD5 hash with what Digiflazz expects

Common issues:
- Using Development API Key instead of Production API Key
- Extra whitespace in credentials
- Invisible characters (like BOM or zero-width spaces)
- API Key has been regenerated but old one is still cached
""")
