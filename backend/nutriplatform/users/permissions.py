from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.is_staff
        )


class IsClient(BasePermission):
    message = 'Account is suspended, inactive, or unauthorized.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False
        if request.user.role != 'client':
            return False
        client = getattr(request.user, 'client', None)
        if client and client.is_banned:
            return False
        return True


class IsNutritionist(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_active and
            request.user.role == 'nutritionist'
        )


class IsApprovedNutritionist(BasePermission):
    message = 'Your nutritionist account is pending approval, rejected, or inactive.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active and request.user.role == 'nutritionist'):
            return False
        try:
            return request.user.nutritionist.approval_status == 'approved'
        except Exception:
            return False


class IsPremiumClient(BasePermission):
    message = 'This feature requires an active premium subscription.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_active):
            return False
        if request.user.role != 'client':
            return False
        try:
            client = request.user.client
            if client.is_banned:
                return False
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