"""
Release 2 / Session 2a — upload sanitization hardening.

Every test here is written to FAIL against the pre-hardening sanitizer and pass
with the fix (see commit message for the red/green evidence).
"""
import io
import os
import re
import shutil
import struct
import tempfile
import zlib

from django.core.files.storage import default_storage
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from PIL import Image
from rest_framework.exceptions import ValidationError

from utils import upload_security
from utils.upload_security import (
    LEGACY_ALLOWED_FORMATS,
    sanitize_image_bytes,
    validate_and_sanitize_image,
)

UUID_PATH = re.compile(r'^(?P<prefix>[a-z_/]+)/[0-9a-f]{32}\.(jpg|png|webp)$')


def _jpeg_with_exif(size=(40, 20), orientation=6, gps=True) -> bytes:
    img = Image.new('RGB', size, (200, 30, 30))
    exif = Image.Exif()
    exif[0x0112] = orientation                     # Orientation
    exif[0x010F] = 'SecretCameraMaker'             # Make
    if gps:
        gps_ifd = exif.get_ifd(0x8825)
        gps_ifd[1] = 'N'
        gps_ifd[2] = (36.0, 45.0, 30.0)
        gps_ifd[3] = 'E'
        gps_ifd[4] = (3.0, 3.0, 0.0)
    buf = io.BytesIO()
    img.save(buf, format='JPEG', exif=exif)
    return buf.getvalue()


def _png_bytes(size=(30, 30), mode='RGB') -> bytes:
    buf = io.BytesIO()
    Image.new(mode, size, (1, 2, 3) if mode == 'RGB' else 0).save(buf, format='PNG')
    return buf.getvalue()


def _png_header_only(width: int, height: int) -> bytes:
    """A syntactically valid PNG header claiming huge dimensions; tiny on the wire."""
    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 0, 0, 0, 0)
    idat = zlib.compress(b'\x00')
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')


class _TempMediaMixin:
    """Never write test files into the real MEDIA_ROOT."""

    def setUp(self):
        super().setUp()
        self._tmp = tempfile.mkdtemp(prefix='nutri_media_test_')
        self._override = override_settings(MEDIA_ROOT=self._tmp)
        self._override.enable()

    def tearDown(self):
        self._override.disable()
        shutil.rmtree(self._tmp, ignore_errors=True)
        super().tearDown()

    def stored_bytes(self, rel_path: str) -> bytes:
        with default_storage.open(rel_path, 'rb') as fh:
            return fh.read()


