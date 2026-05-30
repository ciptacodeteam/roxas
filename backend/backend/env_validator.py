"""
Environment variable validation module.
Ensures critical environment variables are set before application starts.
"""
import os
import sys
from typing import List, Tuple


class EnvironmentValidationError(Exception):
    """Raised when required environment variables are missing or invalid."""
    pass


def validate_env_vars() -> None:
    """
    Validate that all required environment variables are set.
    Raises EnvironmentValidationError if validation fails.
    """
    errors: List[str] = []
    warnings: List[str] = []
    
    # Check if we're in production
    is_production = not os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes', 'on')
    
    # Required variables (always)
    required_vars = [
        'SECRET_KEY',
    ]
    
    # Required in production
    if is_production:
        production_required = [
            'DATABASE_URL',
            'ALLOWED_HOSTS',
            'CSRF_TRUSTED_ORIGINS',
            'CORS_ALLOWED_ORIGINS',
        ]
        required_vars.extend(production_required)
    
    # Check required variables
    for var in required_vars:
        value = os.environ.get(var, '')
        if not value or value == 'change-me-to-secure-random-key':
            errors.append(f"❌ {var} is not set or using default value")
    
    # Payment gateway variables (warn if missing)
    payment_vars = [
        ('MIDTRANS_SERVER_KEY', 'Midtrans payment gateway'),
        ('MIDTRANS_CLIENT_KEY', 'Midtrans payment gateway'),
        ('DIGIFLAZZ_USERNAME', 'Digiflazz top-up service'),
        ('DIGIFLAZZ_API_KEY', 'Digiflazz top-up service'),
    ]
    
    for var, service in payment_vars:
        value = os.environ.get(var, '')
        if not value:
            warnings.append(f"⚠️  {var} is not set - {service} will not work")
    
    # Email configuration (warn if missing in production)
    if is_production:
        email_vars = [
            'RESEND_API_KEY',
            'DEFAULT_FROM_EMAIL',
        ]
        for var in email_vars:
            value = os.environ.get(var, '')
            if not value or '@yourdomain.com' in value:
                warnings.append(f"⚠️  {var} is not properly configured - Email functionality may not work")
    
    # Celery/Redis (warn if missing)
    if not os.environ.get('CELERY_BROKER_URL'):
        warnings.append("⚠️  CELERY_BROKER_URL is not set - Background tasks will not work")
    
    # Security checks in production
    if is_production:
        # Check SECRET_KEY strength
        secret_key = os.environ.get('SECRET_KEY', '')
        if len(secret_key) < 50:
            warnings.append("⚠️  SECRET_KEY should be at least 50 characters long")
        
        # Check that DEBUG is explicitly set to False
        debug_value = os.environ.get('DEBUG', '')
        if debug_value not in ('False', 'false', '0', 'no', 'off', ''):
            errors.append("❌ DEBUG must be set to False in production")
    
    # Print warnings
    if warnings:
        print("\n" + "="*60)
        print("ENVIRONMENT CONFIGURATION WARNINGS")
        print("="*60)
        for warning in warnings:
            print(warning)
        print("="*60 + "\n")
    
    # Print and raise errors
    if errors:
        print("\n" + "="*60, file=sys.stderr)
        print("ENVIRONMENT CONFIGURATION ERRORS", file=sys.stderr)
        print("="*60, file=sys.stderr)
        for error in errors:
            print(error, file=sys.stderr)
        print("="*60 + "\n", file=sys.stderr)
        raise EnvironmentValidationError(
            f"Environment validation failed with {len(errors)} error(s). "
            "Please check your environment variables and try again."
        )


def print_env_summary() -> None:
    """Print a summary of environment configuration (safe for logging)."""
    is_production = not os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes', 'on')
    
    print("\n" + "="*60)
    print("ENVIRONMENT CONFIGURATION SUMMARY")
    print("="*60)
    print(f"Environment: {'PRODUCTION' if is_production else 'DEVELOPMENT'}")
    print(f"Debug Mode: {os.environ.get('DEBUG', 'False')}")
    print(f"Database: {'PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite'}")
    print(f"Cache/Queue: {'Redis' if os.environ.get('CELERY_BROKER_URL') else 'None'}")
    print(f"Midtrans: {'Configured' if os.environ.get('MIDTRANS_SERVER_KEY') else 'Not configured'}")
    print(f"Digiflazz: {'Configured' if os.environ.get('DIGIFLAZZ_API_KEY') else 'Not configured'}")
    print(f"Email: {'Configured' if os.environ.get('RESEND_API_KEY') else 'Not configured'}")
    print("="*60 + "\n")
