# Workstream Handoff: Asynchronous AI Calorie Estimation Pipeline

This document details the architectural decisions, database contracts, RLS isolation policies, operational deployment order, and adjacent workstreams for the NutriPlatform AI Calorie Estimation system.

---

## 1. Row-Level Security (RLS) Operational Contract

The database enforces multi-tenant Row-Level Security (RLS) on PostgreSQL across all sensitive tables, including `ai_calorie_logs`.

### 1.1 Session Variables & The `is_staff` Staff Super-Alias Reality
The PostgreSQL session variables configured in `RLSMiddleware` and `set_rls_context()` are:
- `app.current_user_id`: Integer string of the authenticated user's ID (`User.id`), or `''` when unauthenticated.
- `app.is_staff`: `'true'` if user is staff/admin/superuser or during elevated system worker execution, else `'false'`.
- `app.is_system_worker`: `'true'` when executing background worker or internal maintenance operations, else `'false'`.

> [!IMPORTANT]
> **Operational Contract Correction**: Database policy probing confirmed that **zero RLS policies** in PostgreSQL evaluate `app.is_system_worker` directly. Every policy across all 7 RLS tables (`ai_calorie_logs`, `clients`, `consultations`, `daily_progress_metrics`, `invoices`, `patient_notes`, `user_plans`) checks `current_setting('app.is_staff', true) = 'true'`.
> When `set_rls_context(is_system_worker=True)` is called, it explicitly sets `app.is_staff = 'true'`. It functions as a **full staff super-alias** across every tenant table in the system.
> **Worker Cross-Tenant Scope**: The background worker daemon (`run_ai_worker`) still has and requires **full cross-tenant access** via `set_rls_context(is_system_worker=True)` to discover queued jobs, recover stale leases across all tenants, and enforce SLA deadlines.

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
| **Global Queue Cap** (`submit`) | (Planned for Release 4: `get_ai_queue_cap_metrics()`) | Currently Web Tier Elevation (`is_system_worker=True`) | `current_setting('app.is_staff', true) = 'true'` |
| **Queue Position** (`status`) | (Planned for Release 4: `get_ai_queue_position()`) | Currently Web Tier Elevation (`is_system_worker=True`) | `current_setting('app.is_staff', true) = 'true'` |
| **Deadline Fallback** (`status`) | (Planned for Release 4: `evaluate_ai_job_deadline()`) | Currently Web Tier Elevation (`is_system_worker=True`) | `current_setting('app.is_staff', true) = 'true'` |
| **Staff Queue Health** (`queue-health`) | (Planned for Release 4: `get_ai_queue_health()`) | Currently Authenticated Staff Context | `current_setting('app.is_staff', true) = 'true'` |

### 1.4 Web Tier Elevation Elimination (Planned for Release 4)
The 4 web-tier elevation points in `client/views.py` currently elevate to `is_system_worker=True` (which sets `app.is_staff='true'`) inside `try...finally` blocks. This migration to 4 narrow `SECURITY DEFINER` functions is **planned for Release 4, not yet executed**. In production today, the background worker and these 4 web endpoints retain cross-tenant access via the staff alias. In Release 4, web endpoints will lose this elevation completely.

### 1.5 Test Database Non-Superuser Role
PostgreSQL superusers bypass RLS policies unconditionally (`BYPASSRLS`). Automated security tests switch database sessions to the unprivileged role `nutriplatform_app` (`SET ROLE nutriplatform_app;`) to strictly verify that cross-tenant access is rejected by PostgreSQL.

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

---

## 5. Media Serving & Upload Security (Release 2)

### 5.1 Authoritative 4-Tier Media Classification
All media requests are routed exclusively through Django's `AuthoritativeMediaServeView` mounted at `media/<path:file_path>`. The legacy `static(settings.MEDIA_URL)` helper has been completely removed across both `DEBUG=True` and `DEBUG=False`.

