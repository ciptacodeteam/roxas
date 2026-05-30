import os
from datetime import timedelta
from pathlib import Path
import dj_database_url
from django.core.management.utils import get_random_secret_key
from celery.schedules import crontab

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

def get_env_list(key: str) -> list[str]:
    """
    Return a list for comma-separated env vars while gracefully handling blanks.
    """
    value = os.environ.get(key, "")
    return [item.strip() for item in value.split(",") if item.strip()]

def get_env_bool(key: str, default: bool = False) -> bool:
    return os.environ.get(key, str(int(default))).lower() in ("1", "true", "yes", "on")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", get_random_secret_key())

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = get_env_bool("DEBUG", False)

ALLOWED_HOSTS = get_env_list("ALLOWED_HOSTS") or ["localhost", "127.0.0.1"]
CSRF_TRUSTED_ORIGINS = get_env_list("CSRF_TRUSTED_ORIGINS")


# Application definition

INSTALLED_APPS = [
    "corsheaders",
    'django.contrib.admin',  # Django admin interface
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',  # Required for collectstatic
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_filters",
    "drf_spectacular",  # API documentation
    "anymail",  # Email service provider backends

    "account.apps.AccountConfig",
    "main.apps.MainConfig",
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "corsheaders.middleware.CorsMiddleware",  # MUST be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.gzip.GZipMiddleware',  # Response compression
    'backend.middleware.ResponseTimeMiddleware',  # Add response time header
    'backend.middleware.APILoggingMiddleware',  # Log API requests
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'backend.middleware.CacheControlMiddleware',  # Add cache headers
]

if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Trust proxy headers from nginx (required when behind reverse proxy)
    # This tells Django to trust X-Forwarded-Proto header from nginx
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # SSL redirect - DISABLED because nginx already handles HTTP->HTTPS redirect
    # Setting this to True causes redirect loops when behind nginx
    SECURE_SSL_REDIRECT = get_env_bool("SECURE_SSL_REDIRECT", False)
    SESSION_COOKIE_SECURE = get_env_bool("SESSION_COOKIE_SECURE", False)
    CSRF_COOKIE_SECURE = get_env_bool("CSRF_COOKIE_SECURE", False)
else:
    # Development settings
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=int(os.environ.get("DB_CONN_MAX_AGE", "60")),
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": os.environ.get("SQL_ENGINE", "django.db.backends.sqlite3"),
            "NAME": os.environ.get("SQL_DATABASE", BASE_DIR / "db.sqlite3"),
            "USER": os.environ.get("SQL_USER", "postgres"),
            "PASSWORD": os.environ.get("SQL_PASSWORD", "password"),
            "HOST": os.environ.get("SQL_HOST", "localhost"),
            "PORT": os.environ.get("SQL_PORT", "5432"),
        }
    }

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Media files (User uploaded files)
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# DRF / Auth
CORS_ALLOWED_ORIGINS = get_env_list("CORS_ALLOWED_ORIGINS")
# Add localhost:3000 as default for development if not specified
if DEBUG and not CORS_ALLOWED_ORIGINS:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
CORS_ALLOW_CREDENTIALS = True
# Allow cache-control, pragma and other common headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cache-control',  # Allow cache-control header for cache management
    'pragma',  # Allow pragma header (used by browsers for cache control)
]

# Throttle configuration
# Rates per window: "number/period" where period = second/minute/hour/day
REST_FRAMEWORK_THROTTLE_CLASSES = [
    'rest_framework.throttling.AnonRateThrottle',
    'rest_framework.throttling.UserRateThrottle',
]
REST_FRAMEWORK_THROTTLE_RATES = {
    'anon': os.environ.get('THROTTLE_RATE_ANON', '60/minute'),
    'user': os.environ.get('THROTTLE_RATE_USER', '300/minute'),
    'login': os.environ.get('THROTTLE_RATE_LOGIN', '50/minute'),  # For token endpoint
}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "account.authentication.CookieJWTAuthentication",  # Custom cookie-based JWT auth
        "rest_framework_simplejwt.authentication.JWTAuthentication",  # Fallback for backward compatibility
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),
    'DEFAULT_THROTTLE_CLASSES': REST_FRAMEWORK_THROTTLE_CLASSES,
    'DEFAULT_THROTTLE_RATES': REST_FRAMEWORK_THROTTLE_RATES,
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'PAGE_SIZE_QUERY_PARAM': 'page_size',
    'MAX_PAGE_SIZE': 100,
    'EXCEPTION_HANDLER': 'backend.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
}

