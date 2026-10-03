# Workstream Handoff: Asynchronous AI Calorie Estimation Pipeline

This document details the architectural decisions, database contracts, RLS isolation policies, operational deployment order, and adjacent workstreams for the NutriPlatform AI Calorie Estimation system.

---

## 1. Row-Level Security (RLS) Operational Contract

The database enforces multi-tenant Row-Level Security (RLS) on PostgreSQL across all sensitive tables, including `ai_calorie_logs`.

### 1.1 Session Variables
The PostgreSQL session variables configured in `RLSMiddleware` and `set_rls_context()` are:
- `app.current_user_id`: Integer string of the authenticated user's ID (`User.id`), or `''` when unauthenticated.
- `app.is_staff`: `'true'` if user is staff/admin/superuser or during elevated system worker execution, else `'false'`.
- `app.is_system_worker`: `'true'` when executing background worker or internal maintenance operations, else `'false'`.

### 1.2 Policy Definition on `ai_calorie_logs`
```sql
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
```

### 1.3 Operation Context Matrix (SELECT & UPDATE Operations)

| Operation | SQL Commands | Execution Context & Session Variables | Policy Clause Required |
| :--- | :--- | :--- | :--- |
| **Claim Next Job** (`claim_next_job`) | `SELECT ... WHERE status = 'queued' FOR UPDATE SKIP LOCKED`<br>`UPDATE ai_calorie_logs SET status = 'processing', lease_token = ..., claimed_at = ...` | System Worker Context:<br>`app.current_user_id = ''`<br>`app.is_staff = 'true'`<br>`app.is_system_worker = 'true'` | `current_setting('app.is_staff', true) = 'true'` (Cross-tenant job discovery & atomic claim) |
| **Stale Recovery & Requeue** (`recover_stale_leases`) | `SELECT ... WHERE status = 'processing' AND claimed_at < threshold`<br>`UPDATE ai_calorie_logs SET status = 'queued', lease_token = NULL, retry_count = retry_count + 1` | System Worker Context:<br>`app.current_user_id = ''`<br>`app.is_staff = 'true'`<br>`app.is_system_worker = 'true'` | `current_setting('app.is_staff', true) = 'true'` (Cross-tenant lease reclamation) |
| **SLA Deadline Expiration** (`recover_stale_leases`) | `SELECT ... WHERE status IN ('queued', 'processing') AND logged_at < deadline`<br>`UPDATE ai_calorie_logs SET status = 'failed', error_code = 'AI_INFERENCE_TIMEOUT'` | System Worker Context:<br>`app.current_user_id = ''`<br>`app.is_staff = 'true'`<br>`app.is_system_worker = 'true'` | `current_setting('app.is_staff', true) = 'true'` (Cross-tenant SLA deadline enforcement) |
| **Complete Job Finalize** (`complete_job`) | `UPDATE ai_calorie_logs SET status = 'pending_user_review', raw_prediction = ..., total_calories = ... WHERE id = %s AND lease_token = %s` | **Job Owner Context**:<br>`app.current_user_id = <client.user.id>`<br>`app.is_staff = 'false'`<br>`app.is_system_worker = 'false'` | `EXISTS (SELECT 1 FROM clients c WHERE c.client_id = ai_calorie_logs.client_id AND c.user_id = current_setting('app.current_user_id', true)::integer)` (Strict tenant isolation) |
| **Elevated Global Queue Cap** (`submit`) | `SELECT COUNT(*) FROM ai_calorie_logs WHERE status IN ('queued', 'processing')` | System Worker Context (in `try...finally`):<br>`app.is_system_worker = 'true'` | `current_setting('app.is_staff', true) = 'true'` |
| **Elevated Queue Position** (`status`) | `SELECT COUNT(*) FROM ai_calorie_logs WHERE status = 'queued' AND logged_at <= current_job.logged_at` | System Worker Context (in `try...finally`):<br>`app.is_system_worker = 'true'` | `current_setting('app.is_staff', true) = 'true'` |
| **Elevated Deadline Fallback** (`status`) | `UPDATE ai_calorie_logs SET status = 'failed' WHERE id = %s AND status IN ('queued', 'processing')` | System Worker Context (in `try...finally`):<br>`app.is_system_worker = 'true'` | `current_setting('app.is_staff', true) = 'true'` |
| **Staff Queue Health** (`queue-health`) | `SELECT status, COUNT(*) FROM ai_calorie_logs GROUP BY status` | System Worker Context (in `try...finally`):<br>`app.is_system_worker = 'true'` | `current_setting('app.is_staff', true) = 'true'` |

