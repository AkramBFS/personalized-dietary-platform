from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.cache import caches


class RedisHealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            ratelimit_cache = caches['ratelimit']
            ratelimit_cache.set('health_check', 1, timeout=5)
            val = ratelimit_cache.get('health_check')
            if val != 1:
                return Response({
                    "status": "error",
                    "redis": "unhealthy",
                    "message": "Failed to read back probe value from Redis ratelimit cache."
                }, status=503)

            return Response({
                "status": "healthy",
                "redis": "connected",
                "ratelimit_db": "active",
            }, status=200)
        except Exception as e:
            return Response({
                "status": "error",
                "redis": "unreachable",
                "message": str(e),
            }, status=503)