ACCESS_TOKEN_MINUTES = int(os.environ.get("ACCESS_TOKEN_LIFETIME_MINUTES", "5"))
REFRESH_TOKEN_DAYS = int(os.environ.get("REFRESH_TOKEN_LIFETIME_DAYS", "7"))

# Determine SameSite cookie policy based on environment
# In development (DEBUG=True), use "Lax" for localhost-to-localhost (different ports are same-site)
# In production (DEBUG=False), use "None" for cross-domain setups (requires Secure=True)
# Note: SameSite=None REQUIRES Secure=True (browsers enforce this)
if DEBUG:
    COOKIE_SAMESITE = "Lax"  # Development: localhost:3000 <-> localhost:8000
    COOKIE_SECURE = False
else:
    COOKIE_SAMESITE = "None"  # Production: cross-domain support
    COOKIE_SECURE = True  # Required when SameSite=None

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=ACCESS_TOKEN_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=REFRESH_TOKEN_DAYS),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_COOKIE": "access_token",  # Name of the access token cookie
    "AUTH_COOKIE_REFRESH": "refresh_token",  # Name of the refresh token cookie
    "AUTH_COOKIE_SECURE": COOKIE_SECURE,  # HTTPS only in production
    "AUTH_COOKIE_HTTP_ONLY": True,  # HttpOnly flag
    # SameSite="None" allows cross-origin cookies (required when frontend and backend are on different domains)
    # This works for both localhost development and production cross-domain setups
    # Important: Secure=True is REQUIRED when SameSite=None (enforced by browsers)
    "AUTH_COOKIE_SAMESITE": COOKIE_SAMESITE,
    "AUTH_COOKIE_DOMAIN": os.environ.get("COOKIE_DOMAIN", None),  # Allow setting cookie domain via env var
    "AUTH_COOKIE_PATH": "/",  # Cookie available for all paths
}

AUTH_USER_MODEL = "account.CustomUser"

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

# ============================================
# ENVIRONMENT MODE
# Set ENVIRONMENT=production in prod .env, leave default (development) for local dev.
# Both Midtrans and Digiflazz derive their sandbox/production mode from this single flag.
# Individual per-service overrides (MIDTRANS_IS_PRODUCTION / DIGIFLAZZ_IS_PRODUCTION) are
# still respected when explicitly set, so existing deployments keep working.
# ============================================
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development").strip().lower()
IS_PRODUCTION = ENVIRONMENT == "production"

# ============================================
# MIDTRANS PAYMENT GATEWAY CONFIGURATION
# ============================================
MIDTRANS_SERVER_KEY = os.environ.get("MIDTRANS_SERVER_KEY", "")
MIDTRANS_CLIENT_KEY = os.environ.get("MIDTRANS_CLIENT_KEY", "")
# Allow per-service override; fall back to global IS_PRODUCTION
_midtrans_production_override = os.environ.get("MIDTRANS_IS_PRODUCTION", "").strip()
MIDTRANS_PRODUCTION = (
    (_midtrans_production_override.lower() == "true")
    if _midtrans_production_override
    else IS_PRODUCTION
)

