import io
import os
import uuid
from typing import Tuple, Dict, Any, Optional
from PIL import Image, ImageOps, UnidentifiedImageError
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework.exceptions import ValidationError

MAX_UPLOAD_SIZE_GENERAL = 5 * 1024 * 1024   # 5 MB
MAX_UPLOAD_SIZE_AI = 10 * 1024 * 1024       # 10 MB

ALLOWED_MIME_TYPES = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
}

MAGIC_SIGNATURES = {
    'jpg': [b'\xff\xd8\xff'],
    'png': [b'\x89PNG\r\n\x1a\n'],
    'webp': [b'RIFF'],  # and 'WEBP' at offset 8
}


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


def validate_and_sanitize_image(
    uploaded_file,
    destination_prefix: str,
    max_size_bytes: int = MAX_UPLOAD_SIZE_GENERAL,
    allowed_formats: tuple = ('JPEG', 'PNG', 'WEBP'),
) -> str:
    """
    Validates and sanitizes an uploaded image file:
    1. Enforces file size limits (5MB general / 10MB AI vision).
    2. Enforces MIME type & magic byte signature. Rejects SVG, scripts, and executables.
    3. Performs Pillow Image.verify() for structural integrity.
    4. Strips EXIF/metadata and re-encodes image into safe in-memory buffer.
    5. Saves using safe UUIDv4 filename into default_storage.
    Returns relative storage path.
    """
    if not uploaded_file:
        raise ValidationError({"file": "No file uploaded."})

    # 1. Size check
    if uploaded_file.size > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise ValidationError({"file": f"File size exceeds maximum allowed limit of {max_mb} MB."})

    # 2. Reject SVG or executable extensions explicitly
    orig_name = getattr(uploaded_file, 'name', '') or ''
    ext = os.path.splitext(orig_name)[1].lower().lstrip('.')
    if ext in ['svg', 'exe', 'bat', 'sh', 'py', 'php', 'html', 'htm', 'js']:
        raise ValidationError({"file": f"File type .{ext} is not permitted for upload."})

    # 3. Magic bytes validation
    uploaded_file.seek(0)
    header = uploaded_file.read(32)
    uploaded_file.seek(0)

    detected_format = None
    if header.startswith(b'\xff\xd8\xff'):
        detected_format = 'JPEG'
    elif header.startswith(b'\x89PNG\r\n\x1a\n'):
        detected_format = 'PNG'
    elif header.startswith(b'RIFF') and len(header) >= 12 and header[8:12] == b'WEBP':
        detected_format = 'WEBP'
    else:
        raise ValidationError({"file": "Invalid image format. Only JPEG, PNG, and WebP are accepted."})

    if detected_format not in allowed_formats:
        raise ValidationError({"file": f"Image format {detected_format} is not allowed."})

    # 4. Pillow integrity verification
    try:
        with Image.open(uploaded_file) as img:
            img.verify()
    except Exception as e:
        raise ValidationError({"file": f"Corrupted or invalid image file: {str(e)}"})

    # 5. Re-encode image to strip EXIF and metadata payloads
    uploaded_file.seek(0)
    try:
        with Image.open(uploaded_file) as img:
            output_buffer = io.BytesIO()
            save_format = detected_format

            # Convert RGBA/Palette images to RGB when saving as JPEG
            if save_format == 'JPEG' and img.mode in ('RGBA', 'P', 'LA'):
                img = img.convert('RGB')

            img.save(output_buffer, format=save_format)
            output_buffer.seek(0)
    except Exception as e:
        raise ValidationError({"file": f"Failed to process and re-encode image: {str(e)}"})

    # 6. Generate UUID4 safe filename and persist
    safe_ext = 'jpg' if save_format == 'JPEG' else save_format.lower()
    unique_filename = f"{uuid.uuid4().hex}.{safe_ext}"
    clean_prefix = destination_prefix.strip('/').replace('\\', '/')
    destination_path = f"{clean_prefix}/{unique_filename}"

    saved_path = default_storage.save(destination_path, ContentFile(output_buffer.getvalue()))
    return saved_path


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

    # 2. Pillow bounded inspection
    Image.MAX_IMAGE_PIXELS = max_pixels
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
