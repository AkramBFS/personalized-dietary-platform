import io
import logging
import re
import uuid
from dataclasses import dataclass
from typing import Tuple, Dict, Any, Optional
from PIL import Image, ImageOps, UnidentifiedImageError
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

MAX_UPLOAD_SIZE_GENERAL = 5 * 1024 * 1024   # 5 MB
MAX_UPLOAD_SIZE_AI = 10 * 1024 * 1024       # 10 MB
MAX_UPLOAD_SIZE_CERT = 10 * 1024 * 1024     # 10 MB (certification PDF or image)

# Formats accepted from users. Detection is by Pillow's decoder (content), never by
# file name or client-declared content type.
DEFAULT_ALLOWED_FORMATS = ('JPEG', 'PNG', 'WEBP')
# GIF is accepted only by the legacy re-encode/audit tooling (converted to PNG).
LEGACY_ALLOWED_FORMATS = DEFAULT_ALLOWED_FORMATS + ('GIF',)

_OUTPUT_FORMAT = {'JPEG': 'JPEG', 'PNG': 'PNG', 'WEBP': 'WEBP', 'GIF': 'PNG'}
_OUTPUT_EXT = {'JPEG': 'jpg', 'PNG': 'png', 'WEBP': 'webp'}

# Retained for callers that import it; the sanitizer itself no longer uses it.
ALLOWED_MIME_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}


def _pixel_cap() -> int:
    """One pixel ceiling for all image ingestion, shared with the AI normalizer."""
    return int(getattr(settings, 'AI_IMAGE_MAX_PIXELS', 40_000_000))


def _max_side() -> int:
    return int(getattr(settings, 'UPLOAD_IMAGE_MAX_SIDE', 2048))



def validate_request_content_length(request, max_bytes: Optional[int] = None) -> None:
    """
    Fast pre-body validation on HTTP Content-Length header to prevent denial-of-service
    from massive multipart uploads before parsing body.
    """
    limit = max_bytes or getattr(settings, 'AI_IMAGE_MAX_BYTES', MAX_UPLOAD_SIZE_AI)
    # Allow 64KB overhead for multipart boundaries and form fields
    max_allowed = limit + (64 * 1024)

    content_length = request.META.get('CONTENT_LENGTH')
    if content_length:
        try:
            cl = int(content_length)
            if cl > max_allowed:
                raise ValidationError({"file": f"Upload payload size ({cl} bytes) exceeds limit of {limit} bytes."})
        except (ValueError, TypeError):
            pass


@dataclass(frozen=True)
class SanitizedImage:
    data: bytes
    ext: str
    format: str
    width: int
    height: int
    source_format: str


def _reject(field: str, message: str):
    raise ValidationError({field: message})


def sanitize_image_bytes(
    raw: bytes,
    *,
    allowed_formats: tuple = DEFAULT_ALLOWED_FORMATS,
    max_pixels: Optional[int] = None,
    max_side: Optional[int] = None,
    field: str = 'file',
) -> SanitizedImage:
    """
    Decode untrusted image bytes and rebuild a brand-new, metadata-free image.

    Re-encoding is the defence; no signature scanning is performed. Steps:
      1. Pillow decodes only the allowed formats (``formats=`` restricts the decoders).
      2. Dimensions are read from the header and checked against the pixel cap
         BEFORE any pixel data is decoded. ``Image.MAX_IMAGE_PIXELS`` is never touched.
      3. First frame only (animated GIF/WebP flattened).
      4. ``exif_transpose`` applies the orientation, then every piece of metadata
         (EXIF/GPS, XMP, ICC, text chunks) is dropped by copying raw pixels into a fresh image.
      5. Downscale to ``max_side`` and re-encode. GIF is converted to PNG.
    """
    max_pixels = int(max_pixels or _pixel_cap())
    max_side = int(max_side or _max_side())
    allowed = tuple(f.upper() for f in allowed_formats)

    if not raw:
        _reject(field, 'Uploaded image file is empty.')

    try:
        img = Image.open(io.BytesIO(raw), formats=list(allowed))
    except Exception:
        # Covers unidentified formats (SVG/HTML/PDF/...), Pillow's own bomb guard, truncated headers.
        _reject(field, 'Invalid or unsupported image. Only JPEG, PNG, and WebP images are accepted.')

    try:
        source_format = (img.format or '').upper()
        width, height = img.size
        if width < 1 or height < 1 or (width * height) > max_pixels:
            _reject(field, f'Image dimensions exceed the allowed limit of {max_pixels} pixels.')

        if source_format == 'JPEG':
            # Let libjpeg decode at reduced scale when the source is far larger than we keep.
            img.draft(None, (max_side, max_side))

        img.seek(0)
        img.load()
        img = ImageOps.exif_transpose(img)

        if max(img.size) > max_side:
            img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

        out_format = _OUTPUT_FORMAT[source_format]
        has_alpha = img.mode in ('RGBA', 'LA', 'PA') or (img.mode == 'P' and 'transparency' in img.info)
        if out_format == 'JPEG':
            target_mode = img.mode if img.mode in ('RGB', 'L') else 'RGB'
        else:
            target_mode = 'RGBA' if has_alpha else (img.mode if img.mode in ('RGB', 'L') else 'RGB')
        if img.mode != target_mode:
            img = img.convert(target_mode)

        # Fresh image from raw pixels: nothing from the original container survives.
        clean = Image.frombytes(img.mode, img.size, img.tobytes())
        save_kwargs = {'JPEG': {'quality': 85, 'optimize': True},
                       'PNG': {'optimize': True},
                       'WEBP': {'quality': 85}}[out_format]
        buf = io.BytesIO()
        clean.save(buf, format=out_format, **save_kwargs)
        return SanitizedImage(
            data=buf.getvalue(),
            ext=_OUTPUT_EXT[out_format],
            format=out_format,
            width=clean.width,
            height=clean.height,
            source_format=source_format,
        )
    except ValidationError:
        raise
    except Exception as exc:
        logger.warning('Image sanitization failed: %s', type(exc).__name__)
        _reject(field, 'The image could not be processed. It may be corrupted.')
    finally:
        try:
            img.close()
        except Exception:
            pass


