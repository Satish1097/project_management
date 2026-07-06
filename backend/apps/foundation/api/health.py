"""
Health check endpoint — verifies database and Redis connectivity.
"""
from django.conf import settings
from django.db import connection
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from apps.foundation.responses import success_response


def _check_database():
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return "connected"
    except Exception:
        return "disconnected"


def _check_redis():
    try:
        import redis

        client = redis.from_url(settings.REDIS_URL, socket_connect_timeout=2)
        client.ping()
        return "connected"
    except Exception:
        return "disconnected"


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        db_status = _check_database()
        redis_status = _check_redis()
        overall = "healthy" if db_status == "connected" and redis_status == "connected" else "degraded"

        return success_response(
            data={
                "status": overall,
                "database": db_status,
                "redis": redis_status,
            }
        )