### 1.4 Web Tier Elevation Points & Security Risks
The web tier in [`backend/nutriplatform/client/views.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/views.py) temporarily elevates to `is_system_worker=True` in four specific locations:
1. `AICalorieSubmitView._check_queue_cap()` (line ~788): queries global in-flight counts to enforce `AI_GLOBAL_QUEUE_CAP`.
2. `AICalorieStatusView._compute_queue_position()` (line ~876): queries platform-wide queue position to compute ETA.
3. `AICalorieStatusView.get()` (line ~937): executes deadline fallback update if an in-flight job exceeded 180s on read.
4. `AIQueueHealthView.get()` (line ~1214): aggregates queue breakdown metrics for authenticated staff administrators.

> [!WARNING]
> **RLS Preservation Risk**: These elevations bypass per-tenant filtering using `try...finally` blocks to restore `request.user`. The upcoming **RLS Workstream** must preserve these elevation blocks and include explicit regression tests ensuring session contexts never leak across pooled database connections.

### 1.5 Test Database Non-Superuser Role
PostgreSQL superusers bypass RLS policies unconditionally (`BYPASSRLS`). Automated security tests (`test_security_encryption_rls.py`) switch database sessions to the unprivileged role `nutriplatform_app` (`SET LOCAL ROLE nutriplatform_app;`) to strictly verify that cross-tenant access is rejected by PostgreSQL.

---

## 2. Safe Production Deployment Order

The rollout must follow this exact sequence:

1. **Step 1: Apply Database Migrations (0007–0009)**:
   - Run `python manage.py migrate client` on PostgreSQL.
   - Adds queue fields, lease tokens, attempt counters, and state choices directly on `AICalorieLog`.
2. **Step 2: Start Background AI Worker Daemon**:
   - Launch `python manage.py run_ai_worker --poll-interval 0.5` as a managed daemon process.
   - The worker begins polling the database queue with `SELECT FOR UPDATE SKIP LOCKED`.
3. **Step 3: Deploy Backend & Frontend Simultaneously with Flag Enabled**:
   - Deploy web backend (Workstream D) and frontend (Workstream E) together with `AI_ASYNC_PIPELINE=True`.
   - The flag remains `False` until both backend and frontend ship to production together.

---

## 3. Shared Security Modules (`backend/nutriplatform/utils/upload_security.py`)

- `validate_request_content_length(request, max_bytes)`: Fast pre-body validation on HTTP Content-Length header to reject oversized payloads before buffering.
- `validate_and_sanitize_image(uploaded_file, destination_prefix, max_size_bytes, allowed_formats)`: Enforces MIME types, magic bytes, Pillow `Image.verify()`, strips EXIF metadata, and saves with safe UUIDv4 filename.
- `validate_and_normalize_meal_image(uploaded_file)`: Bounds AI image uploads (10 MB ceiling, 40 MP decompression bomb limit, 2048 px max side downscale, JPEG 85 optimization).

---

## 4. Full Adjacent Issues List (From Original Plan)

1. **Request-Wide Transactions (`ATOMIC_REQUESTS`)**:
   - Django `ATOMIC_REQUESTS = True` wraps the entire HTTP request in a database transaction. Holding open transactions during outbound AI inference or third-party nutrition calls causes connection pool exhaustion. Views making network calls must use explicit, localized transaction blocks.
2. **Wildcard `ALLOWED_HOSTS`**:
   - `ALLOWED_HOSTS = ['*']` in settings must be restricted to explicit production domains before deployment.
3. **Default DRF Throttles**:
   - Lack of default global throttles for unauthenticated endpoints. Throttling is currently applied per-view.
4. **UTC Date Bug in Daily Progress**:
   - Date calculations using local `datetime.date.today()` instead of `timezone.now().date()`, causing timezone boundary shifts for client progress metrics.
5. **Open Redis Health Endpoint**:
   - Health check endpoints exposing raw internal cache connection strings or diagnostic details to unauthenticated callers.
6. **Photo Retention & Storage Cleanup**:
   - Orphaned meal images in storage when jobs are cancelled, failed, or discarded without an automated cleanup lifecycle policy.
7. **Profile & Cover Photo Serving in Containers**:
   - Serving user profile pictures and cover photos in containerized environments without public object storage or authenticated proxying.
8. **CI PostgreSQL 15 vs 17 Mismatch**:
   - GitHub Actions CI runner uses PostgreSQL 15, whereas Docker Compose and production environments use PostgreSQL 17. CI runners should be standardized on PostgreSQL 17.
9. **JWT Blacklisting Table Cleanup**:
   - `OutstandingToken` and `BlacklistedToken` tables grow indefinitely without a periodic cron job running `flushexpiredtokens`.
