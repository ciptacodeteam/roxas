# Production Login Fixes

## Issues Fixed

### 1. **Cookie SameSite Settings** 
**Problem**: In production, cookies were set to `SameSite=Lax` which prevents cross-origin cookie sending.

**Fix**: Changed to `SameSite=None` for both development and production to support cross-domain setups.

**Files Changed**:
- `backend/backend/settings.py` - Updated SIMPLE_JWT cookie settings

### 2. **Session Query Configuration**
**Problem**: Session query had `retry: false` which caused immediate failure on network issues.

**Fix**: 
- Added retry logic (retry once with 1s delay)
- Improved stale time and cache configuration
- Always refetch on mount to ensure fresh auth state

**Files Changed**:
- `frontend/src/lib/auth/queries.ts`

### 3. **Admin Layout Redirect Loop**
**Problem**: Admin layout was redirecting before session was fully loaded, causing infinite redirect loops.

**Fix**:
- Added better logging to track auth state
- Only redirect after loading is complete
- Added console logs for debugging

**Files Changed**:
- `frontend/src/app/admin/layout.tsx`

### 4. **Login Hook Timing**
**Problem**: Redirect happened too fast, before session was fully established.

**Fix**: Increased redirect delay from 500ms to 1000ms to ensure session is loaded.

**Files Changed**:
- `frontend/src/lib/auth/hooks.ts`

---

## Production Deployment Checklist

### Backend Environment Variables

Make sure these are set in production:

```bash
# Required for production
DEBUG=false
SECRET_KEY=your-very-long-secure-random-secret-key

# CORS - Add your production frontend URL
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Cookie Domain (optional, for cross-domain cookie sharing)
# Use if frontend and backend are on different subdomains
# COOKIE_DOMAIN=.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
CELERY_BROKER_URL=redis://redis:6379/0
REDIS_URL=redis://redis:6379/1
```

### Frontend Environment Variables

```bash
# Production API URL (HTTPS required for SameSite=None)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Must match backend URL exactly
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
```

### HTTPS Requirements

**CRITICAL**: When using `SameSite=None`, HTTPS is **REQUIRED** by browsers.

✅ **Production Setup**:
- Backend: `https://api.yourdomain.com`
- Frontend: `https://yourdomain.com`
- Cookies will work with `SameSite=None; Secure`

❌ **Will NOT work**:
- Backend: `http://api.yourdomain.com` (not HTTPS)
- Cookies with `SameSite=None` will be rejected by browsers

### Testing

1. **Check Browser Console** for auth errors:
   ```
   [getSessionApi] Raw backend response: {...}
   [Admin Layout] Admin user authenticated successfully
   ```

2. **Check Browser DevTools > Application > Cookies**:
   - `access_token` cookie should be present
   - `SameSite` should be `None`
   - `Secure` should be ✓ in production

3. **Check Network Tab**:
   - Login request should return 200
   - Session request (`/api/v1/token/me/`) should return user data
   - Cookies should be sent with `credentials: 'include'`

### Common Issues

#### Issue: "Login successful but redirects back to login"
**Cause**: Session not loaded or cookies not being sent

**Fix**:
1. Check browser console for session API errors
2. Verify CORS settings match frontend URL exactly
3. Ensure HTTPS is used in production
4. Check cookie settings in DevTools

#### Issue: "Cookies not being set"
**Cause**: HTTPS required for SameSite=None

**Fix**: 
1. Ensure backend is served over HTTPS
2. Check CSRF_TRUSTED_ORIGINS includes frontend URL
3. Verify CORS_ALLOWED_ORIGINS is correct

#### Issue: "CORS errors"
**Cause**: Missing or incorrect CORS configuration

**Fix**:
```python
# backend/settings.py
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True
```

---

## Cookie Settings Explained

### Development (DEBUG=True)
```python
SameSite=None
Secure=False  # HTTP allowed
Domain=None   # Localhost
```

### Production (DEBUG=False)
```python
SameSite=None
Secure=True   # HTTPS required
Domain=.yourdomain.com  # Optional, for subdomain sharing
```

### Why SameSite=None?

Modern browsers (Chrome, Firefox, Safari) block cross-origin cookies by default unless:
1. `SameSite=None` is set
2. `Secure=True` is set (HTTPS only)
3. CORS is properly configured

This applies even if frontend and backend are on the same domain but different ports (e.g., localhost:3000 → localhost:8000).

---

## Rollback Instructions

If issues persist, you can rollback to same-site cookies:

### Backend (settings.py)
```python
COOKIE_SAMESITE = "Lax"  # Change from "None"
COOKIE_SECURE = not DEBUG
```

**Note**: This only works if frontend and backend are on the **exact same domain** (no subdomains, no different ports).

---

## Monitoring

Add these logs to track auth issues:

```typescript
// frontend/src/lib/auth/queries.ts
console.log('[Session] Fetching session...');
console.log('[Session] Response:', data);
```

```python
# backend/account/views.py
logger.info(f"User {request.user.email} logged in successfully")
logger.info(f"Setting cookies: SameSite={settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']}")
```