def _read_bounded(uploaded_file, max_size_bytes: int, field: str) -> bytes:
    """Read an upload while enforcing the byte cap on the actual stream, not the declared size."""
    if not uploaded_file:
        _reject(field, 'No file uploaded.')
    declared = getattr(uploaded_file, 'size', None)
    if declared is not None and declared > max_size_bytes:
        _reject(field, f'File size exceeds maximum allowed limit of {max_size_bytes // (1024 * 1024)} MB.')
    if hasattr(uploaded_file, 'seek'):
        uploaded_file.seek(0)
    raw = uploaded_file.read(max_size_bytes + 1)
    if len(raw) > max_size_bytes:
        _reject(field, f'File size exceeds maximum allowed limit of {max_size_bytes // (1024 * 1024)} MB.')
    return raw


def _safe_prefix(destination_prefix: str) -> str:
    clean = destination_prefix.strip('/').replace('\\', '/')
    if not clean or '..' in clean.split('/') or clean.startswith('/'):
        raise ValueError(f'Unsafe destination prefix: {destination_prefix!r}')
    return clean


def store_bytes(data: bytes, destination_prefix: str, ext: str) -> str:
    """Persist already-sanitized bytes under a server-chosen random filename. Returns the storage path."""
    prefix = _safe_prefix(destination_prefix)
    return default_storage.save(f"{prefix}/{uuid.uuid4().hex}.{ext}", ContentFile(data))


def sanitize_image_upload(
    uploaded_file,
    max_size_bytes: int = MAX_UPLOAD_SIZE_GENERAL,
    allowed_formats: tuple = DEFAULT_ALLOWED_FORMATS,
    field: str = 'file',
) -> SanitizedImage:
    """Validate + rebuild an uploaded image in memory without writing anything to storage."""
    raw = _read_bounded(uploaded_file, max_size_bytes, field)
    return sanitize_image_bytes(raw, allowed_formats=allowed_formats, field=field)


def validate_and_sanitize_image(
    uploaded_file,
    destination_prefix: str,
    max_size_bytes: int = MAX_UPLOAD_SIZE_GENERAL,
    allowed_formats: tuple = DEFAULT_ALLOWED_FORMATS,
) -> str:
    """
    Sanitize an uploaded image (see ``sanitize_image_bytes``) and store it under
    ``<destination_prefix>/<uuid4hex>.<ext>``. The client filename is never used.
    Returns the relative storage path.
    """
    result = sanitize_image_upload(uploaded_file, max_size_bytes, allowed_formats)
    return store_bytes(result.data, destination_prefix, result.ext)


# ── Certifications (PDF or image) ──────────────────────────────────────────────

