import io
import os
import shutil
import tempfile
from pathlib import Path
from PIL import Image
from unittest.mock import patch

from django.conf import settings
from django.core.management import call_command
from django.test import TestCase, override_settings

from client.models import Client
from nutritionist.models import Nutritionist
from marketplace.models import Plan
from community.models import Post
from users.models import User


class AuditAndSanitizeMediaCommandTests(TestCase):
    def setUp(self):
        self.temp_media = tempfile.mkdtemp()
        self.media_path = Path(self.temp_media)
        
        # Create user fixtures
        self.user_client = User.objects.create_user(username="audit_c1", email="c1@audit.com", password="pw", role="client")
        self.user_nutri = User.objects.create_user(username="audit_n1", email="n1@audit.com", password="pw", role="nutritionist")
        
        # Create directories
        (self.media_path / 'profiles' / 'clients').mkdir(parents=True, exist_ok=True)
        (self.media_path / 'certifications').mkdir(parents=True, exist_ok=True)
        (self.media_path / 'plans' / 'covers').mkdir(parents=True, exist_ok=True)

        # Create real images with non-UUID names
        client_img_path = self.media_path / 'profiles' / 'clients' / '1_my_avatar.jpg'
        with Image.new('RGB', (100, 100), color='blue') as img:
            img.save(client_img_path, 'JPEG')

        cert_img_path = self.media_path / 'certifications' / '1_my_cert.png'
        with Image.new('RGB', (100, 100), color='green') as img:
            img.save(cert_img_path, 'PNG')

        # Create DB records
        self.client_obj = Client.objects.create(
            user=self.user_client,
            profile_photo_url='profiles/clients/1_my_avatar.jpg'
        )
        self.nutri_obj = Nutritionist.objects.create(
            user=self.user_nutri,
            cert_image_url='certifications/1_my_cert.png',
            profile_photo_url='default_nutri.png'
        )
        # Missing file in DB
        self.plan_obj = Plan.objects.create(
            creator=self.nutri_obj,
            title="Test Plan",
            cover_image_url='plans/covers/missing_file.jpg'
        )

    def tearDown(self):
        shutil.rmtree(self.temp_media, ignore_errors=True)

    def test_dry_run_reports_without_modifications(self):
        with override_settings(MEDIA_ROOT=self.temp_media):
            out = io.StringIO()
            call_command('audit_and_sanitize_media', stdout=out)
            output = out.getvalue()

            self.assertIn("MEDIA STORAGE AUDIT REPORT", output)
            self.assertIn("DISTINCT URL PREFIXES IN DATABASE:", output)
            self.assertIn("profiles/clients/", output)
            self.assertIn("certifications/", output)
            self.assertIn("plans/covers/", output)
            self.assertIn("1_my_avatar.jpg", output)
            self.assertIn("plans/covers/missing_file.jpg", output)
            self.assertIn("[DRY RUN]", output)

            # Assert DB records were NOT modified
            self.client_obj.refresh_from_db()
            self.assertEqual(self.client_obj.profile_photo_url, 'profiles/clients/1_my_avatar.jpg')

            # Assert disk files were NOT modified or deleted
            self.assertTrue((self.media_path / 'profiles' / 'clients' / '1_my_avatar.jpg').exists())

    def test_apply_migrates_to_uuid_and_updates_db(self):
        with override_settings(MEDIA_ROOT=self.temp_media):
            out = io.StringIO()
            call_command('audit_and_sanitize_media', '--apply', stdout=out)
            output = out.getvalue()

            self.assertIn("[APPLY COMPLETE]", output)

            # Assert DB records were updated to UUID filenames
            self.client_obj.refresh_from_db()
            self.assertNotEqual(self.client_obj.profile_photo_url, 'profiles/clients/1_my_avatar.jpg')
            self.assertTrue(self.client_obj.profile_photo_url.startswith('profiles/clients/'))
            self.assertTrue(self.client_obj.profile_photo_url.endswith('.jpg'))

            self.nutri_obj.refresh_from_db()
            self.assertNotEqual(self.nutri_obj.cert_image_url, 'certifications/1_my_cert.png')
            self.assertTrue(self.nutri_obj.cert_image_url.startswith('certifications/'))

            # Assert old files on disk were cleaned up and new files exist
            self.assertFalse((self.media_path / 'profiles' / 'clients' / '1_my_avatar.jpg').exists())
            self.assertTrue((self.media_path / self.client_obj.profile_photo_url).exists())
            self.assertTrue((self.media_path / self.nutri_obj.cert_image_url).exists())
