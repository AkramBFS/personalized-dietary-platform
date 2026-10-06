from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0005_payments_integrity_and_slot_holds'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            -- 1. Drop the legacy 8-argument create_consultation_hold overload
            DROP FUNCTION IF EXISTS create_consultation_hold(integer, integer, date, time, time, varchar, double precision, integer);

            -- 2. Create the modern 6-argument create_consultation_hold function with session-context binding
            CREATE OR REPLACE FUNCTION create_consultation_hold(
                p_nutritionist_id integer,
                p_appointment_date date,
                p_start_time time,
                p_end_time time,
                p_consultation_type varchar,
                p_price_paid double precision
            ) RETURNS TABLE(hold_id integer, status_code varchar)
            SECURITY DEFINER
            SET search_path = pg_catalog, public
            AS $$
            DECLARE
                c_hold_ttl_seconds CONSTANT integer := 900; -- Internal 15-minute constant TTL
                v_user_id integer;
                v_client_id integer;
                v_active_holds integer;
                v_new_id integer;
            BEGIN
                -- 1. Resolve client from authenticated session variable (app.current_user_id)
                v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::integer;
                IF v_user_id IS NULL THEN
                    RAISE EXCEPTION 'Authentication required: app.current_user_id is not set';
                END IF;

                SELECT client_id INTO v_client_id FROM clients WHERE user_id = v_user_id;
                IF v_client_id IS NULL THEN
                    RAISE EXCEPTION 'Client profile not found for user %', v_user_id;
                END IF;

                -- 2. Cap active holds per user (max 3 concurrent pending holds)
                SELECT count(*) INTO v_active_holds
                FROM consultations
                WHERE client_id = v_client_id
                  AND status = 'pending_payment'
                  AND created_at >= (clock_timestamp() - (c_hold_ttl_seconds || ' seconds')::interval);

                IF v_active_holds >= 3 THEN
                    RETURN QUERY SELECT NULL::integer, 'CAP_REACHED'::varchar;
                    RETURN;
                END IF;

                -- 3. Expire stale pending_payment holds on this exact slot atomically
                UPDATE consultations
                SET status = 'cancelled'
                WHERE nutritionist_id = p_nutritionist_id
                  AND appointment_date = p_appointment_date
                  AND start_time = p_start_time
                  AND status = 'pending_payment'
                  AND created_at < (clock_timestamp() - (c_hold_ttl_seconds || ' seconds')::interval);

                -- 4. Check if the slot is currently booked or held by an unexpired hold
                IF EXISTS (
                    SELECT 1 FROM consultations
                    WHERE nutritionist_id = p_nutritionist_id
                      AND appointment_date = p_appointment_date
                      AND start_time = p_start_time
                      AND status IN ('scheduled', 'notified', 'finished', 'pending_payment')
                ) THEN
                    RETURN QUERY SELECT NULL::integer, 'SLOT_UNAVAILABLE'::varchar;
                    RETURN;
                END IF;

                -- 5. Insert the hold
                INSERT INTO consultations (
                    client_id, nutritionist_id, appointment_date,
                    start_time, end_time, status, consultation_type,
                    price_paid, is_free_from_plan, created_at
                ) VALUES (
                    v_client_id, p_nutritionist_id, p_appointment_date,
                    p_start_time, p_end_time, 'pending_payment', p_consultation_type,
                    p_price_paid, false, clock_timestamp()
                ) RETURNING id INTO v_new_id;

                RETURN QUERY SELECT v_new_id, 'SUCCESS'::varchar;
                RETURN;
            EXCEPTION WHEN unique_violation THEN
                RETURN QUERY SELECT NULL::integer, 'SLOT_UNAVAILABLE'::varchar;
                RETURN;
            END;
            $$ LANGUAGE plpgsql;

            ALTER FUNCTION create_consultation_hold(integer, date, time, time, varchar, double precision) OWNER TO postgres;
            REVOKE ALL ON FUNCTION create_consultation_hold(integer, date, time, time, varchar, double precision) FROM PUBLIC;
            GRANT EXECUTE ON FUNCTION create_consultation_hold(integer, date, time, time, varchar, double precision) TO nutriplatform_app;
            """,
            reverse_sql="""
            DROP FUNCTION IF EXISTS create_consultation_hold(integer, date, time, time, varchar, double precision);

            CREATE OR REPLACE FUNCTION create_consultation_hold(
                p_client_id integer,
                p_nutritionist_id integer,
                p_appointment_date date,
                p_start_time time,
                p_end_time time,
                p_consultation_type varchar,
                p_price_paid double precision,
                p_ttl_minutes integer DEFAULT 15
            ) RETURNS integer
            SECURITY DEFINER
            SET search_path = pg_catalog, public
            AS $$
            DECLARE
                v_new_id integer;
            BEGIN
                UPDATE consultations
                SET status = 'cancelled'
                WHERE status = 'pending_payment'
                  AND created_at < clock_timestamp() - (p_ttl_minutes || ' minutes')::interval;

                INSERT INTO consultations (
                    client_id, nutritionist_id, appointment_date,
                    start_time, end_time, status, consultation_type,
                    price_paid, is_free_from_plan, created_at
                ) VALUES (
                    p_client_id, p_nutritionist_id, p_appointment_date,
                    p_start_time, p_end_time, 'pending_payment', p_consultation_type,
                    p_price_paid, false, clock_timestamp()
                ) RETURNING id INTO v_new_id;

                RETURN v_new_id;
            EXCEPTION WHEN unique_violation THEN
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;

            ALTER FUNCTION create_consultation_hold(integer, integer, date, time, time, varchar, double precision, integer) OWNER TO postgres;
            REVOKE ALL ON FUNCTION create_consultation_hold(integer, integer, date, time, time, varchar, double precision, integer) FROM PUBLIC;
            GRANT EXECUTE ON FUNCTION create_consultation_hold(integer, integer, date, time, time, varchar, double precision, integer) TO nutriplatform_app;
            """
        ),
    ]
