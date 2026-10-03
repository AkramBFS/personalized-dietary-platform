from django.db import migrations


def abandon_legacy_processing_rows(apps, schema_editor):
    """
    Legacy rows (pre-queue pipeline) that were left in 'processing' have no lease_token: the new
    worker always sets one when it claims a job. They can never be completed, so mark them failed
    with LEGACY_ABANDONED.

    ai_calorie_logs has FORCE ROW LEVEL SECURITY. Under a non-superuser role an UPDATE without an RLS
    context matches zero rows silently, so the migration sets the system context first (transaction-local,
    so it is discarded at commit). Idempotent: running it again touches nothing.

    Migration 0007 performs the same update without an RLS context (it was applied on the dev database
    before this was noticed and applied migrations are not edited); this migration is the RLS-safe pass.
    """
    connection = schema_editor.connection
    if connection.vendor == 'postgresql':
        with connection.cursor() as cursor:
            # Mirrors nutriplatform.middleware.rls.set_rls_context(is_system_worker=True), transaction-local.
            cursor.execute("SELECT set_config('app.current_user_id', '', true)")
            cursor.execute("SELECT set_config('app.is_staff', 'true', true)")
            cursor.execute("SELECT set_config('app.is_system_worker', 'true', true)")

    AICalorieLog = apps.get_model('client', 'AICalorieLog')
    AICalorieLog.objects.filter(status='processing', lease_token__isnull=True).update(
        status='failed',
        error_code='LEGACY_ABANDONED',
        error_message='Legacy in-flight log abandoned during async migration',
    )


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0008_aicalorielog_available_at_and_more'),
    ]

    operations = [
        migrations.RunPython(abandon_legacy_processing_rows, migrations.RunPython.noop),
    ]
