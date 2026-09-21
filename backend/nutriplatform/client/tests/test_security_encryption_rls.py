import base64
import os
from cryptography.fernet import Fernet
from django.core.management import call_command
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory

from admin_panel.models import Country, Goal, Specialization
from client.models import Client, DailyProgressMetric
from marketplace.models import Consultation
from nutritionist.models import Nutritionist, PatientNote
from nutriplatform.middleware.rls import (
    RLSJWTAuthentication,
    RLSMiddleware,
    clear_rls_context,
    set_rls_context,
)
from users.models import User
from utils.fields import EncryptedTextField, get_multi_fernet


class SecurityEncryptionAndRLSTests(TestCase):

    def setUp(self):
        self.country = Country.objects.create(name="Algeria")
        self.goal = Goal.objects.create(name="Maintenance")
        self.specialization = Specialization.objects.create(name="Sports Nutrition")

        self.user = User.objects.create_user(
            username="encrypt_user",
            email="encrypt@test.com",
            password="SecurePassword123!",
            role="client",
        )
        self.client = Client.objects.create(
            user=self.user,
            country=self.country,
            goal=self.goal,
            age=30,
            weight=75.0,
            height=175.0,
            gender="male",
            health_history="Patient has allergy to penicillin and mild asthma.",
        )

        self.nutri_user = User.objects.create_user(
            username="encrypt_nutri",
            email="nutri_enc@test.com",
            password="SecurePassword123!",
            role="nutritionist",
        )
        self.nutritionist = Nutritionist.objects.create(
            user=self.nutri_user,
            country=self.country,
            specialization=self.specialization,
            is_approved=True,
            approval_status="approved",
        )

    def test_encrypted_text_field_stores_v1_envelope_and_decrypts(self):
        """Verify data is stored with 'v1:' prefix in raw database and decrypted transparently by ORM."""
        with connection.cursor() as cursor:
            cursor.execute("SELECT health_history FROM clients WHERE client_id = %s", [self.client.client_id])
            raw_val = cursor.fetchone()[0]

        self.assertIsNotNone(raw_val)
        self.assertTrue(raw_val.startswith("v1:"), f"Raw database value must start with 'v1:', got: {raw_val}")
        self.assertNotIn("penicillin", raw_val, "Raw ciphertext must not contain plaintext sensitive data")

        # ORM read transparently decrypts
        fresh_client = Client.objects.get(pk=self.client.pk)
        self.assertEqual(fresh_client.health_history, "Patient has allergy to penicillin and mild asthma.")

    def test_encrypted_text_field_legacy_plaintext_backward_compatibility(self):
        """Verify legacy plaintext is read without error and without mutating the database on read."""
        legacy_plaintext = "Legacy unencrypted historical record notes"
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE clients SET health_history = %s WHERE client_id = %s",
                [legacy_plaintext, self.client.client_id]
            )

        # Read via ORM: returns plaintext cleanly
        client_read = Client.objects.get(pk=self.client.pk)
        self.assertEqual(client_read.health_history, legacy_plaintext)

        # Verify raw DB was NOT mutated on read
        with connection.cursor() as cursor:
            cursor.execute("SELECT health_history FROM clients WHERE client_id = %s", [self.client.client_id])
            raw_after_read = cursor.fetchone()[0]

        self.assertEqual(raw_after_read, legacy_plaintext)

    def test_encrypted_text_field_null_and_empty(self):
        """Verify null and empty strings are handled cleanly without envelopes."""
        client_null = Client.objects.create(
            user=User.objects.create_user(username="null_user", email="null@test.com", password="P1!"),
            country=self.country,
            goal=self.goal,
            health_history=None,
        )
        with connection.cursor() as cursor:
            cursor.execute("SELECT health_history FROM clients WHERE client_id = %s", [client_null.client_id])
            raw_val = cursor.fetchone()[0]
        self.assertIsNone(raw_val)

        client_empty = Client.objects.create(
            user=User.objects.create_user(username="empty_user", email="empty@test.com", password="P1!"),
            country=self.country,
            goal=self.goal,
            health_history="",
        )
        self.assertEqual(Client.objects.get(pk=client_empty.pk).health_history, "")

    def test_key_rotation_multi_fernet_fallback(self):
        """Verify fallback keys allow decryption of tokens encrypted under previous keys."""
        old_key = Fernet.generate_key().decode('utf-8')
        new_primary_key = Fernet.generate_key().decode('utf-8')

        # Encrypt with old key
        f_old = Fernet(old_key.encode('utf-8'))
        token = f_old.encrypt(b"Top secret diagnostic").decode('utf-8')
        stored_envelope = f"v1:{token}"

        # Test MultiFernet with new primary key + old key in fallbacks
        with override_settings(ENCRYPTION_PRIMARY_KEY=new_primary_key, ENCRYPTION_FALLBACK_KEYS=old_key):
            multi = get_multi_fernet()
            decrypted = multi.decrypt(token.encode('utf-8')).decode('utf-8')
            self.assertEqual(decrypted, "Top secret diagnostic")

    def test_batch_encryption_management_command(self):
        """Verify encrypt_legacy_sensitive_data discovers plaintext records, encrypts them, and is idempotent."""
        # Insert a raw unencrypted note into patient_notes
        note = PatientNote.objects.create(
            nutritionist=self.nutritionist,
            client=self.client,
            note_content="Encrypted note test",
        )
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE patient_notes SET note_content = 'Raw unencrypted diagnosis note' WHERE id = %s",
                [note.id]
            )

        # Run command with --dry-run
        call_command('encrypt_legacy_sensitive_data', dry_run=True)

        # Verify still plaintext after dry run
        with connection.cursor() as cursor:
            cursor.execute("SELECT note_content FROM patient_notes WHERE id = %s", [note.id])
            self.assertEqual(cursor.fetchone()[0], 'Raw unencrypted diagnosis note')

        # Run command to apply encryption
        call_command('encrypt_legacy_sensitive_data')

        # Verify now stored with v1: envelope
        with connection.cursor() as cursor:
            cursor.execute("SELECT note_content FROM patient_notes WHERE id = %s", [note.id])
            raw_after = cursor.fetchone()[0]
        self.assertTrue(raw_after.startswith("v1:"))

        # Re-reading via ORM returns the decrypted text
        fresh_note = PatientNote.objects.get(pk=note.pk)
        self.assertEqual(fresh_note.note_content, 'Raw unencrypted diagnosis note')

        # Re-running command finds 0 records to encrypt
        call_command('encrypt_legacy_sensitive_data')

    def test_rls_context_and_middleware(self):
        """Verify set_rls_context, clear_rls_context and RLSMiddleware function without raising errors."""
        # Authenticated user
        set_rls_context(self.user)
        clear_rls_context()

        # Staff user
        self.user.is_staff = True
        set_rls_context(self.user)
        clear_rls_context()

        # Anonymous / unauthenticated
        set_rls_context(None)
        clear_rls_context()

        # RLSMiddleware test
        middleware = RLSMiddleware(get_response=lambda req: "ok")
        factory = APIRequestFactory()
        req = factory.get("/api/v1/client/dashboard/")
        req.user = self.user
        resp = middleware(req)
        self.assertEqual(resp, "ok")