# ============================================
# DIGIFLAZZ GAME TOP-UP CONFIGURATION
# ============================================
DIGIFLAZZ_USERNAME = os.environ.get("DIGIFLAZZ_USERNAME", "")
DIGIFLAZZ_API_KEY = os.environ.get("DIGIFLAZZ_API_KEY", "")
DIGIFLAZZ_API_URL = os.environ.get("DIGIFLAZZ_API_URL", "https://api.digiflazz.com/v1")
DIGIFLAZZ_WEBHOOK_SECRET = os.environ.get("DIGIFLAZZ_WEBHOOK_SECRET", "")
# Allow per-service override; fall back to global IS_PRODUCTION
_digiflazz_production_override = os.environ.get("DIGIFLAZZ_IS_PRODUCTION", "").strip()
DIGIFLAZZ_PRODUCTION = (
    (_digiflazz_production_override.lower() == "true")
    if _digiflazz_production_override
    else IS_PRODUCTION
)
DIGIFLAZZ_ENVIRONMENT = "production" if DIGIFLAZZ_PRODUCTION else "sandbox"
# Minimum balance threshold for low-balance alert emails (IDR)
DIGIFLAZZ_LOW_BALANCE_THRESHOLD = int(os.environ.get('DIGIFLAZZ_LOW_BALANCE_THRESHOLD', '100000'))
# Admin email for operational alerts (low balance, system errors)
ADMIN_ALERT_EMAIL = os.environ.get('ADMIN_ALERT_EMAIL', '')
# Webhook IP allowlists (comma-separated CIDRs or IPs; empty = no restriction)
# In production, Midtrans defaults to 103.208.23.0/24,103.179.188.0/28 when empty
MIDTRANS_WEBHOOK_ALLOWED_IPS = os.environ.get('MIDTRANS_WEBHOOK_ALLOWED_IPS', '')
DIGIFLAZZ_WEBHOOK_ALLOWED_IPS = os.environ.get('DIGIFLAZZ_WEBHOOK_ALLOWED_IPS', '')

# CSRF Settings for cookie-based authentication
CSRF_COOKIE_HTTPONLY = False  # Must be False so frontend can read CSRF token if needed
CSRF_COOKIE_SAMESITE = COOKIE_SAMESITE  # Match AUTH_COOKIE_SAMESITE
CSRF_COOKIE_SECURE = COOKIE_SECURE  # Use secure cookies in production
# Note: CSRF_TRUSTED_ORIGINS is already set at the top of this file from env var

# Session Settings
SESSION_COOKIE_SAMESITE = COOKIE_SAMESITE
SESSION_COOKIE_SECURE = COOKIE_SECURE

# Email Configuration (Resend)
# Use HTTP API backend if RESEND_API_KEY is provided, otherwise fall back to console/SMTP
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')

if RESEND_API_KEY:
    EMAIL_BACKEND = 'anymail.backends.resend.EmailBackend'
    ANYMAIL = {
        'RESEND_API_KEY': RESEND_API_KEY,
    }
elif DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'localhost')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'true').lower() in ('true', '1', 'yes')
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
    EMAIL_TIMEOUT = int(os.environ.get('EMAIL_TIMEOUT', '30'))

DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@yourdomain.com')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes hard kill
CELERY_TASK_SOFT_TIME_LIMIT = 15 * 60  # 15 minutes soft (sends SoftTimeLimitExceeded for graceful shutdown)
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
# Fix deprecation warning: explicitly enable broker connection retry on startup
# This will be required in Celery 6.0+
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

CELERY_BEAT_SCHEDULE = {
    # Clean up API logs older than 30 days — runs daily at 02:00 UTC
    'cleanup-old-api-logs': {
        'task': 'main.tasks.cleanup_old_api_logs',
        'schedule': crontab(hour=2, minute=0),
        'kwargs': {'days': 30},
    },
    # Sync Digiflazz balance for monitoring — runs every hour
    'sync-digiflazz-balance': {
        'task': 'main.tasks.sync_digiflazz_balance',
        'schedule': crontab(minute=0),  # Every hour at :00
    },
}

# API Documentation (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Roxas API',
    'DESCRIPTION': 'API documentation for Roxas - Game Currency Store',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/v1',
}

# Caching Configuration (django-redis)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL', os.environ.get('CELERY_BROKER_URL', 'redis://127.0.0.1:6379/1')),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'IGNORE_EXCEPTIONS': True,  # Don't fail if Redis is down
        },
        'KEY_PREFIX': 'roxas',
        'TIMEOUT': 300,  # 5 minutes default
    }
}

# Use cache for sessions (optional but recommended)
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Logging Configuration
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Determine if running in Docker (file logging may have permission issues)
_IN_DOCKER = os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER', False)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            # Use plain FileHandler in Docker to avoid RotatingFileHandler
            # permission issues with bind-mounted volumes
            'class': 'logging.FileHandler' if _IN_DOCKER else 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'django.log',
            **({} if _IN_DOCKER else {
                'maxBytes': 1024 * 1024 * 10,  # 10 MB
                'backupCount': 10,
            }),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'account': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
        },
        'main': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
        },
    },
}
