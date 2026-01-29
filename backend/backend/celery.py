"""
Celery configuration for async task processing.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('roxas')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


# Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'sync-digiflazz-prices-hourly': {
        'task': 'main.tasks.sync_digiflazz_products',
        'schedule': crontab(minute=0),  # Every hour at minute 0
        'kwargs': {
            'category_filter': None,
            'brand_filter': None
        },
        'options': {
            'expires': 3600,  # Task expires after 1 hour
        }
    },
}

app.conf.timezone = 'Asia/Jakarta'


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


