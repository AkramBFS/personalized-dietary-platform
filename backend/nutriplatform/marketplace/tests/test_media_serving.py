import io
import os
import shutil
import tempfile
from pathlib import Path
from PIL import Image

from django.conf import settings
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from rest_framework import status

from client.models import Client
from nutritionist.models import Nutritionist, NutritionistPatient
from marketplace.models import Plan
from community.models import Post
from users.models import User


class AuthoritativeMediaServeViewTests(TestCase):
    def setUp(self):
        self.temp_media = tempfile.mkdtemp(prefix='media_serve_test_')
        self.media_path = Path(self.temp_media)
        self.override = override_settings(MEDIA_ROOT=self.temp_media)
        self.override.enable()

        # Create directories
        (self.media_path / 'profiles' / 'nutritionists').mkdir(parents=True, exist_ok=True)
        (self.media_path / 'profiles' / 'clients').mkdir(parents=True, exist_ok=True)
        (self.media_path / 'plans' / 'covers').mkdir(parents=True, exist_ok=True)
        (self.media_path / 'posts').mkdir(parents=True, exist_ok=True)
        (self.media_path / 'certifications').mkdir(parents=True, exist_ok=True)
        (self.media_path / 'ai_logs').mkdir(parents=True, exist_ok=True)

        # Users
        self.user_client1 = User.objects.create_user(username="client1", email="c1@m.com", password="pw", role="client")
        self.user_client2 = User.objects.create_user(username="client2", email="c2@m.com", password="pw", role="client")
        self.user_nutri1 = User.objects.create_user(username="nutri1", email="n1@m.com", password="pw", role="nutritionist")
        self.user_nutri2 = User.objects.create_user(username="nutri2", email="n2@m.com", password="pw", role="nutritionist")
        self.user_staff = User.objects.create_user(username="staff", email="s@m.com", password="pw", role="admin", is_staff=True)

        # Files on disk
        self._write_img(self.media_path / 'default_avatar.png')
        self._write_img(self.media_path / 'profiles' / 'nutritionists' / 'nutri1.jpg')
        self._write_img(self.media_path / 'profiles' / 'clients' / 'c1_avatar.jpg')
        self._write_img(self.media_path / 'profiles' / 'clients' / 'c2_avatar.jpg')
        self._write_img(self.media_path / 'posts' / 'post1.jpg')
        self._write_img(self.media_path / 'plans' / 'covers' / 'public_plan.jpg')
        self._write_img(self.media_path / 'plans' / 'covers' / 'custom_plan.jpg')
        self._write_pdf(self.media_path / 'certifications' / 'nutri1_cert.pdf')
        self._write_img(self.media_path / 'ai_logs' / 'secret_meal.jpg')

        # DB Records
        self.client1 = Client.objects.create(user=self.user_client1, profile_photo_url='profiles/clients/c1_avatar.jpg')
        self.client2 = Client.objects.create(user=self.user_client2, profile_photo_url='profiles/clients/c2_avatar.jpg')
        self.nutri1 = Nutritionist.objects.create(
            user=self.user_nutri1,
            profile_photo_url='profiles/nutritionists/nutri1.jpg',
            cert_image_url='certifications/nutri1_cert.pdf'
        )
        self.nutri2 = Nutritionist.objects.create(user=self.user_nutri2, cert_image_url='certifications/n2.pdf')

        # Assigned relationship
        NutritionistPatient.objects.create(nutritionist=self.nutri1, client=self.client1, patient_type="from_custom_plan")

        # Plans
        self.public_plan = Plan.objects.create(
            creator=self.nutri1,
            title="Public Plan",
            plan_type="public-predefined",
            status="approved",
            cover_image_url="plans/covers/public_plan.jpg"
        )
        self.custom_plan = Plan.objects.create(
            creator=self.nutri1,
            target_client=self.client1,
            title="Custom Plan",
            plan_type="private-custom",
            status="approved",
            cover_image_url="plans/covers/custom_plan.jpg"
        )

        self.api = APIClient()

    def tearDown(self):
        self.override.disable()
        shutil.rmtree(self.temp_media, ignore_errors=True)

    def _write_img(self, path: Path):
        with Image.new('RGB', (10, 10), color='blue') as img:
            img.save(path, format='JPEG' if path.suffix in ('.jpg', '.jpeg') else 'PNG')

    def _write_pdf(self, path: Path):
        path.write_bytes(b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF')

    # ── Tier 1 & 2: Public Assets ─────────────────────────────────────────────
    def test_default_public_assets_served_without_auth(self):
        resp = self.api.get('/media/default_avatar.png')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['X-Content-Type-Options'], 'nosniff')
        self.assertIn('sandbox', resp['Content-Security-Policy'])
        self.assertIn('public', resp['Cache-Control'])

    def test_nutritionist_photo_served_publicly(self):
        resp = self.api.get('/media/profiles/nutritionists/nutri1.jpg')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'image/jpeg')
        self.assertIn('public', resp['Cache-Control'])

    # ── Tier 3: Client Avatars ────────────────────────────────────────────────
    def test_client_avatar_requires_auth(self):
        resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
        self.assertEqual(resp.status_code, 401)

    def test_client_avatar_owner_access_succeeds(self):
        self.api.force_authenticate(user=self.user_client1)
        resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Disposition'], 'inline')
        self.assertIn('private', resp['Cache-Control'])

    def test_client_avatar_assigned_nutritionist_access_succeeds(self):
        self.api.force_authenticate(user=self.user_nutri1)
        resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
        self.assertEqual(resp.status_code, 200)

    def test_client_avatar_unassigned_nutritionist_gets_403(self):
        self.api.force_authenticate(user=self.user_nutri2)
        resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
        self.assertEqual(resp.status_code, 403)

    def test_client_avatar_other_client_gets_403(self):
        self.api.force_authenticate(user=self.user_client2)
        resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
        self.assertEqual(resp.status_code, 403)

    def test_client_avatar_staff_access_succeeds(self):
        self.api.force_authenticate(user=self.user_staff)
        resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
        self.assertEqual(resp.status_code, 200)

    # ── Tier 4: Plan Covers ───────────────────────────────────────────────────
    def test_public_plan_cover_served_unauthenticated(self):
        resp = self.api.get('/media/plans/covers/public_plan.jpg')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('public', resp['Cache-Control'])

    def test_custom_plan_cover_requires_auth(self):
        resp = self.api.get('/media/plans/covers/custom_plan.jpg')
        self.assertEqual(resp.status_code, 401)

    def test_custom_plan_cover_allowed_for_target_client(self):
        self.api.force_authenticate(user=self.user_client1)
        resp = self.api.get('/media/plans/covers/custom_plan.jpg')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('private', resp['Cache-Control'])
        self.assertEqual(resp['Content-Disposition'], 'inline')

    def test_custom_plan_cover_allowed_for_assigned_nutritionist(self):
        self.api.force_authenticate(user=self.user_nutri1)
        resp = self.api.get('/media/plans/covers/custom_plan.jpg')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('private', resp['Cache-Control'])

    def test_custom_plan_cover_allowed_for_staff(self):
        self.api.force_authenticate(user=self.user_staff)
        resp = self.api.get('/media/plans/covers/custom_plan.jpg')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('private', resp['Cache-Control'])

    def test_custom_plan_cover_forbidden_for_other_client(self):
        self.api.force_authenticate(user=self.user_client2)
        resp = self.api.get('/media/plans/covers/custom_plan.jpg')
        self.assertEqual(resp.status_code, 403)

    # ── Tier 5: Community Posts ───────────────────────────────────────────────
    def test_post_image_requires_auth(self):
        resp = self.api.get('/media/posts/post1.jpg')
        self.assertEqual(resp.status_code, 401)

    def test_post_image_served_to_authenticated_user(self):
        self.api.force_authenticate(user=self.user_client2)
        resp = self.api.get('/media/posts/post1.jpg')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('private', resp['Cache-Control'])
        self.assertEqual(resp['Content-Disposition'], 'inline')

    # ── Tier 6: Certifications ────────────────────────────────────────────────
    def test_certification_requires_auth(self):
        resp = self.api.get('/media/certifications/nutri1_cert.pdf')
        self.assertEqual(resp.status_code, 401)

    def test_certification_served_as_attachment_to_owner(self):
        self.api.force_authenticate(user=self.user_nutri1)
        resp = self.api.get('/media/certifications/nutri1_cert.pdf')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertEqual(resp['Content-Disposition'], 'attachment; filename="certification.pdf"')
        self.assertIn('private', resp['Cache-Control'])

    def test_certification_served_as_attachment_to_staff(self):
        self.api.force_authenticate(user=self.user_staff)
        resp = self.api.get('/media/certifications/nutri1_cert.pdf')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')
        self.assertEqual(resp['Content-Disposition'], 'attachment; filename="certification.pdf"')
        self.assertIn('private', resp['Cache-Control'])

    def test_certification_forbidden_to_other_nutritionist_and_client(self):
        self.api.force_authenticate(user=self.user_nutri2)
        self.assertEqual(self.api.get('/media/certifications/nutri1_cert.pdf').status_code, 403)
        self.api.force_authenticate(user=self.user_client1)
        self.assertEqual(self.api.get('/media/certifications/nutri1_cert.pdf').status_code, 403)

    # ── Hard Blocks & Traversal Rejection ─────────────────────────────────────
    def test_ai_logs_hard_blocked_in_both_debug_modes(self):
        for debug_val in (True, False):
            with override_settings(DEBUG=debug_val):
                self.api.force_authenticate(user=self.user_staff)
                resp = self.api.get('/media/ai_logs/secret_meal.jpg')
                self.assertEqual(resp.status_code, 404, f"Failed on DEBUG={debug_val}")

    def test_certifications_never_served_publicly_in_both_debug_modes(self):
        for debug_val in (True, False):
            with override_settings(DEBUG=debug_val):
                self.api.logout()
                resp = self.api.get('/media/certifications/nutri1_cert.pdf')
                self.assertEqual(resp.status_code, 401, f"Failed on DEBUG={debug_val}")

    def test_path_traversal_attempts_rejected(self):
        traversals = [
            '/media/..%2f..%2fetc/passwd',
            '/media/%2e%2e/%2e%2e/file.jpg',
            '/media/%5c..%5cfile.jpg',
            '/media/profiles/nutritionists/..\\..\\c1_avatar.jpg',
            '/media/profiles/nutritionists/test%00.jpg',
            '/media/C:/Windows/System32/cmd.exe',
            '/media///etc/passwd',
        ]
        for path in traversals:
            resp = self.api.get(path)
            self.assertIn(resp.status_code, (400, 404), f"Path {path} did not reject with 400/404")

    def test_symlink_rejection(self):
        outside_file = Path(tempfile.gettempdir()) / 'outside_secret.jpg'
        outside_file.write_bytes(b'secret')
        symlink_path = self.media_path / 'profiles' / 'nutritionists' / 'symlink_nutri.jpg'
        try:
            os.symlink(outside_file, symlink_path)
            resp = self.api.get('/media/profiles/nutritionists/symlink_nutri.jpg')
            self.assertEqual(resp.status_code, 400)
        except OSError:
            # On Windows without SeCreateSymbolicLinkPrivilege, symlink creation may raise OSError
            pass
        finally:
            if symlink_path.is_symlink() or symlink_path.exists():
                symlink_path.unlink(missing_ok=True)
            outside_file.unlink(missing_ok=True)

    def test_unsupported_extensions_rejected(self):
        bad_files = ['bad.exe', 'script.sh', 'index.php', 'vector.svg', 'page.html']
        for bf in bad_files:
            target = self.media_path / bf
            target.write_bytes(b'fake content')
            resp = self.api.get(f'/media/{bf}')
            self.assertEqual(resp.status_code, 404, f"Extension {bf} was not rejected with 404")
            target.unlink(missing_ok=True)

    # ── Restricted Role Verification under nutriplatform_app ─────────────────
    def test_media_serve_under_restricted_role(self):
        if connection.vendor != 'postgresql':
            self.skipTest("PostgreSQL specific test for SET ROLE nutriplatform_app.")

        with connection.cursor() as cursor:
            try:
                cursor.execute("SET ROLE nutriplatform_app;")
                # Test avatar check for owner -> 200
                self.api.force_authenticate(user=self.user_client1)
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_client1.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
                self.assertEqual(resp.status_code, 200)

                # Test avatar check for unassigned client 2 -> 403
                self.api.force_authenticate(user=self.user_client2)
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_client2.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                resp = self.api.get('/media/profiles/clients/c1_avatar.jpg')
                self.assertEqual(resp.status_code, 403)

                # Test certification check for owner -> 200
                self.api.force_authenticate(user=self.user_nutri1)
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_nutri1.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                resp = self.api.get('/media/certifications/nutri1_cert.pdf')
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(resp['Content-Disposition'], 'attachment; filename="certification.pdf"')

                # Test certification check for other nutritionist 2 -> 403
                self.api.force_authenticate(user=self.user_nutri2)
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_nutri2.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                resp = self.api.get('/media/certifications/nutri1_cert.pdf')
                self.assertEqual(resp.status_code, 403)
            finally:
                cursor.execute("RESET ROLE;")

