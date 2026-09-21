from django.db import connection, transaction
from rest_framework_simplejwt.authentication import JWTAuthentication


def set_rls_context(user=None):
    """
    Sets PostgreSQL session variables for Row-Level Security:
    - app.current_user_id: string of user ID (or empty if unauthenticated)
    - app.is_staff: 'true' if user is staff/admin or superuser, else 'false'
    Bypasses gracefully on non-PostgreSQL databases (e.g. SQLite test runners).
    """
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        if user and getattr(user, 'is_authenticated', False):
            user_id = str(user.id)
            is_staff = 'true' if (
                getattr(user, 'is_staff', False)
                or getattr(user, 'is_superuser', False)
                or getattr(user, 'role', '') == 'admin'
            ) else 'false'
            cursor.execute("SET LOCAL app.current_user_id = %s;", [user_id])
            cursor.execute("SET LOCAL app.is_staff = %s;", [is_staff])
        else:
            cursor.execute("SET LOCAL app.current_user_id = '';")
            cursor.execute("SET LOCAL app.is_staff = 'false';")


def clear_rls_context():
    """
    Resets PostgreSQL session variables to prevent connection leakage across pooled connections.
    """
    if connection.vendor != 'postgresql':
        return

    with connection.cursor() as cursor:
        cursor.execute("RESET app.current_user_id;")
        cursor.execute("RESET app.is_staff;")


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
    DRF JWTAuthentication that sets PostgreSQL RLS context immediately upon successful
    token authentication during DRF's perform_authentication lifecycle.
    """
    def authenticate(self, request):
        auth_result = super().authenticate(request)
        if auth_result is not None:
            user, token = auth_result
            set_rls_context(user)
        return auth_result
