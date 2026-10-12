import os
import re
import uuid
import shutil
import io
from pathlib import Path
from PIL import Image, ImageOps
import pypdf

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from client.models import Client, AICalorieLog
from nutritionist.models import Nutritionist
from marketplace.models import Plan
from community.models import Post
from utils.upload_security import (
    validate_and_sanitize_image,
    validate_and_sanitize_certification,
)

JPEG_MAGIC = b'\xff\xd8\xff'
PNG_MAGIC = b'\x89PNG\r\n\x1a\n'
WEBP_MAGIC_PREFIX = b'RIFF'
WEBP_MAGIC_TAG = b'WEBP'
PDF_MAGIC = b'%PDF-'

UUID_HEX_PATTERN = re.compile(r'^[0-9a-f]{32}\.[a-zA-Z0-9]+$', re.IGNORECASE)
UUID_DASH_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-zA-Z0-9]+$',
    re.IGNORECASE,
)

DEFAULT_ASSETS = {
    'default_avatar.png',
    'default_nutri.png',
    'default_plan_cover.jpg',
}


def is_uuid_filename(filename: str) -> bool:
    return bool(UUID_HEX_PATTERN.match(filename) or UUID_DASH_PATTERN.match(filename))


class Command(BaseCommand):
    help = "Audits and sanitizes media files, reporting legacy names, missing files, corrupt files, and distinct URL prefixes."

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply',
            action='store_true',
            default=False,
            help='Execute re-encoding, UUID renaming, DB migration, and move corrupted files.',
        )

    def handle(self, *args, **options):
        apply_changes = options['apply']
        dry_run = not apply_changes
        media_root = Path(settings.MEDIA_ROOT).resolve()

        self.stdout.write(self.style.NOTICE(f"Media Root: {media_root}"))
        self.stdout.write(self.style.NOTICE(f"Execution Mode: {'APPLY' if apply_changes else 'DRY-RUN (Audit Only)'}\n"))

        # -------------------------------------------------------------
        # 1. Audit Database URL references
        # -------------------------------------------------------------
        db_fields = [
            (Client, 'profile_photo_url'),
            (Nutritionist, 'profile_photo_url'),
            (Nutritionist, 'cert_image_url'),
            (Plan, 'cover_image_url'),
            (Post, 'image_url'),
            (AICalorieLog, 'image_url'),
            (AICalorieLog, 'segmented_image_url'),
        ]

        distinct_prefixes = set()
        db_records = []  # list of dicts: {model, field, id, url}
        db_referenced_relpaths = set()
        missing_db_files = []

        for model, field_name in db_fields:
            qs = model.objects.exclude(**{f"{field_name}__isnull": True}).exclude(**{field_name: ""})
            for obj in qs:
                raw_url = getattr(obj, field_name)
                if not raw_url:
                    continue
                clean_url = raw_url.lstrip('/')
                db_referenced_relpaths.add(clean_url)
                
                # Determine prefix
                parts = clean_url.split('/')
                if len(parts) > 1:
                    prefix = '/'.join(parts[:-1]) + '/'
                else:
                    prefix = '(root)/'
                distinct_prefixes.add(prefix)

                rec = {
                    'model': model.__name__,
                    'field': field_name,
                    'id': obj.pk,
                    'url': raw_url,
                    'clean_url': clean_url,
                    'filename': parts[-1],
                }
                db_records.append(rec)

                # Check existence on disk
                if clean_url in DEFAULT_ASSETS:
                    # Default asset check
                    full_path = media_root / clean_url
                    if not full_path.exists():
                        # Default assets might be virtual or in static
                        pass
                else:
                    full_path = media_root / clean_url
                    if not full_path.exists():
                        missing_db_files.append(rec)

        # -------------------------------------------------------------
        # 2. Audit Disk Files in MEDIA_ROOT
        # -------------------------------------------------------------
        disk_files = []  # dict of info per file
        non_uuid_files = []
        corrupt_files = []
        orphaned_files = []

        # Directories to ignore
        ignore_dirs = {'.git', 'quarantine', 'corrupted', '__pycache__'}

        for root, dirs, files in os.walk(media_root):
            # Exclude ignored dirs
            dirs[:] = [d for d in dirs if d not in ignore_dirs]

            for fname in files:
                fpath = Path(root) / fname
                rel_path = fpath.relative_to(media_root).as_posix()

                # Check UUID naming
                is_uuid = is_uuid_filename(fname)
                if not is_uuid and rel_path not in DEFAULT_ASSETS:
                    non_uuid_files.append(rel_path)

                # Magic byte & integrity inspection
                file_status = 'ok'
                file_error = None

                try:
                    with open(fpath, 'rb') as f:
                        header = f.read(32)

                    ext = fpath.suffix.lower()
                    if ext == '.pdf':
                        if not header.startswith(PDF_MAGIC):
                            file_status = 'invalid_magic'
                            file_error = 'Missing %PDF- header'
                        else:
                            try:
                                reader = pypdf.PdfReader(str(fpath))
                                if len(reader.pages) == 0:
                                    file_status = 'corrupt'
                                    file_error = 'Empty PDF'
                            except Exception as e:
                                file_status = 'corrupt'
                                file_error = f'pypdf error: {str(e)}'
                    else:
                        # Image check
                        is_valid_magic = (
                            header.startswith(JPEG_MAGIC)
                            or header.startswith(PNG_MAGIC)
                            or (header.startswith(WEBP_MAGIC_PREFIX) and header[8:12] == WEBP_MAGIC_TAG)
                            or header.startswith(b'GIF87a')
                            or header.startswith(b'GIF89a')
                        )
                        if not is_valid_magic:
                            file_status = 'invalid_magic'
                            file_error = f'Unrecognized header: {header[:8].hex()}'
                        else:
                            try:
                                with Image.open(fpath) as img:
                                    img.verify()
                                # Verify closes or invalidates the fp; reopen to test transpose / load
                                with Image.open(fpath) as img:
                                    img.load()
                            except Exception as e:
                                file_status = 'corrupt'
                                file_error = f'Pillow error: {str(e)}'

                except Exception as e:
                    file_status = 'unreadable'
                    file_error = str(e)

                if file_status != 'ok':
                    corrupt_files.append({
                        'rel_path': rel_path,
                        'status': file_status,
                        'error': file_error,
                    })

                # Check orphan status
                if rel_path not in db_referenced_relpaths and rel_path not in DEFAULT_ASSETS:
                    orphaned_files.append(rel_path)

                disk_files.append({
                    'rel_path': rel_path,
                    'size': fpath.stat().st_size,
                    'status': file_status,
                    'error': file_error,
                    'is_uuid': is_uuid,
                })

        # -------------------------------------------------------------
        # 3. Output Structured Report
        # -------------------------------------------------------------
        self.stdout.write(self.style.SUCCESS("=" * 70))
        self.stdout.write(self.style.SUCCESS("MEDIA STORAGE AUDIT REPORT"))
        self.stdout.write(self.style.SUCCESS("=" * 70))

        self.stdout.write("\n1. DISTINCT URL PREFIXES IN DATABASE:")
        for prefix in sorted(distinct_prefixes):
            count = sum(1 for r in db_records if r['clean_url'].startswith(prefix) or (prefix == '(root)/' and '/' not in r['clean_url']))
            self.stdout.write(f"   - {prefix:<30} ({count} records)")

        self.stdout.write(f"\n2. DISK FILES WITH CLIENT-SUPPLIED (NON-UUID) NAMES ({len(non_uuid_files)} found):")
        for f in sorted(non_uuid_files)[:25]:
            self.stdout.write(f"   - {f}")
        if len(non_uuid_files) > 25:
            self.stdout.write(f"   ... and {len(non_uuid_files) - 25} more.")

        self.stdout.write(f"\n3. CORRUPT OR INVALID FILES ON DISK ({len(corrupt_files)} found):")
        for c in corrupt_files:
            self.stdout.write(f"   - {c['rel_path']}: [{c['status']}] {c['error']}")
        if not corrupt_files:
            self.stdout.write("   (None)")

        self.stdout.write(f"\n4. DATABASE RECORDS POINTING TO MISSING FILES ({len(missing_db_files)} found):")
        for m in missing_db_files:
            self.stdout.write(f"   - {m['model']}.{m['field']} (ID {m['id']}): {m['url']}")
        if not missing_db_files:
            self.stdout.write("   (None)")

        self.stdout.write(f"\n5. ORPHANED FILES ON DISK NOT REFERENCED BY DB ({len(orphaned_files)} found):")
        for o in sorted(orphaned_files)[:20]:
            self.stdout.write(f"   - {o}")
        if len(orphaned_files) > 20:
            self.stdout.write(f"   ... and {len(orphaned_files) - 20} more.")

        self.stdout.write(f"\nSUMMARY STATISTICS:")
        self.stdout.write(f"   - Total DB media references: {len(db_records)}")
        self.stdout.write(f"   - Total files on disk:       {len(disk_files)}")
        self.stdout.write(f"   - Non-UUID files:            {len(non_uuid_files)}")
        self.stdout.write(f"   - Corrupt/invalid files:     {len(corrupt_files)}")
        self.stdout.write(f"   - Missing files (in DB):     {len(missing_db_files)}")
        self.stdout.write(f"   - Orphaned files (on disk):  {len(orphaned_files)}")

        # -------------------------------------------------------------
        # 4. Apply Operations (only if --apply)
        # -------------------------------------------------------------
        if dry_run:
            self.stdout.write(self.style.WARNING("\n[DRY RUN] No files modified or moved. Use --apply to execute changes."))
            return

        self.stdout.write(self.style.NOTICE("\n--- EXECUTING SANITIZATION & MIGRATION (--apply) ---"))
        corrupted_dir = media_root / 'corrupted'
        corrupted_dir.mkdir(parents=True, exist_ok=True)

        # Move corrupt files to media/corrupted/
        for c in corrupt_files:
            src = media_root / c['rel_path']
            dest = corrupted_dir / Path(c['rel_path']).name
            self.stdout.write(f"Moving corrupt file: {c['rel_path']} -> corrupted/{dest.name}")
            shutil.move(str(src), str(dest))

        # Re-encode and migrate non-UUID DB files
        migrated_count = 0
        with transaction.atomic():
            for rec in db_records:
                clean_url = rec['clean_url']
                if clean_url in DEFAULT_ASSETS:
                    continue
                old_path = media_root / clean_url
                if not old_path.exists():
                    continue

                fname = Path(clean_url).name
                if is_uuid_filename(fname):
                    # Already UUID
                    continue

                prefix = Path(clean_url).parent.as_posix()
                ext = old_path.suffix.lower()

                # Process file
                if ext == '.pdf':
                    new_filename = f"{uuid.uuid4().hex}.pdf"
                    new_relpath = f"{prefix}/{new_filename}" if prefix != '.' else new_filename
                    new_path = media_root / new_relpath
                    new_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(str(old_path), str(new_path))
                    old_path.unlink()
                else:
                    # Sanitize and re-encode image (strip EXIF)
                    try:
                        with Image.open(old_path) as img:
                            img = ImageOps.exif_transpose(img)
                            target_format = 'PNG' if ext == '.png' or img.format == 'GIF' else 'JPEG'
                            target_ext = '.png' if target_format == 'PNG' else '.jpg'
                            if target_format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
                                img = img.convert('RGB')
                            new_filename = f"{uuid.uuid4().hex}{target_ext}"
                            new_relpath = f"{prefix}/{new_filename}" if prefix != '.' else new_filename
                            new_path = media_root / new_relpath
                            new_path.parent.mkdir(parents=True, exist_ok=True)
                            
                            buf = io.BytesIO()
                            img.save(buf, format=target_format, quality=85, optimize=True)
                            with open(new_path, 'wb') as out_f:
                                out_f.write(buf.getvalue())
                        old_path.unlink()
                    except Exception as err:
                        self.stdout.write(self.style.ERROR(f"Failed to sanitize {clean_url}: {err}"))
                        continue

                # Update DB record
                model_cls = {
                    'Client': Client,
                    'Nutritionist': Nutritionist,
                    'Plan': Plan,
                    'Post': Post,
                    'AICalorieLog': AICalorieLog,
                }[rec['model']]
                
                model_cls.objects.filter(pk=rec['id']).update(**{rec['field']: new_relpath})
                migrated_count += 1
                self.stdout.write(f"Migrated {clean_url} -> {new_relpath} (Model {rec['model']} ID {rec['id']})")

        self.stdout.write(self.style.SUCCESS(f"\n[APPLY COMPLETE] Migrated {migrated_count} files and updated DB records."))
