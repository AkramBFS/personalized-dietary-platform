import datetime
from django.db import migrations


def blacklist_historical_tokens(apps, schema_editor):
    OutstandingToken = apps.get_model('token_blacklist', 'OutstandingToken')
    BlacklistedToken = apps.get_model('token_blacklist', 'BlacklistedToken')
    User = apps.get_model('users', 'User')

    # Historical refresh token discovered in commit 813f054
    historical_jti = '60edc91b232c43f2a781229aa1aab868'
    historical_token_str = (
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
        'eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc3ODQyNjUyOCwiaWF0IjoxNzc3ODIxNzI4LCJqdGkiOiI2MGVkYzkxYjIzMmM0M2YyYTc4MTIyOWFhMWFhYjg2OCIsInVzZXJfaWQiOiIxNSJ9.'
        'Eua4pAHyB5qjG5tbjZ8K2YITeM12F3HeYV0ZVKrkNfo'
    )

    user = User.objects.filter(id=15).first()

    outstanding, _ = OutstandingToken.objects.get_or_create(
        jti=historical_jti,
        defaults={
            'token': historical_token_str,
            'created_at': datetime.datetime.fromtimestamp(1777821728, tz=datetime.timezone.utc),
            'expires_at': datetime.datetime.fromtimestamp(1778426528, tz=datetime.timezone.utc),
            'user': user,
        }
    )

    BlacklistedToken.objects.get_or_create(token=outstanding)


def revert_blacklist_historical_tokens(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_role'),
        ('token_blacklist', '0012_alter_outstandingtoken_user'),
    ]

    operations = [
        migrations.RunPython(blacklist_historical_tokens, revert_blacklist_historical_tokens),
    ]