| Tier | Path Prefix / Asset | Access Control Policy | Content Disposition | Header & Security Enforcements |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | `certifications/*` | **Staff Only** (`user.is_staff` or superuser). Anonymous and non-staff receive 401/403. | `attachment; filename="certification.<ext>"` (Forces download, prevents browser execution) | `X-Content-Type-Options: nosniff`<br>`Content-Security-Policy: default-src 'none'; sandbox` |
| **Tier 2** | `profiles/clients/*` | **Owner, Assigned Nutritionist, or Staff**.<br>- Owner: `Client.user == request.user`<br>- Assigned: `NutritionistPatient` active relationship<br>- Staff: `user.is_staff`<br>Other users receive 403. | `inline` | `X-Content-Type-Options: nosniff`<br>`Content-Security-Policy: default-src 'none'; sandbox` |
| **Tier 3** | `profiles/nutritionists/*`, `plans/covers/*`, `posts/*`, defaults | **Authenticated Users** (or public for exact default placeholders: `default_avatar.png`, `default_nutri.png`, `default_plan_cover.jpg`). Anonymous requests for tenant assets receive 401. | `inline` | `X-Content-Type-Options: nosniff`<br>`Content-Security-Policy: default-src 'none'; sandbox` |
| **Tier 4** | `ai_logs/*` | **Hard Blocked**. Returns HTTP 404 unconditionally, even if the file exists on disk, in both `DEBUG=True` and `DEBUG=False`. | N/A | Never served via HTTP. Internal worker access only. |

### 5.2 RLS Independence & Explicit-Check Contract
1. **RLS Independence**: Today, Django runs under the PostgreSQL superuser (`postgres`), which unconditionally bypasses RLS (`BYPASSRLS`). The avatar check must never rely on RLS alone. Authorization in `AuthoritativeMediaServeView` performs explicit Python/ORM joins:
   - Client ownership: `Client.objects.filter(user=request.user, profile_photo_url=clean_path).exists()`
   - Assigned nutritionist: `NutritionistPatient.objects.filter(nutritionist__user=request.user, client__profile_photo_url=clean_path).exists()`
2. **Restricted Role Compatibility**: When testing or executing under `SET ROLE nutriplatform_app`, the view initializes RLS context via `set_rls_context(request.user)` so tenant queries execute safely under PostgreSQL RLS.
3. **Prohibition of Web Elevation**: Web-tier serving code must **never** set `app.is_staff = 'true'` or `app.is_system_worker = 'true'`.
4. **Preservation Guarantee for RLS Workstream**: The RLS workstream must preserve the `nutritionist_patients` visibility for assigned nutritionists when switching connection pools to `nutriplatform_app`.

### 5.3 Frontend Media Proxying Architecture
- **Route Handler**: Next.js App Router implements `/api/backend/media/[...path]` in `frontend/src/app/api/backend/media/[...path]/route.ts`.
- **HttpOnly Cookie Forwarding**: Browsers cannot access `access_token` via JavaScript for `<img>` tags or `<a href>` links. Same-origin proxying ensures the browser includes the HttpOnly session cookie on every media request. The route handler forwards it as `Authorization: Bearer <token>` to upstream Django.
- **Automatic Token Refresh**: If upstream returns 401, the route handler exchanges `refresh_token` for a fresh `access_token`, updates the client session cookie, and retries the upstream request.
- **Universal Resolution**: `resolveApiUrl(url)` in `frontend/src/lib/api.ts` maps relative media paths and localhost backend URLs to `/api/backend/media/...` in both browser and SSR contexts.

### 5.4 Deployment Order & Rollback Strategy
1. **Pre-Deployment Audit**:
   - Run `python manage.py audit_and_sanitize_media --dry-run` to inspect all media files and generate an inventory of valid vs non-conforming files.
2. **Production Media Sanitization (`--apply`)**:
   - Run `python manage.py audit_and_sanitize_media --apply`.
   - Rejects are moved to an out-of-tree quarantine directory (`../media_quarantine_<timestamp>`).
   - A JSON mapping file (`quarantine_mapping_<timestamp>.json`) records `original_path`, `new_path`, and hashes.
   - Rollback is instantaneous by executing an out-of-tree script copying original files back from quarantine using the mapping file.
3. **Deploy Code & Configuration**:
   - Deploy backend code removing `static(settings.MEDIA_URL)` and mounting `AuthoritativeMediaServeView`.
   - Deploy Next.js frontend with `/api/backend/media/[...path]` route handler and updated `resolveApiUrl`.
4. **Release 3 Note (Throttling Scope)**:
   - In Release 3 (Rate Limiting & Throttling), `/media/<path:file_path>` must be assigned a dedicated DRF throttle scope (`media_serving`) to prevent volumetric download abuse or slowloris file reads.
