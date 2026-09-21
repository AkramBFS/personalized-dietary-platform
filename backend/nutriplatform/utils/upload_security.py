import io
import os
import uuid
from PIL import Image
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