class ImageSanitizerHardeningTests(_TempMediaMixin, SimpleTestCase):

    # ── content, not names, decides ────────────────────────────────────────────
    def test_html_disguised_as_png_rejected(self):
        upload = SimpleUploadedFile('evil.png', b'<html><script>alert(1)</script></html>', content_type='image/png')
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        self.assertEqual(os.listdir(self._tmp), [])

    def test_svg_disguised_as_jpeg_rejected(self):
        svg = b'<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'
        upload = SimpleUploadedFile('photo.jpg', svg, content_type='image/jpeg')
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test')

    def test_html_polyglot_appended_to_valid_png_is_destroyed_by_reencode(self):
        payload = b'<script>alert(document.cookie)</script>'
        upload = SimpleUploadedFile('ok.png', _png_bytes() + payload, content_type='image/png')
        path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        stored = self.stored_bytes(path)
        self.assertNotIn(b'<script', stored)
        Image.open(io.BytesIO(stored)).verify()

    def test_client_filename_never_used_in_stored_path(self):
        upload = SimpleUploadedFile('../../etc/passwd<script>.png', _png_bytes(), content_type='image/png')
        path = validate_and_sanitize_image(upload, destination_prefix='profiles/clients')
        self.assertRegex(path, r'^profiles/clients/[0-9a-f]{32}\.png$')
        self.assertNotIn('passwd', path)

    def test_extension_follows_decoded_format_not_client_name(self):
        upload = SimpleUploadedFile('lies.png', _jpeg_with_exif(), content_type='image/png')
        path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        self.assertTrue(path.endswith('.jpg'), path)

    # ── metadata ───────────────────────────────────────────────────────────────
    def test_exif_gps_and_camera_metadata_stripped(self):
        raw = _jpeg_with_exif()
        self.assertIn(b'SecretCameraMaker', raw)          # fixture sanity
        self.assertIn(0x8825, Image.open(io.BytesIO(raw)).getexif())
        upload = SimpleUploadedFile('gps.jpg', raw, content_type='image/jpeg')
        path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        stored = self.stored_bytes(path)
        self.assertNotIn(b'SecretCameraMaker', stored)
        self.assertNotIn(b'Exif', stored)
        out = Image.open(io.BytesIO(stored))
        self.assertEqual(len(out.getexif()), 0)
        self.assertNotIn(0x8825, out.getexif())

    def test_exif_orientation_applied_before_stripping(self):
        upload = SimpleUploadedFile('rot.jpg', _jpeg_with_exif(size=(40, 20), orientation=6), content_type='image/jpeg')
        path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        out = Image.open(io.BytesIO(self.stored_bytes(path)))
        self.assertEqual(out.size, (20, 40))               # rotated, not merely stripped

    def test_xmp_packet_stripped_from_jpeg(self):
        xmp = b'http://ns.adobe.com/xap/1.0/\x00<x:xmpmeta>secret-location</x:xmpmeta>'
        base = _jpeg_with_exif(gps=False, orientation=1)
        app1 = b'\xff\xe1' + struct.pack('>H', len(xmp) + 2) + xmp
        raw = base[:2] + app1 + base[2:]
        self.assertIn(b'secret-location', raw)
        upload = SimpleUploadedFile('xmp.jpg', raw, content_type='image/jpeg')
        path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        self.assertNotIn(b'secret-location', self.stored_bytes(path))

    def test_png_text_chunks_stripped(self):
        img = Image.new('RGB', (20, 20))
        from PIL.PngImagePlugin import PngInfo
        meta = PngInfo()
        meta.add_text('Comment', 'secret-comment')
        buf = io.BytesIO()
        img.save(buf, format='PNG', pnginfo=meta)
        self.assertIn(b'secret-comment', buf.getvalue())
        upload = SimpleUploadedFile('t.png', buf.getvalue(), content_type='image/png')
        path = validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        self.assertNotIn(b'secret-comment', self.stored_bytes(path))

    # ── caps ───────────────────────────────────────────────────────────────────
    def test_pixel_bomb_rejected_from_header_without_decoding(self):
        bomb = _png_header_only(60000, 60000)               # 3.6 gigapixels, ~70 bytes
        self.assertLess(len(bomb), 200)
        upload = SimpleUploadedFile('bomb.png', bomb, content_type='image/png')
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test')
        self.assertEqual(os.listdir(self._tmp), [])

    def test_sanitizer_does_not_mutate_global_pillow_limit(self):
        before = Image.MAX_IMAGE_PIXELS
        with self.assertRaises(ValidationError):
            sanitize_image_bytes(_png_header_only(60000, 60000))
        sanitize_image_bytes(_png_bytes())
        upload_security.validate_and_normalize_meal_image(SimpleUploadedFile('m.png', _png_bytes()))
        self.assertEqual(Image.MAX_IMAGE_PIXELS, before)

    def test_pixel_cap_is_the_ai_normalizer_cap(self):
        with override_settings(AI_IMAGE_MAX_PIXELS=500):
            with self.assertRaises(ValidationError):
                sanitize_image_bytes(_png_bytes(size=(30, 30)))        # 900 px > 500
            sanitize_image_bytes(_png_bytes(size=(20, 20)))            # 400 px ok

    def test_large_image_downscaled_to_max_side(self):
        big = io.BytesIO()
        Image.new('RGB', (3000, 1000), (9, 9, 9)).save(big, format='JPEG')
        result = sanitize_image_bytes(big.getvalue())
        self.assertEqual(max(result.width, result.height), 2048)

    def test_truncated_image_rejected_without_leaking_exception_text(self):
        raw = _png_bytes(size=(200, 200))[:-40]
        with self.assertRaises(ValidationError) as ctx:
            sanitize_image_bytes(raw)
        self.assertNotIn('Traceback', str(ctx.exception.detail))
        self.assertNotIn('PIL', str(ctx.exception.detail))

    def test_byte_cap_enforced_on_stream_not_just_declared_size(self):
        raw = _png_bytes(size=(300, 300))
        upload = SimpleUploadedFile('a.png', raw, content_type='image/png')
        upload.size = 10                                    # lying declared size
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test', max_size_bytes=len(raw) - 1)

    # ── formats ────────────────────────────────────────────────────────────────
    def test_gif_rejected_for_new_uploads(self):
        buf = io.BytesIO()
        Image.new('P', (10, 10)).save(buf, format='GIF')
        upload = SimpleUploadedFile('x.gif', buf.getvalue(), content_type='image/gif')
        with self.assertRaises(ValidationError):
            validate_and_sanitize_image(upload, destination_prefix='profiles/test')

    def test_legacy_gif_converted_to_png_first_frame_only(self):
        frames = [Image.new('P', (12, 12), c) for c in (0, 1, 2)]
        buf = io.BytesIO()
        frames[0].save(buf, format='GIF', save_all=True, append_images=frames[1:])
        result = sanitize_image_bytes(buf.getvalue(), allowed_formats=LEGACY_ALLOWED_FORMATS)
        self.assertEqual(result.format, 'PNG')
        self.assertEqual(result.ext, 'png')
        self.assertEqual(result.source_format, 'GIF')
        self.assertEqual(getattr(Image.open(io.BytesIO(result.data)), 'n_frames', 1), 1)

    def test_tiff_and_bmp_rejected(self):
        for fmt in ('TIFF', 'BMP'):
            buf = io.BytesIO()
            Image.new('RGB', (8, 8)).save(buf, format=fmt)
            with self.assertRaises(ValidationError, msg=fmt):
                sanitize_image_bytes(buf.getvalue())

    def test_real_world_photo_with_xmp_and_icc_is_accepted(self):
        """Dropping signature scanning must not reject legitimate camera files."""
        xmp = b'http://ns.adobe.com/xap/1.0/\x00<?xpacket begin="\xef\xbb\xbf"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF/></x:xmpmeta>'
        base = _jpeg_with_exif(size=(64, 48), orientation=1)
        raw = base[:2] + b'\xff\xe1' + struct.pack('>H', len(xmp) + 2) + xmp + base[2:]
        result = sanitize_image_bytes(raw)
        self.assertEqual(result.format, 'JPEG')
