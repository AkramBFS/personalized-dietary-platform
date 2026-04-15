from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            recipient=request.user
        ).order_by('-created_at')

        serializer = NotificationSerializer(notifications, many=True)
        return Response({
            "status": "success",
            "data": {
                "unread_count": notifications.filter(is_read=False).count(),
                "results":      serializer.data,
            }
        })


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(
                id=pk, recipient=request.user
            )
        except Notification.DoesNotExist:
            return Response({"status": "error", "message": "Notification not found."}, status=404)

        notification.is_read = True
        notification.save()

        return Response({
            "status": "success",
            "data":   NotificationSerializer(notification).data
        })


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)

        return Response({
            "status":  "success",
            "message": "All notifications marked as read."
        })