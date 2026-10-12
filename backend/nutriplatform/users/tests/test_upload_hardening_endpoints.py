"""
Release 2 / Session 2a — upload endpoints, certifications, avatar PATCH, ingestion inventory guard.
"""
import io
import os
import re
from pathlib import Path

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import SimpleTestCase, TestCase
from PIL import Image
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from admin_panel.models import Country, Goal, Specialization
from client.models import Client
from client.views import ClientProfileView
from nutritionist.models import Language, Nutritionist, NutritionistPatient
from users.models import User
from users.serializers import RegisterClientSerializer, RegisterNutritionistSerializer
from users.tests.test_upload_hardening_sanitizer import (
    _TempMediaMixin,
    _jpeg_with_exif,
    _png_bytes,
)
from utils import upload_security
from utils.upload_security import (
    PDF_MAX_PAGES,
    validate_and_sanitize_certification,
)

UUID_RE = r'[0-9a-f]{32}'


def _pdf_bytes(pages: int = 1, js: bool = False, encrypt: bool = False, open_action_dict: bool = False,
               open_destination: bool = False) -> bytes:
    from pypdf import PdfWriter
    from pypdf.generic import ArrayObject, DictionaryObject, NameObject, NumberObject
    w = PdfWriter()
    for _ in range(pages):
        w.add_blank_page(72, 72)
    if js:
        w.add_js('app.alert(1);')
    if open_destination:                                    # benign /OpenAction [page /Fit] (LaTeX/hyperref style)
        w._root_object[NameObject('/OpenAction')] = ArrayObject(
            [w.pages[0].indirect_reference, NameObject('/Fit')]
        )
    if open_action_dict:                                    # /OpenAction << /S /JavaScript ... >>
        act = DictionaryObject({NameObject('/S'): NameObject('/URI')})
        w._root_object[NameObject('/OpenAction')] = w._add_object(act)
    if encrypt:
        w.encrypt('pw')
    buf = io.BytesIO()
    w.write(buf)
    return buf.getvalue()


class CertificationUploadTests(_TempMediaMixin, SimpleTestCase):

    def _up(self, name, data, ctype='application/pdf'):
        return SimpleUploadedFile(name, data, content_type=ctype)

    def test_valid_pdf_accepted_stored_unmodified_under_random_name(self):
        raw = _pdf_bytes()
        path = validate_and_sanitize_certification(self._up('../../my cert.pdf', raw))
        self.assertRegex(path, rf'^certifications/{UUID_RE}\.pdf$')
        self.assertEqual(self.stored_bytes(path), raw)

    def test_benign_open_destination_pdf_accepted(self):
        path = validate_and_sanitize_certification(self._up('c.pdf', _pdf_bytes(open_destination=True)))
        self.assertTrue(path.endswith('.pdf'))

    def test_pdf_with_javascript_rejected(self):
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', _pdf_bytes(js=True)))

    def test_pdf_with_hex_escaped_name_rejected(self):
        raw = _pdf_bytes().replace(b'/Type', b'/Ty#70e', 1)
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', raw))

    def test_pdf_with_open_action_dict_rejected(self):
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', _pdf_bytes(open_action_dict=True)))

    def test_encrypted_pdf_rejected(self):
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', _pdf_bytes(encrypt=True)))

    def test_pdf_page_cap_enforced(self):
        validate_and_sanitize_certification(self._up('c.pdf', _pdf_bytes(pages=PDF_MAX_PAGES)))
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', _pdf_bytes(pages=PDF_MAX_PAGES + 1)))

    def test_pdf_header_must_be_at_offset_zero(self):
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', b'<html>x</html>' + _pdf_bytes()))
        # leading junk makes it a non-PDF: falls to the image path and is rejected there
        self.assertEqual(os.listdir(self._tmp), [])

    def test_truncated_pdf_without_eof_rejected(self):
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', _pdf_bytes()[:-30].replace(b'%%EOF', b'')))

    def test_html_renamed_pdf_rejected(self):
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', b'<html><script>1</script></html>'))

    def test_svg_certification_rejected(self):
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(
                self._up('c.svg', b'<svg xmlns="http://www.w3.org/2000/svg"/>', 'image/svg+xml'))

    def test_image_certification_is_reencoded_and_exif_stripped(self):
        raw = _jpeg_with_exif()
        path = validate_and_sanitize_certification(self._up('scan.PDF', raw, 'application/pdf'))
        self.assertRegex(path, rf'^certifications/{UUID_RE}\.jpg$')
        self.assertNotIn(b'SecretCameraMaker', self.stored_bytes(path))

    def test_gif_certification_rejected_for_new_uploads(self):
        buf = io.BytesIO()
        Image.new('P', (10, 10)).save(buf, format='GIF')
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.gif', buf.getvalue(), 'image/gif'))

    def test_certification_size_cap_is_ten_megabytes(self):
        self.assertEqual(upload_security.MAX_UPLOAD_SIZE_CERT, 10 * 1024 * 1024)
        big = b'%PDF-1.4\n' + b'0' * (10 * 1024 * 1024) + b'\n%%EOF'
        with self.assertRaises(ValidationError):
            validate_and_sanitize_certification(self._up('c.pdf', big))


