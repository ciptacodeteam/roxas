# Validation Items System

This system allows product items (like "Cek Username MLBB") to be used for account validation without appearing in public product listings.

## Overview

- **Validation items** are special product items used to validate user accounts via Digiflazz
- These items are automatically hidden from public API responses
- Each product can have one validation item associated with it
- The validation endpoint uses these items to check if a user's game account exists

## Database Changes

### ProductItem Model
Added new field:
- `is_validation_item` (Boolean): Marks items used for validation (default: False)

### Product Model
Added new method:
- `get_validation_item()`: Returns the validation item for the product (if any)

## API Changes

### 1. ProductItem Public API (`/api/v1/product-items/`)
- Now filters out items where `is_validation_item=True`
- Validation items are no longer visible in public listings
- SKU codes are also hidden from public responses for security

### 2. New Validation Endpoint (`/api/v1/products/{slug}/validate-account/`)

**Method:** POST

**URL Example:** `/api/v1/products/mobile-legends/validate-account/`

**Request Body:**
```json
{
  "user_id": "123456789",
  "server_id": "1234"
}
```

**Success Response (200 OK):**
```json
{
  "valid": true,
  "user_id": "123456789",
  "server_id": "1234",
  "account_name": "PlayerName",
  "message": "Akun valid"
}
```

**Error Response (400 Bad Request):**
```json
{
  "valid": false,
  "error": "User ID tidak valid",
  "message": "Account not found"
}
```

**Not Found Response (404):**
```json
{
  "valid": false,
  "error": "Validasi akun tidak tersedia untuk produk ini",
  "message": "No validation item configured for this product"
}
```

## Management Commands

### Mark Validation Items
Automatically marks items containing "cek" (case-insensitive) as validation items:

```bash
# Dry run (preview changes)
python manage.py mark_validation_items --dry-run

# Apply changes
python manage.py mark_validation_items
```

## Frontend Integration

### Example: Validate Mobile Legends Account

```typescript
async function validateAccount(slug: string, userId: string, serverId: string) {
  const response = await fetch(
    `${API_URL}/api/v1/products/${slug}/validate-account/`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        server_id: serverId
      })
    }
  );
  
  const data = await response.json();
  
  if (data.valid) {
    console.log('Account valid:', data.account_name);
  } else {
    console.error('Validation failed:', data.error);
  }
  
  return data;
}
```

## Setup Instructions

### 1. Run Migration
```bash
cd backend
docker compose exec api python manage.py makemigrations
docker compose exec api python manage.py migrate
```

### 2. Mark Existing Validation Items
```bash
docker compose exec api python manage.py mark_validation_items
```

### 3. Create New Validation Item (via Django Admin)
1. Go to Django Admin → Product Items
2. Create/edit an item
3. Set the name (e.g., "Cek Username MLBB")
4. Set `is_validation_item` to True
5. Ensure it's linked to the correct product
6. Save

## How It Works

1. **Validation Item Creation:**
   - Admin creates a product item with name containing "cek" (e.g., "Cek Username", "ML Cek ID")
   - Runs `mark_validation_items` command OR manually sets `is_validation_item=True`
   - Item is now hidden from public listings

2. **User Account Validation:**
   - Frontend calls `/api/v1/products/{slug}/validate-account/`
   - Backend finds the product's validation item
   - Makes a test transaction to Digiflazz with `testing=True`
   - Returns validation result without actually processing payment

3. **Security:**
   - Validation items are filtered from all public APIs
   - SKU codes are not exposed to prevent abuse
   - Only authorized validation calls are made

## Benefits

✅ **Clean API**: Validation items don't clutter product listings
✅ **Flexible**: Each product can have its own validation method
✅ **Secure**: SKU codes and validation items are hidden
✅ **Generic**: Works for any product that supports validation
✅ **Easy Management**: Automatic identification of validation items

## Notes

- Items with names containing "cek" (case-insensitive) are automatically identified
- The `mark_validation_items` command can be run anytime to update
- Validation uses Digiflazz's testing mode (no actual transaction)
- The old MLCU-specific endpoint still works for backward compatibility
