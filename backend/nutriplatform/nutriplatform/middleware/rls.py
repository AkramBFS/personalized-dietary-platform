from django.db import connection, transaction
from rest_framework_simplejwt.authentication import JWTAuthentication


def set_rls_context(user=None, is_system_worker: bool = False):
    """
    Sets PostgreSQL session variables for Row-Level Security:
    - app.current_user_id: string of user ID (or empty if unauthenticated)
    - app.is_staff: 'true' if user is staff/admin or superuser, else 'false'
    - app.is_system_worker: 'true' if execution context is background worker, else 'false'
    Bypasses gracefully on non-PostgreSQL databases (e.g. SQLite test runners).
    """
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        if is_system_worker:
            cursor.execute("SET LOCAL app.current_user_id = '';")
            cursor.execute("SET LOCAL app.is_staff = 'true';")
            cursor.execute("SET LOCAL app.is_system_worker = 'true';")
        elif user and getattr(user, 'is_authenticated', False):
            user_id = str(user.id)
            is_staff = 'true' if (
                getattr(user, 'is_staff', False)
                or getattr(user, 'is_superuser', False)
                or getattr(user, 'role', '') in ('admin', 'high_admin')
            ) else 'false'
            cursor.execute("SET LOCAL app.current_user_id = %s;", [user_id])
            cursor.execute("SET LOCAL app.is_staff = %s;", [is_staff])
            cursor.execute("SET LOCAL app.is_system_worker = 'false';")
        else:
            cursor.execute("SET LOCAL app.current_user_id = '';")
            cursor.execute("SET LOCAL app.is_staff = 'false';")
            cursor.execute("SET LOCAL app.is_system_worker = 'false';")


def clear_rls_context():
    """
    Resets PostgreSQL session variables to prevent connection leakage across pooled connections.
    """
    if connection.vendor != 'postgresql':
        return

    try:
        with connection.cursor() as cursor:
            cursor.execute("RESET app.current_user_id;")
            cursor.execute("RESET app.is_staff;")
            cursor.execute("RESET app.is_system_worker;")
    except Exception as e:
        logger.warning(f"[RLS] Failed to reset RLS session context ({e}); closing connection to prevent credential leakage.")
        connection.close()


class RLSMiddleware:
    """
    Django middleware that sets RLS context for authenticated requests (e.g., session auth)
    and ensures cleanup at the end of the request-response lifecycle.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if connection.vendor == 'postgresql':
            with transaction.atomic():
                try:
                    user = getattr(request, 'user', None)
                    set_rls_context(user)
                    response = self.get_response(request)
                    return response
                finally:
                    clear_rls_context()
        else:
            return self.get_response(request)


class RLSJWTAuthentication(JWTAuthentication):
    """
    Custom DRF JWT Authentication that sets PostgreSQL RLS context immediately upon authenticating a user.
    """
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is not None:
            user, token = result
            set_rls_context(user)
        return result
