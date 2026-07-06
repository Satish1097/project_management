"""
Development environment settings.
"""
from .base import *  # noqa: F401,F403

DEBUG = True

# Relaxed CORS for local frontend dev
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "true").lower() == "true"  # noqa: F405
