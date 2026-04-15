from notifications.models import Notification


def notify(recipient, sender=None, title='', message='', target_type='', target_id=None):
    """
    Central utility to create notifications.
    Call this from anywhere in the project.

    Usage:
        notify(
            recipient   = client.user,
            sender      = nutritionist.user,
            title       = 'Consultation Booked',
            message     = 'Your consultation is confirmed for April 20.',
            target_type = 'consultation',
            target_id   = consultation.id,
        )
    """
    Notification.objects.create(
        recipient   = recipient,
        sender      = sender,
        title       = title,
        message     = message,
        target_type = target_type,
        target_id   = target_id,
    )