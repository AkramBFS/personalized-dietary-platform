from django.db import models
from users.models import User


class Notification(models.Model):
    recipient   = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_notifications', db_column='recipient_id')
    sender      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='sent_notifications', db_column='sender_id')
    title       = models.CharField(max_length=255, null=True, blank=True)
    message     = models.TextField(null=True, blank=True)
    target_type = models.CharField(max_length=50, null=True, blank=True)
    target_id   = models.IntegerField(null=True, blank=True)
    is_read     = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'

    def __str__(self):
        return f"Notification → {self.recipient.username}: {self.title}"