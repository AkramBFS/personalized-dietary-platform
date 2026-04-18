from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = [
            'id', 'title', 'message',
            'target_type', 'target_id',
            'is_read', 'created_at',
            'sender_username',
        ]

    def get_sender_username(self, obj):
        return obj.sender.username if obj.sender else None