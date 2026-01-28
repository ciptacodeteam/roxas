# Midtrans Core API Integration - Quick Start

Complete guide for using Midtrans Core API integration with custom payment flow.

## ✨ What's Different from Snap?

**Snap API** (what we don't use):
- Hosted payment page
- Midtrans handles UI
- Limited customization

**Core API** (what we use):
- Full control over UI
- Custom payment flow
- Direct integration with each payment method
- Matches your brand design

---

## 🚀 Quick Setup

### 1. Environment Variables

Add to `backend/.env`:

```bash
# Midtrans Core API
MIDTRANS_SERVER_KEY=SB-Mid-server-your_key_here
MIDTRANS_PRODUCTION=False  # True for production
```

### 2. Run Seed Command

```bash
cd backend
python manage.py seed_data
```

This creates:
- ✅ Admin user
- ✅ 12 Payment methods (QRIS, e-wallets, bank VAs)
- ✅ 6 Promotional coupons

---

## 💳 Payment Flow

### Complete Order Flow

```
1. Customer selects product & payment method
   ↓
2. Backend calculates fees & creates Order
   order.status = PENDING
   ↓
3. Backend calls Midtrans charge API
   Creates Payment with payment instructions
   ↓
4. Frontend shows payment instructions:
   - QRIS: Show QR code
   - E-Wallet: Show deeplink button
   - Bank VA: Show VA number
   - Credit Card: Redirect to 3DS
   ↓
5. Customer completes payment
   ↓
6. Midtrans sends webhook notification
   Backend validates signature
   ↓
7. Update Order & Payment status
   If success → Order.status = PAID
   Trigger Digiflazz top-up
   ↓
8. Digiflazz processes top-up
   Digiflazz webhook confirms
   ↓
9. Order.status = COMPLETED
   Customer receives game credits
```

---

## 📝 Usage Examples

### Example 1: Create QRIS Payment

```python
from main.integrations.midtrans import get_midtrans_client
from main.models import Order, Payment, PaymentMethod, PaymentStatus

# 1. Get order
order = Order.objects.get(order_number='ORD-20260128-0001')

# 2. Get QRIS payment method
payment_method = PaymentMethod.objects.get(midtrans_code='qris')

# 3. Initialize Midtrans client
client = get_midtrans_client()

# 4. Prepare customer details
customer_details = {
    'first_name': order.user.name or 'Customer',
    'email': order.user.email,
    'phone': order.user.phone or '+62812345678',
}

# 5. Prepare item details
item_details = [{
    'id': str(order.product_item.id),
    'price': order.total_amount,
    'quantity': 1,
    'name': order.product_item.name[:50],
}]

# 6. Call Midtrans charge API
response = client.charge_qris(
    order_id=order.order_number,
    gross_amount=order.total_amount,
    customer_details=customer_details,
    item_details=item_details,
)

# 7. Save payment record
payment = Payment.objects.create(
    order=order,
    external_id=order.order_number,
    transaction_id=response.get('transaction_id'),
    payment_method=payment_method,
    amount=order.total_amount,
    status=PaymentStatus.PENDING,
    qris_string=response.get('actions', [{}])[0].get('url'),  # QR code string
)

# 8. Return to frontend
return {
    'qris_string': payment.qris_string,
    'expires_at': response.get('expiry_time'),
}
```

### Example 2: Create Bank Transfer (VA)

```python
# Get BCA VA payment method
payment_method = PaymentMethod.objects.get(
    midtrans_code='bca',
    type='MOBILE_BANKING'
)

# Call Midtrans
response = client.charge_bank_transfer(
    order_id=order.order_number,
    gross_amount=order.total_amount,
    bank='bca',  # or 'bni', 'mandiri', 'permata', 'bri'
    customer_details=customer_details,
    item_details=item_details,
)

# Save payment
payment = Payment.objects.create(
    order=order,
    external_id=order.order_number,
    transaction_id=response.get('transaction_id'),
    payment_method=payment_method,
    amount=order.total_amount,
    status=PaymentStatus.PENDING,
    va_number=response.get('va_numbers', [{}])[0].get('va_number'),
)

# Return VA number to frontend
return {
    'bank': 'BCA',
    'va_number': payment.va_number,
    'expires_at': response.get('expiry_time'),
}
```

### Example 3: Create GoPay Payment

```python
payment_method = PaymentMethod.objects.get(midtrans_code='gopay')

response = client.charge_gopay(
    order_id=order.order_number,
    gross_amount=order.total_amount,
    customer_details=customer_details,
    item_details=item_details,
    callback_url='https://yoursite.com/payment/callback',
)

payment = Payment.objects.create(
    order=order,
    external_id=order.order_number,
    transaction_id=response.get('transaction_id'),
    payment_method=payment_method,
    amount=order.total_amount,
    status=PaymentStatus.PENDING,
    deeplink_url=response.get('actions', [{}])[0].get('url'),
)

# Return deeplink to open Gojek app
return {
    'deeplink_url': payment.deeplink_url,
    'qr_code': response.get('actions', [{}])[1].get('url'),  # Alternative QR
}
```

### Example 4: Handle Webhook Notification

The webhook is already set up in `main/webhooks.py`:

```python
# Midtrans sends POST to /api/main/webhooks/midtrans/
# Webhook handler:
# 1. Validates signature (SHA512)
# 2. Updates Payment status
# 3. Updates Order status
# 4. Triggers Digiflazz top-up if payment success
```

---

## 🎨 Frontend Integration

### For QRIS

```typescript
// Display QR code
<QRCode value={payment.qris_string} size={256} />

// Or show as image
<img src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(payment.qris_string)}`} />
```

### For E-Wallets (GoPay/ShopeePay)

```typescript
// Show button to open app
<button onClick={() => {
  window.location.href = payment.deeplink_url;
}}>
  Pay with GoPay
