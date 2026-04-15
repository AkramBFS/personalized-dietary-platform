from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
)

urlpatterns = [
    path('',              NotificationListView.as_view(),         name='notifications'),
    path('<int:pk>/read/', MarkNotificationReadView.as_view(),    name='notification-read'),
    path('read-all/',     MarkAllNotificationsReadView.as_view(), name='notifications-read-all'),
]