from django.apps import AppConfig
from django.core.exceptions import ImproperlyConfigured
from django.conf import settings


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        ai_secret = getattr(settings, 'AI_SERVICE_SECRET_KEY', None)
        if not ai_secret or len(str(ai_secret).strip()) < 16:
            raise ImproperlyConfigured(
                "FATAL: AI_SERVICE_SECRET_KEY is missing or too short in Django settings (minimum 16 chars required)."
            )

        secret_key = getattr(settings, 'SECRET_KEY', None)
        if not secret_key or len(str(secret_key).strip()) < 16:
            raise ImproperlyConfigured("FATAL: Django SECRET_KEY is not properly configured.")
