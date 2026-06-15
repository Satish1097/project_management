"""
JWT configuration for djangorestframework-simplejwt.

Remember-me refresh lifetime is defined here for Slice 4+ auth services;
default refresh lifetime remains 7 days until login passes remember_me=True.
"""
from datetime import timedelta

REMEMBER_ME_REFRESH_TOKEN_LIFETIME = timedelta(days=30)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}
