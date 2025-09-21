# Sentry Configuration for Error Tracking
import os
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

# Sentry DSN
SENTRY_DSN = os.getenv('SENTRY_DSN', 'https://enterprise_sentry_dsn@sentry.io/project_id')

# Initialize Sentry
sentry_sdk.init(
    dsn=SENTRY_DSN,
    integrations=[
        FlaskIntegration(),
        RedisIntegration(),
        SqlalchemyIntegration(),
        CeleryIntegration(),
    ],
    traces_sample_rate=0.1,
    profiles_sample_rate=0.1,
    environment=os.getenv('NODE_ENV', 'production'),
    release=os.getenv('APP_VERSION', '1.0.0'),
    before_send=before_send_filter,
    before_send_transaction=before_send_transaction_filter,
)

def before_send_filter(event, hint):
    """Filter events before sending to Sentry"""
    # Filter out health check errors
    if event.get('request', {}).get('url', '').endswith('/health'):
        return None
    
    # Filter out 404 errors for static files
    if event.get('exception', {}).get('values', [{}])[0].get('type') == 'NotFound':
        return None
    
    # Add custom tags
    event.setdefault('tags', {}).update({
        'service': 'gongbu-platform',
        'component': 'backend',
    })
    
    return event

def before_send_transaction_filter(event, hint):
    """Filter transactions before sending to Sentry"""
    # Filter out health check transactions
    if event.get('transaction', '').endswith('/health'):
        return None
    
    return event

# Custom error handlers
def capture_exception(exception, extra=None):
    """Capture exception with additional context"""
    with sentry_sdk.push_scope() as scope:
        if extra:
            for key, value in extra.items():
                scope.set_extra(key, value)
        sentry_sdk.capture_exception(exception)

def capture_message(message, level='info', extra=None):
    """Capture message with additional context"""
    with sentry_sdk.push_scope() as scope:
        if extra:
            for key, value in extra.items():
                scope.set_extra(key, value)
        sentry_sdk.capture_message(message, level=level)

def set_user_context(user_id, email=None, username=None):
    """Set user context for error tracking"""
    sentry_sdk.set_user({
        'id': user_id,
        'email': email,
        'username': username,
    })

def set_extra_context(key, value):
    """Set extra context for error tracking"""
    sentry_sdk.set_extra(key, value)

def set_tag(key, value):
    """Set tag for error tracking"""
    sentry_sdk.set_tag(key, value)

def add_breadcrumb(message, category='custom', level='info', data=None):
    """Add breadcrumb for error tracking"""
    sentry_sdk.add_breadcrumb(
        message=message,
        category=category,
        level=level,
        data=data
    )
