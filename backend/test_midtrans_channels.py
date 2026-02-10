"""
Midtrans Payment Channel Diagnostic Script

Run this on the server to check which payment channels are actually activated
for your Midtrans account (Core API).

Usage:
  python manage.py shell < test_midtrans_channels.py
  OR
  docker compose exec backend python manage.py shell < test_midtrans_channels.py
"""
import sys
import json

# Import Django settings
from django.conf import settings

server_key = settings.MIDTRANS_SERVER_KEY
is_production = settings.MIDTRANS_PRODUCTION

print("=" * 60)
print("MIDTRANS DIAGNOSTIC REPORT")
print("=" * 60)

# 1. Check key format
key_prefix = server_key[:10] if len(server_key) > 10 else server_key
key_suffix = server_key[-4:] if len(server_key) > 4 else server_key
print(f"\nServer Key prefix: {key_prefix}...")
print(f"Server Key suffix: ...{key_suffix}")
print(f"MIDTRANS_IS_PRODUCTION setting: {is_production}")

# Detect key type from prefix
is_sandbox_key = server_key.startswith("SB-Mid-server-") or server_key.startswith("SB-")
is_production_key = server_key.startswith("Mid-server-") and not server_key.startswith("SB-")

if is_sandbox_key:
    print(f"Key type detected: SANDBOX key")
elif is_production_key:
    print(f"Key type detected: PRODUCTION key")
else:
    print(f"Key type detected: UNKNOWN format (key: {key_prefix}...)")

# Check for mismatch
if is_production and is_sandbox_key:
    print("\n*** MISMATCH DETECTED! ***")
    print("MIDTRANS_IS_PRODUCTION=True but you're using a SANDBOX server key (SB-Mid-server-...)")
    print("This means requests go to api.midtrans.com but your key belongs to api.sandbox.midtrans.com")
    print("FIX: Either set MIDTRANS_IS_PRODUCTION=false, or use your production server key from dashboard.midtrans.com")
elif not is_production and is_production_key:
    print("\n*** MISMATCH DETECTED! ***")
    print("MIDTRANS_IS_PRODUCTION=False but you're using a PRODUCTION server key (Mid-server-...)")
    print("This means requests go to api.sandbox.midtrans.com but your key belongs to api.midtrans.com")
    print("FIX: Either set MIDTRANS_IS_PRODUCTION=true, or use your sandbox server key from dashboard.sandbox.midtrans.com")
else:
    print("Key and environment match: OK")

api_url = "https://api.midtrans.com/v2" if is_production else "https://api.sandbox.midtrans.com/v2"
print(f"API URL: {api_url}")

# 2. Test each payment channel
import base64
import requests

auth_string = f"{server_key}:"
auth_header = f"Basic {base64.b64encode(auth_string.encode()).decode()}"
headers = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": auth_header,
}

# Use a unique test order ID
import uuid
test_id = f"DIAG-{uuid.uuid4().hex[:8].upper()}"

channels_to_test = [
    {
        "name": "GoPay (payment_type: gopay)",
        "payload": {
            "payment_type": "gopay",
            "transaction_details": {"order_id": f"{test_id}-GOPAY", "gross_amount": 10000},
            "gopay": {"enable_callback": False},
        }
    },
    {
        "name": "QRIS with GoPay acquirer (payment_type: qris)",
        "payload": {
            "payment_type": "qris",
            "transaction_details": {"order_id": f"{test_id}-QRIS", "gross_amount": 10000},
            "qris": {"acquirer": "gopay"},
        }
    },
    {
        "name": "QRIS with ShopeePay acquirer (payment_type: qris)",
        "payload": {
            "payment_type": "qris",
            "transaction_details": {"order_id": f"{test_id}-QRIS2", "gross_amount": 10000},
            "qris": {"acquirer": "airpay shopee"},
        }
    },
    {
        "name": "ShopeePay (payment_type: shopeepay)",
        "payload": {
            "payment_type": "shopeepay",
            "transaction_details": {"order_id": f"{test_id}-SPY", "gross_amount": 10000},
        }
    },
    {
        "name": "BCA VA (payment_type: bank_transfer)",
        "payload": {
            "payment_type": "bank_transfer",
            "transaction_details": {"order_id": f"{test_id}-BCA", "gross_amount": 10000},
            "bank_transfer": {"bank": "bca"},
        }
    },
]

print(f"\n{'=' * 60}")
print("TESTING PAYMENT CHANNELS")
print(f"{'=' * 60}")

for channel in channels_to_test:
    try:
        resp = requests.post(f"{api_url}/charge", json=channel["payload"], headers=headers, timeout=15)
        result = resp.json()
        status_code = result.get("status_code", "???")
        status_msg = result.get("status_message", "???")
        
        if status_code in ("200", "201"):
            print(f"\n  [ACTIVE]  {channel['name']}")
            print(f"            Status: {status_code} - {status_msg}")
            tx_id = result.get("transaction_id", "")
            if tx_id:
                # Cancel the test transaction
                try:
                    requests.post(f"{api_url}/{tx_id}/cancel", headers=headers, timeout=10)
                except:
                    pass
        elif status_code == "402":
            print(f"\n  [NOT ACTIVATED]  {channel['name']}")
            print(f"            Status: {status_code} - {status_msg}")
        elif status_code == "401":
            print(f"\n  [AUTH ERROR]  {channel['name']}")
            print(f"            Status: {status_code} - {status_msg}")
            print(f"            Your server key is invalid for this environment!")
        else:
            print(f"\n  [OTHER]   {channel['name']}")
            print(f"            Status: {status_code} - {status_msg}")
    except Exception as e:
        print(f"\n  [ERROR]   {channel['name']}")
        print(f"            Exception: {e}")

print(f"\n{'=' * 60}")
print("DIAGNOSIS")
print(f"{'=' * 60}")
print("""
If ALL channels show [NOT ACTIVATED]:
  → Your server key is likely for the wrong environment
  → OR you haven't activated any payment channels in the Midtrans Dashboard

If only GoPay/QRIS show [NOT ACTIVATED]:
  → Go to Midtrans Dashboard → Settings → Payment Channels
  → Make sure GoPay and/or QRIS is activated for CORE API (not just Snap)
  → Production dashboard: https://dashboard.midtrans.com/settings/payment-channels
  → Sandbox dashboard: https://dashboard.sandbox.midtrans.com/settings/payment-channels

IMPORTANT: Midtrans has SEPARATE activation for Snap API and Core API.
  You may have activated GoPay/QRIS for Snap, but NOT for Core API.
  Look for a toggle or tab that says "Core API" vs "Snap" in the payment channel settings.
""")
