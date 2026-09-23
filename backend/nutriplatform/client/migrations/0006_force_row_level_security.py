from django.db import migrations


def apply_force_rls_and_role(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    statements = [
        # 1. Force RLS so table owners are also subject to RLS policies
        "ALTER TABLE clients FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE user_plans FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE invoices FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE consultations FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE patient_notes FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE ai_calorie_logs FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE daily_progress_metrics FORCE ROW LEVEL SECURITY;",

        # 2. Idempotently provision the unprivileged application role nutriplatform_app
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'nutriplatform_app') THEN
                CREATE ROLE nutriplatform_app WITH LOGIN NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD 'app_secure_password_dev';
            ELSE
                ALTER ROLE nutriplatform_app WITH NOBYPASSRLS NOSUPERUSER;
            END IF;
        END
        $$;
        """,

        # 3. Grant table and sequence permissions to nutriplatform_app
        "GRANT USAGE ON SCHEMA public TO nutriplatform_app;",
        "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nutriplatform_app;",
        "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nutriplatform_app;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO nutriplatform_app;",
        "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO nutriplatform_app;",
    ]

    with schema_editor.connection.cursor() as cursor:
        for stmt in statements:
            cursor.execute(stmt)


def revert_force_rls_and_role(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    statements = [
        "ALTER TABLE clients NO FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE user_plans NO FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE invoices NO FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE consultations NO FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE patient_notes NO FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE ai_calorie_logs NO FORCE ROW LEVEL SECURITY;",
        "ALTER TABLE daily_progress_metrics NO FORCE ROW LEVEL SECURITY;",
    ]

    with schema_editor.connection.cursor() as cursor:
        for stmt in statements:
            cursor.execute(stmt)


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0005_enable_row_level_security'),
    ]

    operations = [
        migrations.RunPython(apply_force_rls_and_role, revert_force_rls_and_role),
    ]
