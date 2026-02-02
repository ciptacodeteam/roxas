# Digiflazz Product Input Fields Analysis

## Overview
Based on Digiflazz API documentation and our current implementation, different products require different input fields. The `customer_no` field in Digiflazz API is the main identifier that varies by product type.

## Common Product Types & Required Fields

### 1. **Games (Mobile Legends, Free Fire, PUBG, Genshin Impact, etc.)**

#### Mobile Legends
- **Required**: `userId` + `serverId` (concatenated)
- **Format**: `customer_no = userId + serverId` (e.g., "1234567890123")
- **Testing Utility**: Can check username via Digiflazz (if available)
- **Current Implementation**: ✅ IMPLEMENTED
  - Backend: [main/tasks.py](backend/main/tasks.py#L218-L222) handles concatenation
  - Frontend: Product input fields support `userId` and `serverId`
  - Database: Stored in `Order.customer_data` JSON field

#### Free Fire
- **Required**: `userId` only
- **Format**: `customer_no = userId` (e.g., "1234567890")
- **Current Implementation**: ✅ IMPLEMENTED
  - Backend: Falls back to just `userId` if no `serverId`
  - Database: `input_fields = ["userId"]` in Product model

#### PUBG Mobile
- **Required**: `userId` only
- **Format**: `customer_no = userId`
- **Current Implementation**: ✅ IMPLEMENTED

#### Genshin Impact
- **Required**: `userId` + `serverId`/`zoneId`
- **Format**: `customer_no = userId + serverId`
- **Current Implementation**: ✅ IMPLEMENTED
  - Backend supports both `serverId` and `zoneId` naming

### 2. **Mobile Credit/Pulsa**
- **Required**: `phoneNumber` (MSISDN)
- **Format**: `customer_no = phoneNumber` (e.g., "081234567890")
- **Current Implementation**: ⚠️ PARTIALLY IMPLEMENTED
  - Backend: Code checks for `user_id`/`userId` but not `phoneNumber`
  - Needs update to handle: `customer_data.get('phoneNumber') or customer_data.get('phone_number') or customer_data.get('msisdn')`

### 3. **Data Packages**
- **Required**: `phoneNumber`
- **Format**: Same as pulsa
- **Current Implementation**: ⚠️ NEEDS UPDATE

### 4. **Electricity Token (PLN)**
- **Required**: `meterNumber`
- **Format**: `customer_no = meterNumber` (e.g., "12345678901")
- **Current Implementation**: ❌ NOT IMPLEMENTED
  - Needs: Add `meterNumber` handling in backend

### 5. **BPJS/Insurance**
- **Required**: `cardNumber` or `va_number`
- **Format**: `customer_no = cardNumber`
- **Current Implementation**: ❌ NOT IMPLEMENTED

### 6. **Postpaid/Bills (Phone, Internet, PDAM)**
- **Required**: `customerNumber` or `accountNumber`
- **Format**: Varies by provider
- **Current Implementation**: ❌ NOT IMPLEMENTED

## Current Implementation Status

### ✅ Backend (Django)

**File**: `backend/main/models.py`
```python
class Product(UUIDModel):
    input_fields = models.JSONField(
        default=list,
        verbose_name=_("Input Fields"),
        help_text=_('Required input fields, e.g. ["userId", "serverId"]'),
    )
```

**File**: `backend/main/tasks.py` (Lines 213-225)
```python
# Extract customer_no from customer_data
user_id = customer_data.get('userId') or customer_data.get('user_id') or customer_data.get('gameId')

if not user_id:
    raise ValueError("Customer data tidak memiliki userId")

# For Mobile Legends, combine userId and serverId
server_id = customer_data.get('serverId') or customer_data.get('server_id') or customer_data.get('zoneId')
if server_id:
    # Mobile Legends format
    customer_no = f"{user_id}{server_id}"
else:
    # Other games - just userId
    customer_no = str(user_id)
```

**Current Support**:
- ✅ userId (standalone)
- ✅ userId + serverId (Mobile Legends)
- ✅ userId + zoneId (alternative naming)
- ❌ phoneNumber (pulsa/data)
- ❌ meterNumber (PLN)
- ❌ Other identifiers

### ✅ Frontend (Next.js)

**File**: `frontend/src/app/[locale]/(global)/product/[slug]/page.tsx`
```typescript
inputFields = product.input_fields.map((field: any) => {
  if (typeof field === 'string') {
    return {
      name: field,
      label:
        field === "userId" ? "User ID"
        : field === "serverId" || field === "zoneId" ? "Server ID"
        : field === "phoneNumber" ? "Nomor Telepon"
        : field,
      required: true,
    };
  }
  return field;
});
```

**Current Support**:
- ✅ userId
- ✅ serverId / zoneId
- ✅ phoneNumber (label only, not backend integrated)
- ❌ Other field types

### ✅ Database Schema

**Table**: `products`
- `input_fields`: JSONField storing array like `["userId", "serverId"]`

**Table**: `orders`
- `customer_data`: JSONField storing actual values like `{"userId": "123", "serverId": "456"}`

**Current Storage**: ✅ FLEXIBLE - Can store any field type in JSON

## Digiflazz API Testing Utility

According to Digiflazz documentation, some products support nickname checking:

```python
# Check customer nickname (for supported games)
client.check_customer(
    buyer_sku_code="ML100",
    customer_no="1234567890123"
)
# Returns: {"customer_name": "PlayerName"}
```

**Current Implementation**: ❌ NOT IMPLEMENTED
- Need to add API endpoint for nickname checking
- Would enhance UX by showing player name before purchase

## Recommendations

### 1. **Immediate Updates Needed**

#### Backend: Update `tasks.py` to handle all field types
```python
def get_customer_no(customer_data: dict, product_type: str = None) -> str:
    """Extract customer_no based on product type"""
    
    # Try userId first (games)
    user_id = customer_data.get('userId') or customer_data.get('user_id') or customer_data.get('gameId')
    
    # Try phone number (pulsa/data)
    phone = customer_data.get('phoneNumber') or customer_data.get('phone_number') or customer_data.get('msisdn')
    
    # Try meter number (PLN)
    meter = customer_data.get('meterNumber') or customer_data.get('meter_number')
    
    # Try customer number (bills)
    customer_num = customer_data.get('customerNumber') or customer_data.get('customer_number')
    
    # For games with zone/server
    server_id = customer_data.get('serverId') or customer_data.get('server_id') or customer_data.get('zoneId')
    
    if user_id:
        if server_id:
            return f"{user_id}{server_id}"
        return str(user_id)
    elif phone:
        return str(phone)
    elif meter:
        return str(meter)
    elif customer_num:
        return str(customer_num)
    else:
        raise ValueError("No valid customer identifier found in customer_data")
```

### 2. **Add Nickname Check Feature**

Create new view in `backend/main/views.py`:
```python
@api_view(['POST'])
def check_customer_nickname(request):
    """Check customer nickname from Digiflazz"""
    sku_code = request.data.get('sku_code')
    customer_data = request.data.get('customer_data')
    
    customer_no = get_customer_no(customer_data)
    
    client = get_digiflazz_client()
    result = client.check_customer(
        buyer_sku_code=sku_code,
        customer_no=customer_no
    )
    
    return Response(result)
```

### 3. **Frontend Updates**

Add field type metadata to Product.input_fields:
```json
{
  "input_fields": [
    {
      "name": "phoneNumber",
      "label": "Nomor Telepon",
      "type": "phone",
      "required": true,
      "pattern": "^08[0-9]{8,11}$",
      "placeholder": "0812xxxxxxxx"
    }
  ]
}
```

### 4. **Database Migration**

The current JSON schema is flexible enough. Just need to update:
- Admin interface to easily add different field types
- Documentation for what fields are available

## Product-Specific Examples

### Mobile Legends
```json
{
  "input_fields": [
    {"name": "userId", "label": "User ID", "required": true},
    {"name": "serverId", "label": "Server ID", "required": true}
  ]
}
```
**Digiflazz**: `customer_no = "1234567890123"` (concatenated)

### Free Fire
```json
{
  "input_fields": [
    {"name": "userId", "label": "User ID", "required": true}
  ]
}
```
**Digiflazz**: `customer_no = "1234567890"`

### Pulsa/Data
```json
{
  "input_fields": [
    {"name": "phoneNumber", "label": "Nomor HP", "type": "phone", "required": true}
  ]
}
```
**Digiflazz**: `customer_no = "081234567890"`

### PLN Token
```json
{
  "input_fields": [
    {"name": "meterNumber", "label": "Nomor Meter", "required": true}
  ]
}
```
**Digiflazz**: `customer_no = "12345678901"`

## Summary

### ✅ What's Already Implemented:
1. Database schema supports any field type (JSONField)
2. Backend handles userId + serverId for games
3. Frontend displays input fields dynamically
4. Order customer_data stores all input values

### ⚠️ What Needs Update:
1. Backend `tasks.py` - Add support for phoneNumber, meterNumber, etc.
2. Nickname check API integration
3. Frontend validation patterns for different field types
4. Admin UI for managing field types

### ❌ What's Missing:
1. Support for non-game products (pulsa, PLN, bills)
2. Customer nickname verification
3. Field type validation and formatting
4. Better error messages for unsupported products
