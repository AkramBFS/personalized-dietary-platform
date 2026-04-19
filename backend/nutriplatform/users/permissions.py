from rest_framework.permissions import BasePermission
class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_staff
        )
class IsClient(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'client'
class IsNutritionist(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'nutritionist'
class IsPremiumClient(BasePermission):
    message = 'This feature requires an active premium subscription.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role != 'client':
            return False
        try:
            client = request.user.client
            from client.models import PremiumSubscription
            from django.utils import timezone

            now = timezone.now()

            # Handle both timezone-aware and naive datetimes
            active_sub = PremiumSubscription.objects.filter(
                client = client,
                status = 'active',
            ).last()

            if not active_sub:
                return False

            # Compare safely
            end_date = active_sub.end_date
            if end_date is None:
                return False

            # Make timezone-aware if naive
            if timezone.is_naive(end_date):
                from django.utils.timezone import make_aware
                end_date = make_aware(end_date)

            return end_date > now

        except Exception:
            return False