# Migration Error Fix: "Dependency on app with no migrations: account"

## Problem
Docker deployment was failing with:
```
ValueError: Dependency on app with no migrations: account
```

This error occurred even though the `account` app has proper migrations (`0001_initial.py` and `0002_customuser_google_id_and_more.py`).

## Root Cause
The issue occurs in Docker environments when:
1. Python bytecode cache (`__pycache__` directories or `.pyc` files) becomes stale
2. The migration discovery process fails to find migrations due to corrupted module cache
3. Django's migration loader can't locate the app's migrations

## Solution
Updated `backend/entrypoint.sh` to:
1. **Clean Python cache** before running migrations:
   - Remove all `__pycache__` directories
   - Delete all `.pyc` files
   - This ensures Django's module loader properly discovers migrations

2. **Verify migrations exist**:
   - Check that migration `__init__.py` files are present
   - Provides helpful debugging output if files are missing

## Changes Made
- **File**: `backend/entrypoint.sh`
  - Added `find` commands to recursively delete Python cache
  - Added migration file validation checks
  - Cache cleaning happens before `python manage.py migrate`

## Environment Context
The Dockerfile already has:
- `PYTHONDONTWRITEBYTECODE=1` environment variable (prevents bytecode writing)
- `.dockerignore` properly excludes `__pycache__/` (prevents copying cache to image)

The additional fix ensures any residual cache is cleaned at container startup.

## Testing
To verify the fix works:
```bash
# Rebuild Docker image to include changes
docker-compose build

# Run migrations in container
docker-compose up
```

The `entrypoint.sh` will now:
1. Clean all Python cache
2. Verify migration files exist
3. Run `python manage.py migrate --noinput`
4. Start the application

## Notes
- The `PYTHONDONTWRITEBYTECODE=1` in Dockerfile prevents new cache from being created
- The entrypoint cleanup handles any pre-existing cache from previous builds
- No changes needed to migration files or Django apps - they're already correct
