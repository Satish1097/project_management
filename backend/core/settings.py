"""
Compatibility bridge — keeps existing entrypoints (manage.py, wsgi, asgi)
pointing at core.settings while loading the split config layer.
"""
from config.settings.development import *  # noqa: F401,F403
