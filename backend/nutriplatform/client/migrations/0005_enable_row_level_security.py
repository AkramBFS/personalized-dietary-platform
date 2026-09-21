from django.db import migrations


def apply_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    statements = [
        # 1. Enable RLS on all 7 sensitive tables
        "ALTER TABLE clients ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE ai_calorie_logs ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE daily_progress_metrics ENABLE ROW LEVEL SECURITY;",

        # 2. Drop existing policies if any
        "DROP POLICY IF EXISTS rls_clients_isolation ON clients;",
        "DROP POLICY IF EXISTS rls_user_plans_isolation ON user_plans;",
        "DROP POLICY IF EXISTS rls_invoices_isolation ON invoices;",
        "DROP POLICY IF EXISTS rls_consultations_isolation ON consultations;",
        "DROP POLICY IF EXISTS rls_patient_notes_isolation ON patient_notes;",
        "DROP POLICY IF EXISTS rls_ai_calorie_logs_isolation ON ai_calorie_logs;",
        "DROP POLICY IF EXISTS rls_daily_progress_metrics_isolation ON daily_progress_metrics;",

        # 3. Create policies with explicit USING and WITH CHECK
        """
        CREATE POLICY rls_clients_isolation ON clients
        FOR ALL
        TO PUBLIC
        USING (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            OR current_setting('app.is_staff', true) = 'true'
            OR EXISTS (
                SELECT 1 FROM nutritionist_patients np
                JOIN nutritionists n ON np.nutritionist_id = n.nutritionist_id
                WHERE np.client_id = clients.client_id
                  AND n.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
        )
        WITH CHECK (
            user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            OR current_setting('app.is_staff', true) = 'true'
        );
        """,

        """
        CREATE POLICY rls_user_plans_isolation ON user_plans
        FOR ALL
        TO PUBLIC
        USING (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = user_plans.client_id
                  AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = user_plans.client_id
                  AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        );
        """,

        """
        CREATE POLICY rls_invoices_isolation ON invoices
        FOR ALL
        TO PUBLIC
        USING (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = invoices.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR EXISTS (
                SELECT 1 FROM nutritionists n
                WHERE n.nutritionist_id = invoices.nutritionist_id
                AND n.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = invoices.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR EXISTS (
                SELECT 1 FROM nutritionists n
                WHERE n.nutritionist_id = invoices.nutritionist_id
                AND n.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        );
        """,

        """
        CREATE POLICY rls_consultations_isolation ON consultations
        FOR ALL
        TO PUBLIC
        USING (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = consultations.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR EXISTS (
                SELECT 1 FROM nutritionists n
                WHERE n.nutritionist_id = consultations.nutritionist_id
                AND n.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = consultations.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR EXISTS (
                SELECT 1 FROM nutritionists n
                WHERE n.nutritionist_id = consultations.nutritionist_id
                AND n.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        );
        """,

        """
        CREATE POLICY rls_patient_notes_isolation ON patient_notes
        FOR ALL
        TO PUBLIC
        USING (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = patient_notes.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR EXISTS (
                SELECT 1 FROM nutritionists n
                WHERE n.nutritionist_id = patient_notes.nutritionist_id
                AND n.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = patient_notes.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR EXISTS (
                SELECT 1 FROM nutritionists n
                WHERE n.nutritionist_id = patient_notes.nutritionist_id
                AND n.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        );
        """,

        """
        CREATE POLICY rls_ai_calorie_logs_isolation ON ai_calorie_logs
        FOR ALL
        TO PUBLIC
        USING (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = ai_calorie_logs.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = ai_calorie_logs.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        );
        """,

        """
        CREATE POLICY rls_daily_progress_metrics_isolation ON daily_progress_metrics
        FOR ALL
        TO PUBLIC
        USING (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = daily_progress_metrics.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM clients c
                WHERE c.client_id = daily_progress_metrics.client_id
                AND c.user_id = NULLIF(current_setting('app.current_user_id', true), '')::integer
            )
            OR current_setting('app.is_staff', true) = 'true'
        );
        """,
    ]

    with schema_editor.connection.cursor() as cursor:
        for stmt in statements:
            cursor.execute(stmt)


def revert_rls(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    statements = [
        "DROP POLICY IF EXISTS rls_clients_isolation ON clients;",
        "ALTER TABLE clients DISABLE ROW LEVEL SECURITY;",
        "DROP POLICY IF EXISTS rls_user_plans_isolation ON user_plans;",
        "ALTER TABLE user_plans DISABLE ROW LEVEL SECURITY;",
        "DROP POLICY IF EXISTS rls_invoices_isolation ON invoices;",
        "ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;",
        "DROP POLICY IF EXISTS rls_consultations_isolation ON consultations;",
        "ALTER TABLE consultations DISABLE ROW LEVEL SECURITY;",
        "DROP POLICY IF EXISTS rls_patient_notes_isolation ON patient_notes;",
        "ALTER TABLE patient_notes DISABLE ROW LEVEL SECURITY;",
        "DROP POLICY IF EXISTS rls_ai_calorie_logs_isolation ON ai_calorie_logs;",
        "ALTER TABLE ai_calorie_logs DISABLE ROW LEVEL SECURITY;",
        "DROP POLICY IF EXISTS rls_daily_progress_metrics_isolation ON daily_progress_metrics;",
        "ALTER TABLE daily_progress_metrics DISABLE ROW LEVEL SECURITY;",
    ]

    with schema_editor.connection.cursor() as cursor:
        for stmt in statements:
            cursor.execute(stmt)


class Migration(migrations.Migration):

    dependencies = [
        ('client', '0004_alter_client_health_history_and_more'),
        ('marketplace', '0004_alter_consultation_zoom_link'),
        ('nutritionist', '0004_alter_patientnote_note_content'),
    ]

    operations = [
        migrations.RunPython(apply_rls, revert_rls),
    ]