PDF_MAX_PAGES = 20
_PDF_HEADER = re.compile(rb'^%PDF-(1\.[0-7]|2\.0)')
# Raw-token scan (second layer; the structural walk below is the primary one).
_PDF_ACTIVE_TOKENS = re.compile(
    rb'/(JavaScript|JS|Launch|EmbeddedFile|RichMedia|XFA|SubmitForm|ImportData)(?![A-Za-z0-9])'
)
_PDF_NAME_HEX_ESCAPE = re.compile(rb'/[^\s/<>\[\]()%]*#[0-9A-Fa-f]{2}')
_PDF_DANGEROUS_ACTIONS = {'/JavaScript', '/Launch', '/SubmitForm', '/ImportData', '/GoToR', '/GoToE', '/Rendition'}
_PDF_DANGEROUS_ANNOTS = {'/RichMedia', '/Screen', '/Movie', '/Sound', '/3D', '/FileAttachment'}


def _scan_pdf_best_effort(raw: bytes, field: str) -> None:
    """
    BEST-EFFORT screening of a PDF. This does NOT make a PDF safe: the file is stored
    byte-for-byte, parser differentials between pypdf and a viewer remain possible, and no
    antivirus engine is involved. The real controls are delivery-side (private storage,
    owner/staff-only download, attachment disposition, nosniff, sandbox CSP).

    Checks: header at offset 0 (%PDF-1.0..1.7 / 2.0, no leading junk), '%%EOF' in the last
    1 KiB, parseable by pypdf, not encrypted, 1..PDF_MAX_PAGES pages, no document-level
    /OpenAction action dict, /AA, /Names JavaScript or EmbeddedFiles, /AcroForm XFA, no page-level
    /AA, no annotation with a Launch/JavaScript/SubmitForm/ImportData/GoToR/GoToE/Rendition action or a
    RichMedia/Screen/Movie/Sound/3D/FileAttachment subtype, plus a raw-byte scan for the same
    active-content names and any #xx-escaped name (used to hide the others).
    """
    if not _PDF_HEADER.match(raw):
        _reject(field, 'Invalid PDF header.')
    if b'%%EOF' not in raw[-1024:]:
        _reject(field, 'Invalid or truncated PDF.')
    if _PDF_ACTIVE_TOKENS.search(raw) or _PDF_NAME_HEX_ESCAPE.search(raw):
        _reject(field, 'PDF contains active or obfuscated content and was rejected.')

    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(raw), strict=False)
        if reader.is_encrypted:
            _reject(field, 'Encrypted PDFs are not accepted.')
        pages = list(reader.pages[: PDF_MAX_PAGES + 1])
        if not 1 <= len(pages) <= PDF_MAX_PAGES:
            _reject(field, f'PDF must contain between 1 and {PDF_MAX_PAGES} pages.')

        root = reader.trailer['/Root']
        open_action = root.get('/OpenAction')
        if open_action is not None and hasattr(open_action, 'get_object'):
            open_action = open_action.get_object()
        if hasattr(open_action, 'get') and not isinstance(open_action, list):
            _reject(field, 'PDF contains an automatic action and was rejected.')
        if '/AA' in root:
            _reject(field, 'PDF contains automatic actions and was rejected.')
        names = root.get('/Names')
        if names is not None:
            names = names.get_object()
            if '/JavaScript' in names or '/EmbeddedFiles' in names:
                _reject(field, 'PDF contains scripts or attachments and was rejected.')
        acro = root.get('/AcroForm')
        if acro is not None and '/XFA' in acro.get_object():
            _reject(field, 'PDF contains XFA forms and was rejected.')

        for page in pages:
            if '/AA' in page:
                _reject(field, 'PDF contains automatic actions and was rejected.')
            for annot_ref in page.get('/Annots') or []:
                annot = annot_ref.get_object()
                if str(annot.get('/Subtype')) in _PDF_DANGEROUS_ANNOTS:
                    _reject(field, 'PDF contains embedded media and was rejected.')
                action = annot.get('/A')
                if action is not None and str(action.get_object().get('/S')) in _PDF_DANGEROUS_ACTIONS:
                    _reject(field, 'PDF contains active actions and was rejected.')
    except ValidationError:
        raise
    except Exception as exc:
        logger.warning('PDF screening failed to parse: %s', type(exc).__name__)
        _reject(field, 'The PDF could not be read. It may be corrupted.')


def sanitize_certification_upload(uploaded_file) -> Tuple[bytes, str]:
    """
    Validate a certification document in memory (nothing is written). Returns (bytes, extension).
    PDF: best-effort screened, bytes unchanged. Image (JPEG/PNG/WebP): fully re-encoded.
    """
    raw = _read_bounded(uploaded_file, MAX_UPLOAD_SIZE_CERT, 'cert_image')
    if raw.startswith(b'%PDF-'):
        _scan_pdf_best_effort(raw, 'cert_image')
        return raw, 'pdf'
    result = sanitize_image_bytes(raw, field='cert_image')
    return result.data, result.ext