class RegistrationUploadTests(_TempMediaMixin, TestCase):

    def setUp(self):
        super().setUp()
        self.country = Country.objects.create(name='Algeria')
        self.goal = Goal.objects.create(name='Weight Loss')
        self.spec = Specialization.objects.create(name='Sports')
        self.lang = Language.objects.create(name='English')

    def _client_data(self, **extra):
        data = dict(username='reg_client', email='reg_client@test.com', password='StrongPass123!',
                    age=30, weight=70, height=170, gender='female',
                    country_id=self.country.id, goal_id=self.goal.id)
        data.update(extra)
        return data

    def _nutri_data(self, **extra):
        data = dict(username='reg_nutri', email='reg_nutri@test.com', password='StrongPass123!',
                    country_id=self.country.id, specialization_id=self.spec.id, years_experience=3,
                    consultation_price=40, certification_ref='REF-1', language_ids=[self.lang.id])
        data.update(extra)
        return data

    def _save(self, serializer_cls, data):
        ser = serializer_cls(data=data)
        self.assertTrue(ser.is_valid(), ser.errors)
        return ser.save()

    def test_client_registration_photo_gets_server_name_and_polyglot_is_destroyed(self):
        photo = SimpleUploadedFile('../../Me <3>.png', _png_bytes() + b'<script>alert(1)</script>',
                                   content_type='image/png')
        user, client = self._save(RegisterClientSerializer, self._client_data(profile_photo=photo))
        self.assertRegex(client.profile_photo_url, rf'^profiles/clients/{UUID_RE}\.png$')
        self.assertNotIn(b'<script', self.stored_bytes(client.profile_photo_url))

    def test_client_registration_photo_exif_gps_stripped(self):
        photo = SimpleUploadedFile('a.jpg', _jpeg_with_exif(), content_type='image/jpeg')
        _, client = self._save(RegisterClientSerializer, self._client_data(profile_photo=photo))
        self.assertNotIn(b'SecretCameraMaker', self.stored_bytes(client.profile_photo_url))

    def test_client_registration_invalid_photo_is_a_field_error_and_writes_nothing(self):
        photo = SimpleUploadedFile('x.png', b'<html></html>', content_type='image/png')
        ser = RegisterClientSerializer(data=self._client_data(profile_photo=photo))
        self.assertFalse(ser.is_valid())
        self.assertIn('profile_photo', ser.errors)
        self.assertEqual(os.listdir(self._tmp), [])
        self.assertFalse(User.objects.filter(username='reg_client').exists())

    def test_nutritionist_registration_accepts_pdf_certification(self):
        raw = _pdf_bytes()
        cert = SimpleUploadedFile('Dr Who License.pdf', raw, content_type='application/pdf')
        user, nutri = self._save(RegisterNutritionistSerializer, self._nutri_data(cert_image=cert))
        self.assertRegex(nutri.cert_image_url, rf'^certifications/{UUID_RE}\.pdf$')
        self.assertEqual(self.stored_bytes(nutri.cert_image_url), raw)
        self.assertNotIn(str(user.id) + '_', nutri.cert_image_url)

    def test_nutritionist_registration_photo_and_image_cert_sanitized(self):
        cert = SimpleUploadedFile('c.jpg', _jpeg_with_exif(), content_type='image/jpeg')
        photo = SimpleUploadedFile('p.jpg', _jpeg_with_exif(), content_type='image/jpeg')
        _, nutri = self._save(RegisterNutritionistSerializer, self._nutri_data(cert_image=cert, profile_photo=photo))
        self.assertRegex(nutri.cert_image_url, rf'^certifications/{UUID_RE}\.jpg$')
        self.assertRegex(nutri.profile_photo_url, rf'^profiles/nutritionists/{UUID_RE}\.jpg$')
        for p in (nutri.cert_image_url, nutri.profile_photo_url):
            self.assertNotIn(b'SecretCameraMaker', self.stored_bytes(p))

    def test_nutritionist_registration_rejects_js_pdf_svg_and_html_certifications(self):
        bad = {
            'js.pdf': (_pdf_bytes(js=True), 'application/pdf'),
            'x.svg': (b'<svg xmlns="http://www.w3.org/2000/svg"/>', 'image/svg+xml'),
            'x.pdf': (b'<html><script>1</script></html>', 'application/pdf'),
        }
        for name, (data, ctype) in bad.items():
            ser = RegisterNutritionistSerializer(
                data=self._nutri_data(username=f'n_{name}', email=f'{name}@t.com',
                                      cert_image=SimpleUploadedFile(name, data, content_type=ctype)))
            self.assertFalse(ser.is_valid(), name)
            self.assertIn('cert_image', ser.errors, name)
        self.assertEqual(os.listdir(self._tmp), [])

    def test_failed_registration_cleans_up_stored_files(self):
        """If the DB work fails after files were stored, the stored files are removed."""
        from unittest import mock
        cert = SimpleUploadedFile('c.pdf', _pdf_bytes(), content_type='application/pdf')
        ser = RegisterNutritionistSerializer(data=self._nutri_data(cert_image=cert))
        self.assertTrue(ser.is_valid(), ser.errors)
        with mock.patch('users.serializers.Nutritionist.objects.create', side_effect=RuntimeError('db down')):
            with self.assertRaises(RuntimeError):
                ser.save()
        leftovers = [f for _, _, files in os.walk(self._tmp) for f in files]
        self.assertEqual(leftovers, [])


