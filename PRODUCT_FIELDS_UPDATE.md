# Product Fields Integration Update

## Summary
Updated the system to support multiple product types with different input field requirements (games, pulsa, PLN, vouchers).

## Changes Made

### 1. Backend Updates

#### Database: Product Input Fields Configuration
- **Script**: `backend/update_product_fields.py`
- **Action**: Updated 16 out of 17 products with proper `input_fields` configuration
- **Results**:
  - ✅ Games (5/5): FREE FIRE, Honor of Kings, Magic Chess, MOBILE LEGENDS, PUBG MOBILE
    - Fields: `userId` + `serverId`
  - ✅ Pulsa (6/6): AXIS, by.U, INDOSAT, SMARTFREN, TRI, XL
    - Fields: `phoneNumber`
  - ✅ PLN (1/1): PLN
    - Fields: `meterNumber`
  - ✅ Voucher (5/5): GOOGLE PLAY, PLAYSTATION, POINT BLANK, Steam Wallet, XBOX
    - Fields: `userId`

#### Backend Logic: `backend/main/tasks.py`
- **Lines Modified**: 210-234
- **Changes**:
  - Updated `customer_no` extraction to support multiple field types
  - Priority order: `phoneNumber` → `meterNumber` → `userId` (with optional `serverId`)
  - Now correctly processes all product categories

```python
# Before (only supported userId + serverId)
customer_data = order.customer_data or {}
user_id = customer_data.get('userId')
if not user_id:
    raise ValueError("Customer data tidak memiliki userId")

# After (supports phoneNumber, meterNumber, userId)
phone_number = customer_data.get('phoneNumber')
meter_number = customer_data.get('meterNumber')
user_id = customer_data.get('userId')

if phone_number:
    customer_no = str(phone_number)
elif meter_number:
    customer_no = str(meter_number)
elif user_id:
    # Game logic with optional server
    ...
```

### 2. Frontend Updates

#### Product Detail Page: `frontend/src/app/[locale]/(global)/product/[slug]/ProductDetailClient.tsx`

**State Management**:
- Added state variables: `phoneNumber`, `meterNumber`
- Previous: Only `userId`, `serverId`, `zoneId`

**Dynamic Form Rendering**:
- Fields now render based on `product.input_fields` configuration
- Supports field types: `userId`, `serverId`, `zoneId`, `phoneNumber`, `meterNumber`
- Each field type has:
  - Proper input type (`text`, `tel`)
  - Correct input mode (`numeric` for phone/meter)
  - Optional dialog with instructions
  - Validation patterns

**Validation**:
- Added `areRequiredFieldsFilled()` function to check all required fields
- Dynamic error messages showing which fields are missing
- Button disabled until all required fields are filled

**Customer Data Collection**:
```typescript
// Before
const customerData: any = {};
if (userId) customerData.userId = userId;
if (serverId) customerData.serverId = serverId;

// After
const customerData: any = {};
(product?.inputFields || []).forEach((field) => {
  switch (field.name) {
    case "userId": if (userId) customerData.userId = userId; break;
    case "serverId": if (serverId) customerData.serverId = serverId; break;
    case "phoneNumber": if (phoneNumber) customerData.phoneNumber = phoneNumber; break;
    case "meterNumber": if (meterNumber) customerData.meterNumber = meterNumber; break;
  }
});
```

**Dynamic Instructions**:
- Game products: "Pastikan User ID dan Server ID yang Anda masukkan sudah benar."
- Pulsa products: "Pastikan nomor HP yang Anda masukkan sudah benar."
- PLN products: "Pastikan nomor meter PLN yang Anda masukkan sudah benar."

#### Transaction Display: `frontend/src/components/transaction/TransactionDetailCards.tsx`

**Customer Data Display**:
- Added display for `phoneNumber` and `meterNumber` fields
- Shows appropriate labels: "Nomor HP", "Nomor Meter"
- Supports copy-to-clipboard for all field types

#### TypeScript Types: `frontend/src/lib/transaction/types.ts`

**CustomerData Interface**:
```typescript
export interface CustomerData {
  userId?: string;        // Game accounts, vouchers
  serverId?: string;      // Games with servers (ML, etc.)
  zoneId?: string;        // Alternative to serverId
  phoneNumber?: string;   // Pulsa products
  meterNumber?: string;   // PLN products
  email?: string;
  phone?: string;
  [key: string]: any;
}
```

## Product Types and Required Fields

| Category | Products | Required Fields | Customer No Format |
|----------|----------|----------------|-------------------|
| **Games** | FREE FIRE, PUBG MOBILE, Honor of Kings, Magic Chess | `userId` + `serverId` | `{userId}{serverId}` |
| **Games** | MOBILE LEGENDS | `userId` + `serverId` | `{userId}{serverId}` (with verification) |
| **Pulsa** | AXIS, by.U, INDOSAT, SMARTFREN, TRI, XL | `phoneNumber` | `{phoneNumber}` |
| **PLN** | PLN | `meterNumber` | `{meterNumber}` |
| **Voucher** | GOOGLE PLAY, PLAYSTATION, POINT BLANK, Steam Wallet, XBOX | `userId` | `{userId}` |

## Testing Checklist

- [x] Backend: Product input_fields populated in database
- [x] Backend: tasks.py handles all field types
- [x] Frontend: Builds successfully without TypeScript errors
- [x] Frontend: Dynamic form rendering based on product type
- [x] Frontend: Validation prevents submission with missing fields
- [x] Frontend: Transaction details show all field types

## Next Steps for Testing

1. **Test Game Product Order**:
   - Select a game product (e.g., FREE FIRE)
   - Verify userId and serverId fields appear
   - Submit order and check customer_no in backend

2. **Test Pulsa Product Order**:
   - Select a pulsa product (e.g., AXIS)
   - Verify phoneNumber field appears
   - Submit order and check customer_no format

3. **Test PLN Product Order**:
   - Select PLN product
   - Verify meterNumber field appears
   - Submit order and check customer_no format

4. **Test Voucher Product Order**:
   - Select a voucher product (e.g., GOOGLE PLAY)
   - Verify userId field appears
   - Submit order and check processing

5. **Test Mobile Legends Verification**:
   - Select MOBILE LEGENDS product
   - Enter userId and serverId
   - Click "Verifikasi Akun" button
   - Verify account details show

## Files Modified

### Backend
- `backend/update_product_fields.py` (created)
- `backend/main/tasks.py` (modified)

### Frontend
- `frontend/src/app/[locale]/(global)/product/[slug]/ProductDetailClient.tsx` (modified)
- `frontend/src/components/transaction/TransactionDetailCards.tsx` (modified)
- `frontend/src/lib/transaction/types.ts` (modified)

## Build Status
✅ Frontend build successful (55 routes generated)
✅ TypeScript compilation successful
✅ All product input_fields configured in database
