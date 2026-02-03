#!/usr/bin/env python
"""
Quick verification script to debug Digiflazz signature issues.
Run inside Docker: docker exec roxas-api-backend python verify_digiflazz.py
"""
import os
import hashlib
import unicodedata

# Get credentials from environment - capture raw first to check for issues
username_raw = os.environ.get('DIGIFLAZZ_USERNAME', '') or ''
api_key_raw = os.environ.get('DIGIFLAZZ_API_KEY', '') or ''

username = username_raw.strip()
api_key = api_key_raw.strip()

print("=" * 70)
print("DIGIFLAZZ CREDENTIAL & SIGNATURE VERIFICATION")
print("=" * 70)

if not username or not api_key:
    print("\nERROR: DIGIFLAZZ_USERNAME or DIGIFLAZZ_API_KEY not set!")
    exit(1)

# Check for issues
print(f"\n1. USERNAME:")
print(f"   Value: {username}")
print(f"   Length: {len(username)}")
print(f"   Raw had whitespace: {username_raw != username_raw.strip()}")
print(f"   Contains quotes: {('\"' in username_raw) or (\"'\" in username_raw)}")

print(f"\n2. API KEY:")
print(f"   First 8 chars: {api_key[:8]}")
print(f"   Last 8 chars:  {api_key[-8:]}")
print(f"   Total length: {len(api_key)}")
print(f"   Raw had whitespace: {api_key_raw != api_key_raw.strip()}")
print(f"   Contains quotes: {('\"' in api_key_raw) or (\"'\" in api_key_raw)}")
print(f"   Contains dashes: {'-' in api_key}")
print(f"   Is UUID format (36 chars): {len(api_key) == 36 and '-' in api_key}")

# Check for invisible/control characters
def find_suspicious_chars(s, name):
    suspicious = []
    for i, char in enumerate(s):
        cat = unicodedata.category(char)
        # Flag control chars, format chars, etc (but not normal whitespace)
        if cat in ('Cc', 'Cf', 'Co', 'Cs', 'Zl', 'Zp') or (cat == 'Zs' and char != ' '):
            suspicious.append((i, char, cat, hex(ord(char))))
    if suspicious:
        print(f"\n   ⚠️  WARNING: {name} contains suspicious characters:")
        for pos, char, cat, hex_val in suspicious:
            print(f"       Position {pos}: {repr(char)} (category: {cat}, code: {hex_val})")
        return True
    return False

has_suspicious = find_suspicious_chars(username, "USERNAME")
has_suspicious = find_suspicious_chars(api_key, "API_KEY") or has_suspicious

# Generate test signatures with various ref_ids
print(f"\n3. SIGNATURE GENERATION TESTS:")

test_cases = [
    "CHECK-A33C62745034",
    "some1d",  # From Digiflazz docs example
    "TRX123456",
]

for ref_id in test_cases:
    signature_string = f"{username}{api_key}{ref_id}"
    signature = hashlib.md5(signature_string.encode('utf-8')).hexdigest()
    print(f"\n   Ref ID: {ref_id}")
    print(f"   String length: {len(signature_string)} chars")
    print(f"   MD5 Signature: {signature}")

# If API key is 36 chars (UUID), warn about development key
if len(api_key) == 36:
    print(f"\n   ⚠️  WARNING: API Key is 36 characters (UUID format)")
    print(f"       This looks like a DEVELOPMENT key, not a PRODUCTION key!")
    print(f"       Production API keys are typically 64+ characters")
    print(f"       Check: https://member.digiflazz.com/buyer-area/connection/api")

print(f"\n4. ENVIRONMENT INFO:")
print(f"   DIGIFLAZZ_ENVIRONMENT: {os.environ.get('DIGIFLAZZ_ENVIRONMENT', 'production')}")
print(f"   DIGIFLAZZ_API_URL: {os.environ.get('DIGIFLAZZ_API_URL', 'https://api.digiflazz.com/v1')}")

print("\n" + "=" * 70)
print("RECOMMENDATIONS")
print("=" * 70)

if len(api_key) == 36:
    print("""
⚠️  YOUR API KEY APPEARS TO BE A DEVELOPMENT KEY (36 chars)

ACTION REQUIRED:
1. Go to: https://member.digiflazz.com/buyer-area/connection/api
2. Get your PRODUCTION API Key (not development)
3. Update your .env file with the production key
4. Restart container: docker-compose down && docker-compose up -d
5. Re-run this script to verify
""")
elif has_suspicious:
    print("""
⚠️  SUSPICIOUS CHARACTERS DETECTED IN CREDENTIALS

ACTION REQUIRED:
1. Check your .env file for hidden characters
2. Make sure API key has NO quotes or extra whitespace
3. Copy-paste the key directly from Digiflazz dashboard
4. Do NOT include any quotes in the .env file

Example .env format:
DIGIFLAZZ_USERNAME=yourname
DIGIFLAZZ_API_KEY=yourkeyhere
(NO quotes, NO extra spaces)
""")
else:
    print("""
✅ Credentials look valid

Next steps:
1. Verify the generated signatures match what you see in logs
2. Make sure testing=True is sent for validation requests
3. Check Digiflazz logs for detailed error messages
""")
