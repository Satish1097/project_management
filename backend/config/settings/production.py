"""
Production environment settings.
"""
from .base import *  # noqa: F401,F403

DEBUG = False

CORS_ALLOW_ALL_ORIGINS = False

# Security hardening
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
