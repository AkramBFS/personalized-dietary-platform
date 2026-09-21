import base64
import hashlib
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet, MultiFernet, InvalidToken


def get_multi_fernet():
    """
    Constructs a MultiFernet instance from settings.ENCRYPTION_PRIMARY_KEY
    and optional settings.ENCRYPTION_FALLBACK_KEYS.
    In testing/development, falls back to a Fernet key deterministically derived
    from settings.SECRET_KEY if ENCRYPTION_PRIMARY_KEY is omitted.
    """
    primary_key = getattr(settings, 'ENCRYPTION_PRIMARY_KEY', '').strip()
    fallback_keys_str = getattr(settings, 'ENCRYPTION_FALLBACK_KEYS', '').strip()

    fernets = []

    if primary_key:
        fernets.append(Fernet(primary_key.encode('utf-8')))
    else:
        # Fallback key derived from SECRET_KEY for dev / unit test environments
        derived = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode('utf-8')).digest())
        fernets.append(Fernet(derived))

    if fallback_keys_str:
        for k in fallback_keys_str.split(','):
            k_clean = k.strip()
            if k_clean:
                fernets.append(Fernet(k_clean.encode('utf-8')))

    return MultiFernet(fernets)


class EncryptedTextField(models.TextField):
    """
    Versioned field-level symmetric encryption field utilizing MultiFernet.
    - Encrypted values are stored as 'v1:<fernet_token>' in the database.
    - Transparent read compatibility: if a legacy record does not start with 'v<n>:',
      it returns the plaintext string without writing to or mutating the database on read.
    - Key rotation: MultiFernet attempts decryption against the primary key, then fallbacks.
    """
    description = "Field-level encrypted text with MultiFernet versioning (v1:...)"

    def from_db_value(self, value, expression, connection):
        if value is None or value == "":
            return value

        # Check for versioned envelope prefix (e.g. 'v1:')
        if isinstance(value, str) and value.startswith("v1:"):
            token = value[3:]
            f = get_multi_fernet()
            try:
                decrypted_bytes = f.decrypt(token.encode('utf-8'))
                return decrypted_bytes.decode('utf-8')
            except InvalidToken:
                # If decryption fails, do not crash; return token for audit
                return "[ENCRYPTION_DECRYPTION_FAILED]"

        # Legacy plaintext: return as-is without mutating the database
        return value

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None or value == "":
            return value

        if isinstance(value, str) and value.startswith("v1:"):
            return value

        f = get_multi_fernet()
        ciphertext = f.encrypt(str(value).encode('utf-8')).decode('utf-8')
        return f"v1:{ciphertext}"

    def to_python(self, value):
        if isinstance(value, str) and value.startswith("v1:"):
            # Defer decryption to from_db_value or decrypt directly
            f = get_multi_fernet()
            try:
                decrypted_bytes = f.decrypt(value[3:].encode('utf-8'))
                return decrypted_bytes.decode('utf-8')
            except InvalidToken:
                return value
        return super().to_python(value)