class ClientAvatarPatchTests(_TempMediaMixin, TestCase):

    def setUp(self):
        super().setUp()
        country = Country.objects.create(name='Algeria')
        goal = Goal.objects.create(name='Weight Loss')
        self.user = User.objects.create_user(username='av_client', email='av@test.com',
                                             password='StrongPass123!', role='client')
        self.client_profile = Client.objects.create(user=self.user, country=country, goal=goal,
                                                    age=30, weight=70, height=170, gender='female')
        self.factory = APIRequestFactory()

    def _patch(self, data):
        req = self.factory.patch('/api/v1/client/profile/', data, format='multipart')
        force_authenticate(req, user=self.user)
        return ClientProfileView.as_view()(req)

    def test_avatar_upload_is_stored_sanitized_and_url_updated(self):
        photo = SimpleUploadedFile('../selfie.jpg', _jpeg_with_exif(), content_type='image/jpeg')
        resp = self._patch({'profile_photo': photo})
        self.assertEqual(resp.status_code, 200, getattr(resp, 'data', None))
        self.client_profile.refresh_from_db()
        self.assertRegex(self.client_profile.profile_photo_url, rf'^profiles/clients/{UUID_RE}\.jpg$')
        self.assertEqual(resp.data['data']['profile_photo_url'], self.client_profile.profile_photo_url)
        self.assertNotIn(b'SecretCameraMaker', self.stored_bytes(self.client_profile.profile_photo_url))

    def test_avatar_upload_can_be_combined_with_field_updates(self):
        photo = SimpleUploadedFile('a.png', _png_bytes(), content_type='image/png')
        resp = self._patch({'profile_photo': photo, 'weight': 72.5})
        self.assertEqual(resp.status_code, 200)
        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.weight, 72.5)
        self.assertTrue(self.client_profile.profile_photo_url.startswith('profiles/clients/'))

    def test_invalid_avatar_is_400_and_leaves_profile_untouched(self):
        before = self.client_profile.profile_photo_url
        bad = SimpleUploadedFile('a.png', b'<svg onload=alert(1)>', content_type='image/png')
        resp = self._patch({'profile_photo': bad, 'weight': 99})
        self.assertEqual(resp.status_code, 400)
        self.client_profile.refresh_from_db()
        self.assertEqual(self.client_profile.profile_photo_url, before)
        self.assertEqual(self.client_profile.weight, 70)          # whole request rejected
        self.assertEqual(os.listdir(self._tmp), [])

    def test_profile_photo_url_cannot_be_set_by_client_json(self):
        """Mass-assignment guard: a client must not be able to point their avatar at private files."""
        before = self.client_profile.profile_photo_url
        for hostile in ('certifications/16_chat.PNG', 'ai_logs/original/4/x.jpg', '../../etc/passwd'):
            resp = self._patch({'profile_photo_url': hostile})
            self.assertEqual(resp.status_code, 200)
            self.client_profile.refresh_from_db()
            self.assertEqual(self.client_profile.profile_photo_url, before, hostile)


