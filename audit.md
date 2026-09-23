
# Pre-Production Security Audit Report

Conducted for **NutriPlatform** (`personalized-dietary-platform`).  
**Audit Scope**: Django REST backend (`backend/nutriplatform`), FastAPI AI service (`ai-service/food_api`), Next.js 16 frontend (`frontend`), configurations, database schemas, CI/CD, and git history.

---

## Detailed Checklist Findings

### 1. Hide API keys
- **Status**: **FAIL**
- **Evidence**:
  - [`backend/nutriplatform/nutriplatform/settings.py#L171`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L171): Hardcoded fallback internal secret: `AI_SERVICE_SECRET_KEY = config('AI_SERVICE_SECRET_KEY', default='nutriplatform-ai-internal-secret-2026')`.
  - [`ai-service/food_api/app.py#L112-L119`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/ai-service/food_api/app.py#L112-L119): Reads `AI_SERVICE_SECRET_KEY` from env without enforcing startup presence, pairing with the hardcoded backend fallback.
  - [`backend/nutriplatform/.env#L1-L12`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/.env#L1-L12): Contains active local credentials (`SECRET_KEY`, `CALORIE_NINJAS_KEY`, `GROQ_API_KEY`, `DB_PASSWORD`, `AI_SERVICE_SECRET_KEY`).
  - [`ai-service/food_api/.env#L1-L2`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/ai-service/food_api/.env#L1-L2): Contains `CALORIENINJAS_API_KEY` and fallback `AI_SERVICE_SECRET_KEY`.
  - [`frontend/.env.local#L1-L2`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/.env.local#L1-L2): Exposes `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_API_URL`.
- **Risk if unaddressed**: Attackers knowing the default fallback secret key can bypass internal microservice authentication and invoke costly vision-segmentation and nutrition API endpoints directly.
- **Fix**: Remove the default string fallback in [`settings.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L171) (`config('AI_SERVICE_SECRET_KEY')` without default) and add an initialization check in [`app.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/ai-service/food_api/app.py#L113) that raises a `RuntimeError` on startup if `AI_SERVICE_SECRET_KEY` is empty.

---

### 2. Purge Git secrets
- **Status**: **FAIL**
- **Evidence**:
  - Commit `62d741e` ("the backend is coming mfs") committed 7,488 files including the entire `backend/nutriplatform/venv/` directory (virtual environment scripts, `.exe` files, and installed package source trees).
  - While commit `16eabf8` ("chore: remove venv from repository") deleted the working directory files, the objects remain stored in Git history.
  - Active credentials in local uncommitted `.env` files are not currently committed, but `.gitignore` coverage only took full effect in later commits (`0fe1471`).
- **Risk if unaddressed**: Anyone with read access to the git repository or any leaked `.git` directory can retrieve historical commits, access full virtual environment dumps, and extract historical development artifacts.
- **Fix**: Use `git-filter-repo` (`git-filter-repo --path backend/nutriplatform/venv --invert-paths`) or BFG Repo-Cleaner to permanently scrub `venv/` from git history, force-push to remote with `git push --force --all`, and rotate all credentials found in development environments.

---

### 3. Enable row-level security
- **Status**: **FAIL**
- **Evidence**:
  - [`backend/nutriplatform/nutriplatform/settings.py#L96-L105`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L96-L105): Connected to PostgreSQL as superuser `postgres`.
  - Database migrations across `backend/nutriplatform/*/migrations/`: No migration executes `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` or defines `CREATE POLICY`.
  - Multi-tenant data segregation (between clients and nutritionists) relies 100% on application-level filtering in Django ORM views.
- **Risk if unaddressed**: Any application-level vulnerability, accidental ORM filter omission, or SQL injection exposes every tenant's client medical records, invoices, and nutritionist data across the entire database.
- **Fix**: Enable PostgreSQL Row-Level Security on tables containing tenant and user data (`clients`, `user_plans`, `invoices`, `consultations`, `daily_progress_metrics`) using migration SQL statements (`ALTER TABLE clients ENABLE ROW LEVEL SECURITY; CREATE POLICY client_isolation ON clients USING (user_id = current_setting('app.current_user_id')::int);`).

---

### 4. Encrypt sensitive data
- **Status**: **FAIL**
- **Evidence**:
  - [`backend/nutriplatform/client/models.py#L37`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/models.py#L37): `health_history = models.TextField(null=True, blank=True)` stores user medical and dietary health conditions in plaintext.
  - [`backend/nutriplatform/client/models.py#L30-L35`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/models.py#L30-L35): Physical metrics (`weight`, `height`, `bmi`, `bmr`) stored as plaintext floats.
  - [`backend/nutriplatform/marketplace/models.py#L97`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/models.py#L97): `zoom_link = models.CharField(...)` stores private consultation meeting links in plaintext.
  - [`backend/nutriplatform/marketplace/models.py#L126`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/models.py#L126): `transaction_number = models.CharField(...)` stored in plaintext.
  - [`backend/nutriplatform/nutriplatform/settings.py#L70-L73`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L70-L73): `SECURE_SSL_REDIRECT` is omitted (defaults to `False`), failing to mandate in-transit TLS at the application layer.
- **Risk if unaddressed**: A database leak, backup compromise, or unencrypted storage snapshot will expose confidential patient medical histories and video consultation links, violating GDPR and HIPAA/health data privacy compliance standards.
- **Fix**: Implement field-level encryption using `django-cryptography` or `cryptography.fernet` on `health_history`, consultation `zoom_link`, and private patient notes, and configure `SECURE_SSL_REDIRECT = True` and `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` in [`settings.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py).

---

### 5. Enforce server-side auth
- **Status**: **FAIL**
- **Evidence**:
  - [`backend/nutriplatform/marketplace/views.py#L88-L103`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/views.py#L88-L103) (`MarketplacePlanDetailView`): Uses `permission_classes = [AllowAny]` and returns `PlanDetailSerializer(plan).data`, which directly returns the entire paid meal plan (`content_json`) to unauthenticated callers.
  - [`frontend/src/lib/api.ts#L382-L391`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/lib/api.ts#L382-L391): The frontend attempted to restrict this by creating a Next.js preview proxy route, but the server-side Django endpoint remained open and unprotected.
  - [`backend/nutriplatform/chatbot/views.py#L27-L38`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/chatbot/views.py#L27-L38): Unthrottled authenticated access to Groq LLM API.
- **Risk if unaddressed**: Unauthenticated users and scrapers can bypass the frontend UI and query the Django API directly to download all proprietary, paid nutritionist meal plans and recipes without purchasing them.
- **Fix**: In [`marketplace/serializers.py#L33-L47`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/serializers.py#L33-L47), remove `content_json` from `PlanDetailSerializer` and provide only Day-1 preview data; require authentication and verified purchase checks via [`client/views.py#L270-L336`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/views.py#L270-L336) (`UserPlanContentView`) for full access.

---

### 6. Lock record access (IDOR)
- **Status**: **PARTIAL**
- **Evidence**:
  - Pass: [`backend/nutriplatform/client/views.py#L432-L442`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/views.py#L432-L442) (`InvoiceDetailView`): Verifies `is_owner = (invoice.client.user == user or invoice.nutritionist.user == user or user.role == 'high_admin')`.
  - Pass: [`backend/nutriplatform/client/views.py#L280`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/views.py#L280) (`UserPlanContentView`): Verifies `UserPlan.objects.get(id=pk, client=client)`.
  - Pass: [`backend/nutriplatform/client/views.py#L766`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/views.py#L766) (`AICalorieStatusView`): Scoped to `client=client`.
  - Pass: [`backend/nutriplatform/nutritionist/views.py#L596`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutritionist/views.py#L596) (`NutritionistPatientDetailView`): Scoped to `nutritionist=nutritionist`.
  - Fail: [`backend/nutriplatform/marketplace/views.py#L112-L115`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/views.py#L112-L115) (`PlanPurchaseView`): Does not verify `client.is_banned` or account standing before binding resources.
  - Fail: [`backend/nutriplatform/admin_panel/views.py#L50-L54`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/admin_panel/views.py#L50-L54): Duplicated routes between `admin_panel` and `nutriplatform/urls.py` have inconsistent permission binding (`IsAdmin` vs staff permissions).
- **Risk if unaddressed**: Banned or restricted client profiles can continue to bind plan and consultation resources, and permission drift across duplicated route definitions can allow unauthorized actions.
- **Fix**: Centralize permission checking using DRF object-level permissions (`rest_framework.permissions.BasePermission.has_object_permission`), verify `not client.is_banned` in base client permission classes, and deduplicate route definitions in `admin_panel/urls.py`.

---

### 7. Block field tampering
- **Status**: **FAIL**
- **Evidence**:
  - [`backend/nutriplatform/admin_panel/views.py#L540-L586`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/admin_panel/views.py#L540-L586) (`SubscriptionPurchaseView`):
    - Reads `amount_paid = serializer.validated_data['amount_paid']` directly from client request payload.
    - Sets `client.is_premium = True` and grants a 1-year subscription with **zero server-side price validation** and **no payment processor verification**. Any user can submit `{"plan_type": "yearly", "amount_paid": 0.00, "transaction_number": "fake"}` and get upgraded to premium for free.
  - [`backend/nutriplatform/nutritionist/views.py#L78-L82`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutritionist/views.py#L78-L82) (`NutritionistProfileView.patch`):
    - Uses `setattr(nutritionist, field, request.data[field])` directly without validating whether `consultation_price` is negative or non-numeric.
  - [`backend/nutriplatform/marketplace/checkout_views.py#L92-L99`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/checkout_views.py#L92-L99): Arbitrary client metadata dictionary is unpacked directly into the database session without field sanitization.
- **Risk if unaddressed**: Any registered client can activate a free 1-year premium subscription via price tampering, and nutritionists can set negative consultation rates that corrupt financial records.
- **Fix**: In [`SubscriptionPurchaseView`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/admin_panel/views.py#L548), ignore client-provided `amount_paid` and look up the authoritative price from `SubscriptionTierPricing` in PostgreSQL; validate `consultation_price > 0` using a strict DRF serializer validator.

---

### 8. Secure session cookies
- **Status**: **FAIL**
- **Evidence**:
  - [`frontend/src/lib/auth.ts#L38-L48`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/lib/auth.ts#L38-L48):
    - `access_token` and `refresh_token` are written via `document.cookie` in client-side TypeScript:
      `document.cookie = access_token=${token}; path=/; max-age=3600${getSecurityFlags()};`
      `document.cookie = refresh_token=${token}; path=/; max-age=604800${getSecurityFlags()};`
    - Because they are created by JavaScript, they are **NOT `HttpOnly`**.
  - [`frontend/src/lib/auth.ts#L31-L36`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/lib/auth.ts#L31-L36): `getSecurityFlags()` omits the `Secure` attribute unless the protocol is `https:`.
  - [`backend/nutriplatform/nutriplatform/settings.py#L52-L61`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L52-L61): `SESSION_COOKIE_SECURE = True`, `CSRF_COOKIE_SECURE = True`, and `CSRF_COOKIE_HTTPONLY = True` are omitted.
- **Risk if unaddressed**: If any XSS vulnerability or malicious third-party script executes in the client browser, both access and 7-day refresh tokens can be immediately stolen from `document.cookie`.
- **Fix**: Issue JWT tokens inside server-set `Set-Cookie` headers with `HttpOnly; Secure; SameSite=Lax` (or `SameSite=Strict` for refresh token) directly from Django REST framework views, configure `SESSION_COOKIE_SECURE = True` and `CSRF_COOKIE_SECURE = True` in [`settings.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py), and remove cookie-writing code from client JavaScript.

---

### 9. Hash passwords
- **Status**: **PASS**
- **Evidence**:
  - [`backend/nutriplatform/users/models.py#L11`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/models.py#L11): `user.set_password(password)` is invoked on user creation via `UserManager`.
  - [`backend/nutriplatform/users/serializers.py#L82-L87`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/serializers.py#L82-L87) & [`L176-L181`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/serializers.py#L176-L181): User creation calls `User.objects.create_user(...)`.
  - [`backend/nutriplatform/nutriplatform/settings.py#L108-L113`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L108-L113): Configures standard `AUTH_PASSWORD_VALIDATORS` (`MinimumLengthValidator`, `CommonPasswordValidator`, etc.).
  - Django 5.x defaults to `PBKDF2PasswordHasher` with SHA-256 and 720,000 salted iterations.
- **Risk if unaddressed**: None.
- **Fix**: (Recommended hardening) Upgrade to Argon2id by installing `argon2-cffi` and setting `PASSWORD_HASHERS = ['django.contrib.auth.hashers.Argon2PasswordHasher', ...]` in `settings.py`.

---

### 10. Rate limit login
- **Status**: **PARTIAL**
- **Evidence**:
  - Implemented: [`backend/nutriplatform/users/views.py#L18, L52, L99`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/views.py#L18):
    - `RegisterClientView`, `RegisterNutritionistView`, and `LoginView` use `@method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))`.
    - [`backend/nutriplatform/nutriplatform/settings.py#L200-L210`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L200-L210): Configured with Redis fail-closed backend (`IGNORE_EXCEPTIONS = False`).
  - Gaps:
    - Rate limit is strictly per-IP (`key='ip'`), not per-account (email/username).
    - No account lockout or exponential backoff mechanism after consecutive failed logins.
    - [`backend/nutriplatform/users/urls.py#L16`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/urls.py#L16): `token/refresh/` (`TokenRefreshView`) has no rate limiting.
    - [`backend/nutriplatform/chatbot/views.py#L27`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/chatbot/views.py#L27): `ChatbotView` has no rate limiting.
- **Risk if unaddressed**: Attackers operating distributed proxy pools can brute-force passwords across known user accounts without ever exceeding the 5 requests/minute per-IP ceiling.
- **Fix**: Add `django-axes` for account lockout after 5 consecutive failed attempts (locking by account username/email and IP combo with an incremental cool-off period), and apply `ratelimit(key='post:email', rate='5/m')` on `LoginView`.

---

### 11. Add bot protection
- **Status**: **FAIL**
- **Evidence**:
  - Grep search for CAPTCHA/bot defense (`captcha`, `turnstile`, `hcaptcha`, `honeypot`) across all frontend and backend source files returned 0 matches.
  - Critical unshielded public endpoints:
    - `POST /api/v1/auth/register/client/` ([`users/views.py#L19`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/views.py#L19))
    - `POST /api/v1/auth/register/nutritionist/` ([`users/views.py#L53`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/views.py#L53))
    - `POST /api/v1/auth/login/` ([`users/views.py#L96`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/views.py#L96))
    - `POST /api/v1/posts/<pk>/comments/` ([`community/views.py#L94`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/community/views.py#L94))
- **Risk if unaddressed**: Automated bots can flood the registration system with fake nutritionist and client accounts, spam community forums, and exhaust Redis and database storage.
- **Fix**: Integrate Cloudflare Turnstile or Google reCAPTCHA v3 into registration, login, and comment submission forms, validating the client token on the Django server before serializer processing.

---

### 12. Parameterize queries
- **Status**: **PASS**
- **Evidence**:
  - Grep search across `backend/nutriplatform`:
    - `.raw()`: 0 occurrences
    - `cursor.execute()`: 0 occurrences
    - `.extra()`: 0 occurrences
    - `RawSQL()`: 0 occurrences
  - All database queries across all apps use Django's ORM query builder (`.filter()`, `.select_related()`, `.create()`, `.update()`), ensuring SQL queries are parameterized by the database driver.
- **Risk if unaddressed**: None.
- **Fix**: Maintain current ORM practices and add a static analysis tool (`bandit` or `flake8-django`) in CI to prevent introduction of raw query interpolation.

---

### 13. Validate all input
- **Status**: **PARTIAL**
- **Evidence**:
  - Structured serializers exist for client registration and profile updates ([`users/serializers.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/serializers.py), [`client/serializers.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/serializers.py)).
  - Broken/Incomplete input validation across several views:
    - [`backend/nutriplatform/nutritionist/views.py#L78-L82`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutritionist/views.py#L78-L82): Iterates over `request.data` directly and runs `setattr(nutritionist, field, ...)` without type, bounds, or range checks on `years_experience` or `consultation_price`.
    - [`backend/nutriplatform/community/views.py#L103-L105`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/community/views.py#L103-L105): Reads raw `content = request.data.get('content')` without length or content sanitization.
    - [`backend/nutriplatform/client/views.py#L667-L677`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/views.py#L667-L677): Ad-hoc checks for `meal_type` instead of serializer schema validation.
    - [`backend/nutriplatform/admin_panel/views.py#L790-L815`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/admin_panel/views.py#L790-L815): Ad-hoc dictionary checks on subscription pricing updates instead of serializer validation.
- **Risk if unaddressed**: Malformed types or unvalidated numerical ranges can cause unhandled 500 exceptions, data corruption, or denial-of-service via large payload submissions.
- **Fix**: Require every endpoint to use a DRF `Serializer` with explicit `validators`, `min_value`, `max_value`, and `max_length` constraints, eliminating all manual `request.data.get()` and `setattr()` logic.

---

### 14. Escape user content
- **Status**: **PASS**
- **Evidence**:
  - Frontend: [`frontend/src/app/(main)/loading.tsx#L48-L57`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/app/%28main%29/loading.tsx#L48-L57) is the only occurrence of `dangerouslySetInnerHTML`, containing static inline CSS `@keyframes`.
  - Zero occurrences of `innerHTML`, `outerHTML`, or `v-html` handling user input.
  - Blog and community posts render user input via React JSX text expressions (e.g. [`SingleBlogPostPageComponent.tsx#L137`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/components/SingleBlogPostPageComponent.tsx#L137) `<p className="whitespace-pre-wrap">{post.content}</p>`), which automatically HTML-escapes content.
  - Django backend template configurations in [`settings.py#L77-L91`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L77-L91) have autoescaping enabled.
- **Risk if unaddressed**: None.
- **Fix**: Enable the `react/no-danger` ESLint rule in [`eslint.config.mjs`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/eslint.config.mjs) to prevent future additions of un-sanitized raw HTML injection.

---

### 15. Restrict file uploads
- **Status**: **FAIL**
- **Evidence**:
  - Path traversal risk (raw filename concatenation):
    - [`backend/nutriplatform/community/views.py#L49`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/community/views.py#L49): `default_storage.save(f'posts/{request.user.id}_{image.name}', image)`
    - [`backend/nutriplatform/users/serializers.py#L93`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/serializers.py#L93): `f'profiles/clients/{user.id}_{profile_photo.name}'`
    - [`backend/nutriplatform/users/serializers.py#L191`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/serializers.py#L191): `f'profiles/nutritionists/{user.id}_{profile_photo.name}'`
    - [`backend/nutriplatform/nutritionist/views.py#L72`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutritionist/views.py#L72): `f'profiles/nutritionists/{request.user.id}_{photo.name}'`
    - [`backend/nutriplatform/nutritionist/views.py#L412`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutritionist/views.py#L412): `f'plans/covers/{nutritionist.nutritionist_id}_{cover_image.name}'`
  - Missing file size validation:
    - Enforced only in `client/views.py:679` (10MB for AI vision); **completely absent** in `community/views.py`, `nutritionist/views.py`, and `users/serializers.py`.
  - Missing magic byte / MIME inspection:
    - No endpoint inspects file headers or magic bytes using `python-magic` or Pillow `Image.verify()`. Any file extension or spoofed MIME type is accepted.
  - Storage location:
    - Saved directly to local filesystem under `MEDIA_ROOT = BASE_DIR / 'media'` ([`settings.py#L126`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L126)) and served via Django URL patterns ([`urls.py#L30`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/urls.py#L30)).
- **Risk if unaddressed**: Attackers can upload malicious files (e.g. SVG with embedded JavaScript leading to stored XSS, HTML files, or oversized files) and trigger path traversal or server disk exhaustion.
- **Fix**: Sanitize filenames by replacing user-supplied names with random UUIDs (`uuid.uuid4().hex + ext`), validate file content with Pillow (`Image.open(file).verify()`) or `python-magic`, enforce a strict 5MB upload ceiling, and move file storage to cloud object storage (AWS S3 or Cloudflare R2) with `django-storages` and private/signed URLs.

---

### 16. Trim API responses
- **Status**: **FAIL**
- **Evidence**:
  - [`backend/nutriplatform/marketplace/serializers.py#L28-L59`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/serializers.py#L28-L59) (`PlanDetailSerializer`): Includes `content_json` in its public fields.
  - [`backend/nutriplatform/marketplace/views.py#L88-L103`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/views.py#L88-L103) (`MarketplacePlanDetailView`): Directly serializes `PlanDetailSerializer(plan).data` to anyone hitting `GET /api/v1/marketplace/plans/<id>/`.
  - Full, proprietary multi-day recipe and meal contents intended only for paying clients are leaked in the public API response.
- **Risk if unaddressed**: The platform's commercial value is compromised because any user or competitor can scrape all paid nutrition plans in full without paying.
- **Fix**: Exclude `content_json` from `PlanDetailSerializer`, create a lightweight `PlanPreviewSerializer` returning only Day-1 metadata for the marketplace directory, and restrict full multi-day content to `UserPlanContentView` with verified ownership checks.

---

### 17. Add security headers
- **Status**: **FAIL**
- **Evidence**:
  - Backend [`backend/nutriplatform/nutriplatform/settings.py#L70-L73`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L70-L73):
    - Sets: `SECURE_BROWSER_XSS_FILTER = True`, `SECURE_CONTENT_TYPE_NOSNIFF = True`, `X_FRAME_OPTIONS = 'DENY'`.
    - Missing: `Content-Security-Policy` (CSP), `Strict-Transport-Security` (HSTS), `Permissions-Policy`, and `Referrer-Policy`.
  - Frontend [`frontend/next.config.ts#L1-L29`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/next.config.ts#L1-L29):
    - Contains no `headers()` method. The Next.js frontend delivers zero security headers to client browsers.
- **Risk if unaddressed**: Lack of CSP and Permissions-Policy exposes the application to unauthorized script execution, iframe embedding, and device feature abuse, while lack of HSTS allows SSL stripping attacks.
- **Fix**: Configure `django-csp` on the backend, and in [`frontend/next.config.ts`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/next.config.ts) export an `async headers()` configuration setting CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

---

### 18. Force HTTPS
- **Status**: **FAIL**
- **Evidence**:
  - [`backend/nutriplatform/nutriplatform/settings.py#L9-L11`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L9-L11): `ALLOWED_HOSTS = ['*']` allows arbitrary host headers.
  - [`backend/nutriplatform/nutriplatform/settings.py#L70-L74`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L70-L74): `SECURE_SSL_REDIRECT = True` is missing.
  - `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`, and `SECURE_HSTS_PRELOAD` are missing.
  - `SESSION_COOKIE_SECURE` and `CSRF_COOKIE_SECURE` are missing.
  - [`frontend/src/lib/auth.ts#L31-L36`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/lib/auth.ts#L31-L36): Cookie flags only set `Secure` dynamically if already under `https:`.
- **Risk if unaddressed**: Man-in-the-middle (MITM) attackers can intercept unencrypted HTTP traffic, steal session tokens, or execute SSL-stripping attacks against connecting users.
- **Fix**: In [`settings.py`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py), configure `SECURE_SSL_REDIRECT = True`, `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')`, `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`, `SECURE_HSTS_PRELOAD = True`, `SESSION_COOKIE_SECURE = True`, and restrict `ALLOWED_HOSTS` to explicit domain names.

---

### 19. Scan dependencies
- **Status**: **FAIL**
- **Evidence**:
  - Repository has no `.github/workflows/` directory and no CI/CD automation configured.
  - No `.github/dependabot.yml` exists.
  - Backend [`requirements.txt`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/requirements.txt): Pinned packages lack hash verification (`--require-hashes`), and no lockfile (`poetry.lock` or `Pipfile.lock`) exists.
  - No automated `pip-audit` or `npm audit` is wired into git hooks or pull request checks.
- **Risk if unaddressed**: Known high and critical vulnerabilities in third-party Python or Node dependencies will enter production undetected without an automated alert or patch mechanism.
- **Fix**: Add `.github/dependabot.yml` covering `npm` and `pip`, and create a GitHub Actions workflow (`.github/workflows/ci.yml`) running `npm audit --audit-level=high` and `pip-audit -r requirements.txt` on every pull request.

---

## Audit Summary Table (Sorted by Severity)

| # | Item | Status | Severity | Primary Evidence |
|---|---|---|---|---|
| **7** | **Block field tampering** | **FAIL** | **CRITICAL** | [`admin_panel/views.py:548`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/admin_panel/views.py#L548) (`amount_paid: 0.00` grants free premium subscription) |
| **5** | **Enforce server-side auth** | **FAIL** | **CRITICAL** | [`marketplace/views.py:88-103`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/views.py#L88-L103) (`AllowAny` endpoint leaks full paid `content_json`) |
| **16** | **Trim API responses** | **FAIL** | **CRITICAL** | [`marketplace/serializers.py:43`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/serializers.py#L43) (`content_json` serialized in public plan detail view) |
| **8** | **Secure session cookies** | **FAIL** | **HIGH** | [`frontend/src/lib/auth.ts:40,46`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/lib/auth.ts#L40) (JWT tokens stored in non-HttpOnly `document.cookie`) |
| **15** | **Restrict file uploads** | **FAIL** | **HIGH** | [`community/views.py:49`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/community/views.py#L49), [`users/serializers.py:93`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/serializers.py#L93) (No magic bytes, un-sanitized filenames, no size bounds) |
| **1** | **Hide API keys** | **FAIL** | **HIGH** | [`settings.py:171`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L171) (Hardcoded default secret `nutriplatform-ai-internal-secret-2026`) |
| **4** | **Encrypt sensitive data** | **FAIL** | **HIGH** | [`client/models.py:37`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/client/models.py#L37) (`health_history` stored as plaintext in database) |
| **18** | **Force HTTPS** | **FAIL** | **HIGH** | [`settings.py:70-74, 11`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L70-L74) (`SECURE_SSL_REDIRECT` missing, `ALLOWED_HOSTS = ['*']`) |
| **2** | **Purge Git secrets** | **FAIL** | **HIGH** | Commit `62d741e` (Committed entire `venv/` tree with 7,488 files in git history) |
| **10** | **Rate limit login** | **PARTIAL** | **MEDIUM** | [`users/views.py:99`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/views.py#L99) (Rate limiting is IP-only, no account lockout or exponential backoff) |
| **11** | **Add bot protection** | **FAIL** | **MEDIUM** | [`users/views.py:18,52,99`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/views.py#L18) (Zero CAPTCHA/bot protection on registration or login) |
| **17** | **Add security headers** | **FAIL** | **MEDIUM** | [`next.config.ts:1-29`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/next.config.ts#L1-L29), [`settings.py:70`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L70) (Missing CSP, HSTS, Permissions-Policy) |
| **13** | **Validate all input** | **PARTIAL** | **MEDIUM** | [`nutritionist/views.py:78-82`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutritionist/views.py#L78-L82) (Direct `setattr` bypasses serializer validation) |
| **19** | **Scan dependencies** | **FAIL** | **MEDIUM** | `.github/` (No Dependabot, no CI vulnerability scanning, no Python lockfile) |
| **3** | **Enable row-level security**| **FAIL** | **MEDIUM** | PostgreSQL migrations (No RLS policies defined at DB layer) |
| **6** | **Lock record access (IDOR)**| **PARTIAL** | **LOW** | [`marketplace/views.py:112`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/views.py#L112) (Core views check ownership, but banned checks missing) |
| **9** | **Hash passwords** | **PASS** | **LOW** | [`users/models.py:11`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/models.py#L11) (PBKDF2 with SHA-256 and 720k iterations) |
| **12** | **Parameterize queries** | **PASS** | **LOW** | All backend queries use standard Django ORM methods |
| **14** | **Escape user content** | **PASS** | **LOW** | React JSX auto-escaping, no un-sanitized `dangerouslySetInnerHTML` |

---

## Top 5 "Fix These Before Launch" List

### 1. Close the Free Premium Subscription Bypass (Field & Price Tampering)
- **Files**: [`backend/nutriplatform/admin_panel/views.py#L531-L592`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/admin_panel/views.py#L531-L592), [`admin_panel/serializers.py#L107-L113`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/admin_panel/serializers.py#L107-L113).
- **Action**: Disallow client-provided `amount_paid`. In `SubscriptionPurchaseView`, look up the official price from `SubscriptionTierPricing` and integrate real Stripe PaymentIntent verification (`stripe.PaymentIntent.retrieve()`) before setting `client.is_premium = True`.

### 2. Plug the Paid Meal Plan Data Leak (Overfetching / Server-Side Auth)
- **Files**: [`backend/nutriplatform/marketplace/views.py#L88-L103`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/views.py#L88-L103), [`marketplace/serializers.py#L28-L59`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/marketplace/serializers.py#L28-L59).
- **Action**: Remove `content_json` from `PlanDetailSerializer`. Return only metadata and an optional single Day-1 preview in public marketplace endpoints, enforcing that full recipes/instructions can only be retrieved by authenticated buyers through `UserPlanContentView`.

### 3. Migrate JWT Tokens to Server-Side `HttpOnly` Cookies
- **Files**: [`frontend/src/lib/auth.ts#L38-L54`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/src/lib/auth.ts#L38-L54), [`backend/nutriplatform/users/views.py#L104-L116`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/views.py#L104-L116).
- **Action**: Stop writing tokens via `document.cookie`. Set tokens via Django response headers (`Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax` and `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/token/refresh/`).

### 4. Harden File Uploads Against Path Traversal & Remote Code Execution
- **Files**: [`community/views.py#L49`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/community/views.py#L49), [`users/serializers.py#L93, L191`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/users/serializers.py#L93), [`nutritionist/views.py#L72, L412`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutritionist/views.py#L72).
- **Action**: Replace user filenames with `uuid.uuid4().hex`, validate file contents with Pillow (`Image.open(file).verify()`) and magic bytes, enforce a universal 5MB maximum file size limit, and disallow executable or scriptable formats (such as `.svg`).

### 5. Enforce Production HTTPS, Host Locking, and Security Headers
- **Files**: [`backend/nutriplatform/nutriplatform/settings.py#L9-L12, L70-L74`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/backend/nutriplatform/nutriplatform/settings.py#L9-L12), [`frontend/next.config.ts#L1-L29`](file:///c:/Users/akram/thesis_project/personalized-dietary-platform/frontend/next.config.ts#L1-L29).
- **Action**: In `settings.py`, replace `ALLOWED_HOSTS = ['*']` with your explicit production domains; set `SECURE_SSL_REDIRECT = True`, `SECURE_HSTS_SECONDS = 31536000`, `SECURE_HSTS_INCLUDE_SUBDOMAINS = True`, `SESSION_COOKIE_SECURE = True`, and `CSRF_COOKIE_SECURE = True`. In `next.config.ts`, add custom response headers enforcing CSP, HSTS, `X-Frame-Options: DENY`, and `X-Content-Type-Options: nosniff`.