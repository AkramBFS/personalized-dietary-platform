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

        # Create legacy GIF certification
        gif_cert_path = self.media_path / 'certifications' / '2_legacy.gif'
        with Image.new('RGB', (100, 100), color='red') as img:
            img.save(gif_cert_path, 'GIF')

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
        self.user_gif = User.objects.create_user(username="audit_gif", email="g@audit.com", password="pw", role="nutritionist")
        self.nutri_gif = Nutritionist.objects.create(
            user=self.user_gif,
            cert_image_url='certifications/2_legacy.gif',
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

            # Assert legacy GIF was converted to PNG
            self.nutri_gif.refresh_from_db()
            self.assertTrue(self.nutri_gif.cert_image_url.endswith('.png'), f"Expected .png, got {self.nutri_gif.cert_image_url}")
            self.assertTrue((self.media_path / self.nutri_gif.cert_image_url).exists())

            # Assert old files on disk were cleaned up and new files exist
            self.assertFalse((self.media_path / 'profiles' / 'clients' / '1_my_avatar.jpg').exists())
            self.assertTrue((self.media_path / self.client_obj.profile_photo_url).exists())
            self.assertTrue((self.media_path / self.nutri_obj.cert_image_url).exists())

            # Assert backup directory and mapping file were created OUTSIDE MEDIA_ROOT
            parent_dir = self.media_path.parent
            backup_dirs = list(parent_dir.glob('media_backup_*'))
            mapping_files = list(parent_dir.glob('media_migration_mapping_*.json'))
            self.assertTrue(len(backup_dirs) > 0, "Backup directory not created outside MEDIA_ROOT")
            self.assertTrue(len(mapping_files) > 0, "Mapping file not created outside MEDIA_ROOT")

            # Check mapping file content
            import json
            mapping_data = json.loads(mapping_files[0].read_text(encoding='utf-8'))
            self.assertIn("migrations", mapping_data)
            actions = [m['action'] for m in mapping_data['migrations']]
            self.assertIn('convert_gif_to_png', actions)

            # Cleanup test backups
            for bd in backup_dirs:
                shutil.rmtree(bd, ignore_errors=True)
            for mf in mapping_files:
                mf.unlink(missing_ok=True)

    def test_apply_under_restricted_role_nutriplatform_app(self):
        from django.db import connection
        if connection.vendor != 'postgresql':
            self.skipTest("PostgreSQL specific test for SET ROLE nutriplatform_app.")

        with override_settings(MEDIA_ROOT=self.temp_media):
            with connection.cursor() as cursor:
                try:
                    cursor.execute("SET ROLE nutriplatform_app;")
                    out = io.StringIO()
                    call_command('audit_and_sanitize_media', '--apply', stdout=out)
                    self.assertIn("[APPLY COMPLETE]", out.getvalue())
                finally:
                    cursor.execute("RESET ROLE;")

            parent_dir = self.media_path.parent
            for bd in parent_dir.glob('media_backup_*'):
                shutil.rmtree(bd, ignore_errors=True)
            for mf in parent_dir.glob('media_migration_mapping_*.json'):
                mf.unlink(missing_ok=True)