class IngestionInventoryGuardTests(SimpleTestCase):
    """
    Static guard: raw storage writes and request.FILES access may only happen in the audited places.
    A new upload path that bypasses utils/upload_security.py fails this test.
    """
    BACKEND = Path(settings.BASE_DIR)
    SAVE_ALLOWED = {
        'utils/upload_security.py',        # the shared sanitizer (store_bytes)
        'client/ai_processor.py',          # server-generated AI overlay, after normalizer
        'client/views.py',                 # AI meal image, after validate_and_normalize_meal_image
    }
    FILES_ALLOWED = {
        'client/views.py',                 # AI submit + avatar PATCH -> sanitizer
        'community/views.py',
        'nutritionist/views.py',
    }

    def _sources(self):
        for path in self.BACKEND.rglob('*.py'):
            rel = path.relative_to(self.BACKEND).as_posix()
            if any(part in rel for part in ('/tests/', 'tests.py', '/migrations/', 'venv/', 'site-packages')):
                continue
            yield rel, path.read_text(encoding='utf-8', errors='ignore')

    def test_default_storage_save_only_in_audited_modules(self):
        offenders = [rel for rel, src in self._sources()
                     if 'default_storage.save(' in src and rel not in self.SAVE_ALLOWED]
        self.assertEqual(offenders, [])

    def test_request_files_only_in_audited_views(self):
        offenders = [rel for rel, src in self._sources()
                     if 'request.FILES' in src and rel not in self.FILES_ALLOWED]
        self.assertEqual(offenders, [])

    def test_no_user_supplied_filename_interpolated_into_storage_paths(self):
        offenders = [rel for rel, src in self._sources()
                     if re.search(r"default_storage\.save\(\s*f?['\"][^'\"]*\{[^}]*\.name", src)]
        self.assertEqual(offenders, [])