</button>
```

### For Virtual Account

```typescript
// Display instructions
<div>
  <h3>Transfer ke {payment.bank} Virtual Account</h3>
  <p className="text-2xl font-mono">{payment.va_number}</p>
  <p>Jumlah: Rp {payment.amount.toLocaleString()}</p>
  <p>Berlaku sampai: {payment.expires_at}</p>
</div>
```

---

## 🧪 Testing

### Sandbox Test Credentials

**QRIS**: Use any e-wallet app in sandbox mode  
**GoPay**: Any phone number  
**ShopeePay**: Any phone number  
**Bank Transfer**: All VA numbers auto-settle after 10 minutes  
**Credit Card**:
- Card: 4811 1111 1111 1114
- CVV: 123
- Expiry: Any future date
- OTP: 112233

### Test Webhook Locally

```bash
# 1. Install ngrok
# Download from https://ngrok.com

# 2. Start ngrok
ngrok http 8000

# 3. Update Midtrans Dashboard
# Notification URL: https://xxxx.ngrok.io/api/main/webhooks/midtrans/

# 4. Test payment
# Webhook will be sent to your local server
```

---

## 📊 Payment Method Fees

Fees are automatically calculated based on `PaymentMethod` model:

| Method | Fee Type | Fee Value | VAT |
|--------|----------|-----------|-----|
| QRIS | Percentage | 0.7% | Included |
| GoPay | Percentage | 2.0% | Included |
| ShopeePay | Percentage | 2.0% | Included |
| Credit Card | Percentage | 2.9% | 11% |
| Bank VA | Fixed | Rp 4,000 | 11% |

### Calculate Fees

```python
from main.models import PaymentMethod

payment_method = PaymentMethod.objects.get(midtrans_code='qris')

final_price = 100000  # After discount

# Calculate fee
if payment_method.fee_type == 'PERCENTAGE':
    payment_fee = int(final_price * payment_method.fee_value / 100)
else:  # FIXED
    payment_fee = int(payment_method.fee_value)

# Calculate VAT on fee
if payment_method.vat_type == 'PERCENTAGE':
    vat_amount = int(payment_fee * payment_method.vat_value / 100)
else:
    vat_amount = int(payment_method.vat_value)

# Total
total_amount = final_price + payment_fee + vat_amount

# Save to order
order.final_price = final_price
order.payment_fee = payment_fee
order.vat_amount = vat_amount
order.total_amount = total_amount
order.save()
```

---

## 🔒 Security

### Webhook Signature Validation

Already handled in webhook:

```python
# Signature formula: SHA512(order_id + status_code + gross_amount + server_key)
is_valid = client.validate_notification(notification)

if not is_valid:
    return JsonResponse({'error': 'Invalid signature'}, status=400)
```

### Best Practices

1. ✅ Always validate webhook signatures
2. ✅ Use HTTPS in production
3. ✅ Store server_key in environment variables
4. ✅ Verify transaction status via API, not just webhook
5. ✅ Handle idempotency (duplicate webhooks)

---

## 📚 API Reference

### Core API Methods

**Charge APIs**:
- `charge_credit_card(order_id, gross_amount, card_token, ...)`
- `charge_bank_transfer(order_id, gross_amount, bank, ...)`
- `charge_gopay(order_id, gross_amount, ...)`
- `charge_shopeepay(order_id, gross_amount, ...)`
- `charge_qris(order_id, gross_amount, ...)`

**Transaction Management**:
- `get_transaction_status(order_id)` - Check status
- `cancel_transaction(order_id)` - Cancel pending
- `expire_transaction(order_id)` - Expire pending
- `refund_transaction(order_id, amount, reason)` - Refund

**Helpers**:
- `is_transaction_success(status)` - Check if paid
- `is_transaction_pending(status)` - Check if pending
- `is_transaction_failed(status)` - Check if failed
- `validate_notification(notification)` - Validate webhook

---

## 🐛 Troubleshooting

### "Authentication failed"
- Check `MIDTRANS_SERVER_KEY` is correct
- Verify Base64 encoding in auth header

### "Transaction not found"
- Order ID must be unique
- Check if order exists in Midtrans

### "Invalid signature" in webhook
- Verify `MIDTRANS_SERVER_KEY` matches dashboard
- Check signature calculation (SHA512)

### Payment expires immediately
- Sandbox payments expire after 1 hour by default
- Can be extended in charge API call

---

## 📞 Support

- **Midtrans Docs**: https://docs.midtrans.com/reference/core-api-overview
- **Midtrans Support**: support@midtrans.com
- **Status Page**: https://status.midtrans.com

---

**Version**: 2.0 (Core API)  
**Last Updated**: January 28, 2026  
**Maintainer**: Roxas Backend Team
