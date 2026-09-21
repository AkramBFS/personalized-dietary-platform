from django.core.management.base import BaseCommand
from django.db import transaction
from client.models import Client, DailyProgressMetric
from nutritionist.models import PatientNote
from marketplace.models import Consultation


class Command(BaseCommand):
    help = "Encrypts legacy plaintext sensitive fields across Client, DailyProgressMetric, PatientNote, and Consultation"

    def add_arguments(self, parser):
        parser.add_argument(
            '--batch-size',
            type=int,
            default=500,
            help='Number of records to process per batch (default: 500)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate encryption without writing changes to the database',
        )

    def handle(self, *args, **options):
        batch_size = options['batch_size']
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING("--- Running in DRY-RUN mode (no DB changes) ---"))

        targets = [
            (Client, 'health_history', 'client_id'),
            (DailyProgressMetric, 'notes', 'id'),
            (PatientNote, 'note_content', 'id'),
            (Consultation, 'zoom_link', 'id'),
        ]

        total_encrypted = 0

        for model, field_name, pk_field in targets:
            model_name = model.__name__
            table_name = model._meta.db_table
            self.stdout.write(f"Scanning {model_name}.{field_name} ({table_name})...")

            # Query unencrypted records using pure Django ORM without raw SQL
            unencrypted_qs = (
                model.objects
                .exclude(**{f"{field_name}__startswith": "v1:"})
                .exclude(**{f"{field_name}__isnull": True})
                .exclude(**{field_name: ""})
            )
            raw_ids_to_encrypt = list(unencrypted_qs.values_list(pk_field, flat=True))

            count = len(raw_ids_to_encrypt)
            self.stdout.write(f"  Found {count} unencrypted record(s) in {model_name}.{field_name}")

            if count > 0 and not dry_run:
                updated_count = 0
                for i in range(0, count, batch_size):
                    chunk_pks = raw_ids_to_encrypt[i:i + batch_size]
                    with transaction.atomic():
                        instances = list(model.objects.filter(**{f"{pk_field}__in": chunk_pks}))
                        for inst in instances:
                            # Saving will trigger get_prep_value() which encrypts to 'v1:...'
                            inst.save(update_fields=[field_name])
                            updated_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Successfully encrypted {updated_count} record(s) in {model_name}.{field_name}"))
                total_encrypted += updated_count
            elif count > 0 and dry_run:
                self.stdout.write(f"  [DRY-RUN] Would encrypt {count} record(s) in {model_name}.{field_name}")
                total_encrypted += count
            else:
                self.stdout.write(self.style.SUCCESS(f"  All records in {model_name}.{field_name} already encrypted."))

        if dry_run:
            self.stdout.write(self.style.WARNING(f"\n[DRY-RUN COMPLETE] Total records requiring encryption: {total_encrypted}"))
        else:
            self.stdout.write(self.style.SUCCESS(f"\n[BATCH ENCRYPTION COMPLETE] Total records encrypted: {total_encrypted}"))