class RestrictedRoleMediaAccessRLSTests(TestCase):
    """
    Verifies that avatar and certification access queries run securely under
    the restricted role 'nutriplatform_app' (NOBYPASSRLS) without granting staff privileges.
    """
    def setUp(self):
        self.user_client1 = User.objects.create_user(username="rls_c1", email="c1@rls.com", password="pw", role="client")
        self.client1 = Client.objects.create(user=self.user_client1, profile_photo_url="profiles/clients/c1.jpg")

        self.user_client2 = User.objects.create_user(username="rls_c2", email="c2@rls.com", password="pw", role="client")
        self.client2 = Client.objects.create(user=self.user_client2, profile_photo_url="profiles/clients/c2.jpg")

        self.user_nutri1 = User.objects.create_user(username="rls_n1", email="n1@rls.com", password="pw", role="nutritionist")
        self.nutri1 = Nutritionist.objects.create(user=self.user_nutri1, cert_image_url="certifications/n1.pdf")

        self.user_nutri2 = User.objects.create_user(username="rls_n2", email="n2@rls.com", password="pw", role="nutritionist")
        self.nutri2 = Nutritionist.objects.create(user=self.user_nutri2, cert_image_url="certifications/n2.pdf")

        # Assign nutri1 to client1
        NutritionistPatient.objects.create(nutritionist=self.nutri1, client=self.client1, patient_type="from_custom_plan")

    def test_restricted_role_avatar_access_isolation(self):
        """
        Under SET ROLE nutriplatform_app:
        1. Client can verify ownership of own avatar row under RLS.
        2. Client cannot see or verify other client's avatar row under RLS.
        3. Assigned nutritionist can verify access to assigned client's avatar.
        4. Unassigned nutritionist cannot verify access to client's avatar.
        """
        if connection.vendor != 'postgresql':
            self.skipTest("PostgreSQL specific test for SET ROLE nutriplatform_app.")

        with connection.cursor() as cursor:
            try:
                cursor.execute("SET ROLE nutriplatform_app;")

                # 1. Client 1 context: can verify own avatar
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_client1.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                self.assertTrue(Client.objects.filter(user=self.user_client1, profile_photo_url="profiles/clients/c1.jpg").exists())
                # Cannot verify client 2's avatar
                self.assertFalse(Client.objects.filter(user=self.user_client1, profile_photo_url="profiles/clients/c2.jpg").exists())
                self.assertFalse(Client.objects.filter(profile_photo_url="profiles/clients/c2.jpg").exists())

                # 2. Assigned nutritionist context: can access assigned client's avatar
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_nutri1.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                self.assertTrue(Client.objects.filter(profile_photo_url="profiles/clients/c1.jpg").exists())
                # Cannot access unassigned client 2's avatar
                self.assertFalse(Client.objects.filter(profile_photo_url="profiles/clients/c2.jpg").exists())

                # 3. Unassigned nutritionist context: cannot access client 1's avatar
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_nutri2.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                self.assertFalse(Client.objects.filter(profile_photo_url="profiles/clients/c1.jpg").exists())
            finally:
                cursor.execute("RESET ROLE;")

    def test_restricted_role_certification_access_isolation(self):
        """
        Under SET ROLE nutriplatform_app:
        1. Nutritionist can verify ownership of own certification.
        2. Nutritionist cannot claim ownership of another nutritionist's certification.
        """
        if connection.vendor != 'postgresql':
            self.skipTest("PostgreSQL specific test for SET ROLE nutriplatform_app.")

        with connection.cursor() as cursor:
            try:
                cursor.execute("SET ROLE nutriplatform_app;")

                # Nutritionist 1 context
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_nutri1.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                self.assertTrue(Nutritionist.objects.filter(user=self.user_nutri1, cert_image_url="certifications/n1.pdf").exists())
                self.assertFalse(Nutritionist.objects.filter(user=self.user_nutri1, cert_image_url="certifications/n2.pdf").exists())

                # Client context cannot claim certification
                cursor.execute("SET LOCAL app.current_user_id = %s;", [str(self.user_client1.id)])
                cursor.execute("SET LOCAL app.is_staff = 'false';")
                self.assertFalse(Nutritionist.objects.filter(user=self.user_client1, cert_image_url="certifications/n1.pdf").exists())
            finally:
                cursor.execute("RESET ROLE;")

