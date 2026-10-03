from django.http import JsonResponse
from rest_framework.throttling import SimpleRateThrottle


def get_client_ip(request):
    """
    Extracts the client's public IP address from standard proxy headers or REMOTE_ADDR.
    """
    if not request:
        return '127.0.0.1'

    cf_ip = request.META.get('HTTP_CF_CONNECTING_IP')
    if cf_ip:
        return cf_ip.strip()

    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()

    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def axes_lockout_response(request, credentials=None):
    """
    Standardized JSON 429 lockout response for django-axes brute-force protection.
    """
    return JsonResponse({
        "status": "error",
        "error_code": "TOO_MANY_REQUESTS",
        "message": "Too many failed login attempts. Account temporarily locked. Please try again in 30 minutes.",
    }, status=429)


class LoginCompositeThrottle(SimpleRateThrottle):
    """
    Limits authentication attempts to 5 per minute per composite (IP + Email).
    """
    scope = 'login_composite'

    def allow_request(self, request, view):
        from django.conf import settings
        if not getattr(settings, 'RATELIMIT_ENABLE', True):
            return True
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        if request.method.upper() != 'POST':
            return None

        ip = get_client_ip(request)
        email = ''
        data = getattr(request, 'data', None)
        if isinstance(data, dict) and data.get('email'):
            email = str(data['email']).strip().lower()
        elif hasattr(request, 'POST') and request.POST.get('email'):
            email = str(request.POST['email']).strip().lower()
        else:
            try:
                import json
                body_bytes = getattr(request, 'body', b'')
                if body_bytes:
                    parsed = json.loads(body_bytes.decode('utf-8'))
                    if isinstance(parsed, dict) and parsed.get('email'):
                        email = str(parsed['email']).strip().lower()
            except Exception:
                pass

        ident = f"{ip}_{email}" if email else ip
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }


class LoginIPThrottle(SimpleRateThrottle):
    """
    Limits all authentication attempts to 20 per hour per IP.
    """
    scope = 'login_ip'

    def allow_request(self, request, view):
        from django.conf import settings
        if not getattr(settings, 'RATELIMIT_ENABLE', True):
            return True
        return super().allow_request(request, view)

    def get_cache_key(self, request, view):
        if request.method.upper() != 'POST':
            return None

        ip = get_client_ip(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ip,
        }
