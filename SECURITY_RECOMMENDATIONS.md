# Security Best Practices & Recommendations

## ✅ Implemented Fixes

### 1. **Environment Variable Validation**
Added `backend/env_validator.py` to validate critical environment variables on startup.

**Usage:**
- Automatically runs on Django startup
- Skip with: `SKIP_ENV_VALIDATION=1` (for CI/CD)
- Validates: SECRET_KEY, DATABASE_URL, API keys, etc.

### 2. **React Import Fix**
Fixed React import order in `auth-client.ts` - moved to top of file.

---

## 🔴 Critical Issues to Fix MANUALLY

### 3. **Bare Except Statements** 
**Location**: `backend/main/tasks.py` (lines 310, 325, 343)

**Replace:**
```python
except:
    pass
```

**With:**
```python
except (AttributeError, TypeError, KeyError) as e:
    logger.warning(f"Error extracting data: {e}")
    # Handle appropriately
```

### 4. **Weak Admin Password**
**Location**: `backend/main/management/commands/seed_data.py` line 43

**Current:**
```python
admin_password = os.getenv('ADMIN_PASSWORD', 'admin123456')
```

**Recommendation:**
```python
admin_password = os.getenv('ADMIN_PASSWORD')
if not admin_password:
    raise ValueError("ADMIN_PASSWORD environment variable must be set")
```

### 5. **Enable Rate Limiting**
**Location**: `backend/backend/settings.py` line 204

**Add:**
```python
REST_FRAMEWORK_THROTTLE_CLASSES = [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
]
REST_FRAMEWORK_THROTTLE_RATES = {
    'anon': '100/hour',    # 100 requests per hour for anonymous users
    'user': '1000/hour',   # 1000 requests per hour for authenticated users
}
```

### 6. **Frontend Environment Variables**
**Location**: `frontend/env.example`

**Issue**: Duplicate variables
```plaintext
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000  # Duplicate!
```

**Fix**: Remove one and update code to use only `NEXT_PUBLIC_API_URL`

### 7. **TODO Implementation**
**Location**: `frontend/src/app/[locale]/(global)/product/[slug]/ProductDetailClient.tsx`

Lines 525, 552 have TODO comments for:
- Coupon API endpoint
- Ratings API endpoint

**Action**: Either implement or remove the incomplete features.

---

## ⚠️ Security Hardening Recommendations

### 8. **CSRF Token Rotation**
Add to Django settings:
```python
CSRF_COOKIE_AGE = 3600  # 1 hour
CSRF_USE_SESSIONS = True
```

### 9. **Content Security Policy (CSP)**
Install: `pip install django-csp`

Add to middleware:
```python
'csp.middleware.CSPMiddleware',
```

Configure:
```python
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")
CSP_IMG_SRC = ("'self'", "data:", "https:")
```

### 10. **Database Connection Pooling**
For PostgreSQL production, add to DATABASE settings:
```python
'CONN_MAX_AGE': 600,
'CONN_HEALTH_CHECKS': True,
'OPTIONS': {
    'connect_timeout': 10,
    'options': '-c statement_timeout=30000',  # 30s query timeout
}
```

Consider adding PgBouncer for better connection management.

### 11. **Request ID Tracking**
Create middleware for correlation IDs:

```python
# backend/middleware.py
import uuid
from django.utils.deprecation import MiddlewareMixin

class RequestIDMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.id = str(uuid.uuid4())
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'id'):
            response['X-Request-ID'] = request.id
        return response
```

Add to MIDDLEWARE in settings.py

### 12. **Logging Improvements**
Update logging to include request context:

```python
LOGGING = {
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} [{module}] [req:{request_id}] {message}',
            'style': '{',
        },
    },
    # ... rest of config
}
```

### 13. **Secure Cookie Settings for Production**
Ensure these are set when deploying:

```python
# Only in production
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SECURE_SSL_REDIRECT = True  # If using HTTPS
```

---

## 📊 Testing Recommendations

### 14. **Add Unit Tests**
Create test files:
- `backend/account/tests/` - Auth tests
- `backend/main/tests/` - Business logic tests
- `frontend/src/__tests__/` - Component tests

**Minimum coverage targets:**
- Models: 80%
- Views/API: 70%
- Utils: 90%

### 15. **Add Integration Tests**
Test critical flows:
- User registration → email verification → login
- Product selection → payment → fulfillment
- Webhook processing

### 16. **Add E2E Tests**
Use Playwright or Cypress for frontend E2E tests.

---

## 🚀 Performance Optimizations

### 17. **Database Indexing**
Add missing indexes:
```python
class Meta:
    indexes = [
        models.Index(fields=['created_at', 'status']),  # For order queries
        models.Index(fields=['-created_at']),  # For recent orders
    ]
```

### 18. **Query Optimization**
Use `select_related()` and `prefetch_related()` consistently:
```python
Order.objects.select_related(
    'product_item__product',
    'payment__payment_method'
).prefetch_related('product_item__product__category')
```

### 19. **Frontend Bundle Size**
- Analyze with `npm run build && npx @next/bundle-analyzer`
- Use dynamic imports for heavy components
- Optimize images with Next.js Image component

### 20. **Caching Strategy**
Implement multi-level caching:
```python
from django.core.cache import cache

# Cache product list for 5 minutes
products = cache.get('products_active')
if not products:
    products = Product.objects.filter(is_active=True)
    cache.set('products_active', products, 300)
```

---

## 🔍 Monitoring & Observability

### 21. **Add Error Tracking**
Install Sentry:
```bash
pip install sentry-sdk
```

Configure in Django:
```python
import sentry_sdk
sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN'),
    traces_sample_rate=0.1,
    environment='production' if not DEBUG else 'development',
)
```

### 22. **Add Performance Monitoring**
Track slow queries, API response times, Celery task durations.

### 23. **Health Check Improvements**
Enhance `/health/` endpoint to check:
- Database connectivity
- Redis connectivity
- Celery worker status
- External API availability (Midtrans, Digiflazz)

---

## 📝 Documentation

### 24. **API Documentation**
Your Swagger/ReDoc is good, but add:
- Authentication examples
- Common error codes
- Webhook payload examples

### 25. **Deployment Documentation**
Document:
- Environment variable requirements
- SSL certificate setup
- Database backup/restore procedures
- Rollback procedures

---

## Summary

**Priority Fixes:**
1. ✅ Environment validation (DONE)
2. ✅ React import fix (DONE)
3. 🔴 Fix bare except statements (MANUAL)
4. 🔴 Strong admin password requirement (MANUAL)
5. 🔴 Enable rate limiting (MANUAL)

**Next Steps:**
1. Review and apply manual fixes
2. Add basic unit tests
3. Enable CSP and request tracking
4. Set up Sentry for production
5. Implement caching strategy

Your codebase is solid! These improvements will make it production-hardened.