def validate_and_sanitize_certification(uploaded_file, destination_prefix: str = 'certifications') -> str:
    """Sanitize a certification (PDF or image) and store it under a random server-chosen name."""
    data, ext = sanitize_certification_upload(uploaded_file)
    return store_bytes(data, destination_prefix, ext)




def validate_and_normalize_meal_image(uploaded_file) -> Tuple[ContentFile, Dict[str, Any]]:
    """
    Validates and normalizes an uploaded meal image for AI processing and storage:
    1. Enforces AI byte limit (10 MB default).
    2. Enforces Pillow pixel count ceiling (40 MP default) to protect from decompression bombs.
    3. Normalizes EXIF rotation.
    4. Downscales high-resolution images to max 2048px (preserving aspect ratio).
    5. Converts to RGB and saves as optimized JPEG.
    Returns (ContentFile, metadata_dict).
    """
    max_bytes = getattr(settings, 'AI_IMAGE_MAX_BYTES', MAX_UPLOAD_SIZE_AI)
    max_pixels = getattr(settings, 'AI_IMAGE_MAX_PIXELS', 40_000_000)
    max_side = getattr(settings, 'AI_IMAGE_NORMALIZED_MAX_SIDE', 2048)
    quality = getattr(settings, 'AI_IMAGE_NORMALIZED_QUALITY', 85)
    allowed_formats = getattr(settings, 'AI_IMAGE_ALLOWED_FORMATS', ['JPEG', 'PNG', 'WEBP'])

    if not uploaded_file:
        raise ValidationError({"file": "No image file provided."})

    # 1. Byte size check
    if hasattr(uploaded_file, 'size') and uploaded_file.size > max_bytes:
        max_mb = max_bytes // (1024 * 1024)
        raise ValidationError({"file": f"File size exceeds maximum allowable limit of {max_mb} MB."})

    if hasattr(uploaded_file, 'read'):
        raw_bytes = uploaded_file.read()
        if len(raw_bytes) > max_bytes:
            max_mb = max_bytes // (1024 * 1024)
            raise ValidationError({"file": f"File size exceeds maximum allowable limit of {max_mb} MB."})
    elif isinstance(uploaded_file, bytes):
        raw_bytes = uploaded_file
        if len(raw_bytes) > max_bytes:
            max_mb = max_bytes // (1024 * 1024)
            raise ValidationError({"file": f"File size exceeds maximum allowable limit of {max_mb} MB."})
    else:
        raise ValidationError({"file": "Invalid file object."})

    if len(raw_bytes) == 0:
        raise ValidationError({"file": "Uploaded image file is empty."})

    # 2. Pillow bounded inspection. The pixel cap is enforced explicitly from the header below;
    #    Pillow's process-global Image.MAX_IMAGE_PIXELS is deliberately left untouched.
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            orig_format = (img.format or "").upper()
            if orig_format not in allowed_formats and orig_format != 'MPO':
                raise ValidationError({"file": f"Unsupported image format '{orig_format}'. Allowed: {', '.join(allowed_formats)}."})

            orig_w, orig_h = img.size
            if (orig_w * orig_h) > max_pixels:
                raise ValidationError({"file": f"Image resolution ({orig_w}x{orig_h}={orig_w*orig_h} px) exceeds limit of {max_pixels} px."})

            # EXIF rotation
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass

            # Downscale if exceeding max_side (2048px)
            w, h = img.size
            if max(w, h) > max_side:
                scale = max_side / float(max(w, h))
                new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
                img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                w, h = img.size

            img_rgb = img.convert("RGB")
            out_io = io.BytesIO()
            img_rgb.save(out_io, format="JPEG", quality=quality, optimize=True)
            norm_bytes = out_io.getvalue()

            filename = f"meal_{uuid.uuid4().hex[:12]}.jpg"
            content_file = ContentFile(norm_bytes, name=filename)

            metadata = {
                "width": w,
                "height": h,
                "byte_size": len(norm_bytes),
                "original_format": orig_format,
                "original_dimensions": (orig_w, orig_h),
                "original_byte_size": len(raw_bytes),
                "normalized_format": "JPEG",
            }
            return content_file, metadata

    except ValidationError:
        raise
    except Image.DecompressionBombError as e:
        raise ValidationError({"file": f"Image rejected: potential decompression bomb ({e})."})
    except UnidentifiedImageError:
        raise ValidationError({"file": "Uploaded file is not a valid image."})
    except Exception as e:
        raise ValidationError({"file": f"Failed to process image: {str(e)}"})
