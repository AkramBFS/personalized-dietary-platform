Full Repository Technical Audit: SVMB (NutriPlatform)

Audit Target: SVMB Personalized Dietary Platform
Target Architecture: Monorepo (frontend/, backend/, ai-service/)
Auditor: Senior Staff Engineer
Date: October 2026
Operating System Tested: Windows 11 / Python 3.11.9 / Node v24.20.0 / PostgreSQL 17

1. Executive Summary

SVMB is an ambitious full-stack nutrition platform composed of a Next.js 16 frontend, a Django REST Framework (DRF) backend, and a FastAPI/ONNX computer-vision AI microservice. While the system demonstrates functional modularity, modern UI styling, and active database migrations, an extensive gap exists between documented architectural claims and actual implementation. Critical security and financial boundaries are bypassed in production code: payment verification logic accepts arbitrary transaction strings and sandbox tokens, allowing users to secure premium subscriptions and marketplace checkouts without invoking Stripe; PostgreSQL Row-Level Security (RLS) policies are completely neutralized because the application executes as a PostgreSQL superuser; and profile image uploads in authentication serializers bypass magic-byte verification entirely.

Furthermore, several user flows present simulated facades rather than functional systems: support ticket submissions discard data and present "demo mode" toasts, consultation booking routes point to deprecated backend endpoints, and Zoom integration is an unvalidated plain-text string. The AI calorie pipeline operates synchronously on CPU inside standard Django HTTP request-response cycles with a 60-second timeout, risking worker starvation under concurrent loads. Finally, the test landscape is severely asymmetric: three core Django applications have zero tests, and the frontend CI lint gate fails with 201 errors and hangs due to recursive unignored webview binaries.

Top 8 Ranked Critical Issues
Payment Intent Verification Bypass (Confirmed): Payment endpoints accept unverified client-supplied identifiers (transaction_number or pm_card_visa), granting 1-year subscriptions and marketplace purchases without charging cards or confirming Stripe PaymentIntents.
PostgreSQL RLS Neutralization via Superuser Role (Confirmed): Database connections authenticate as DB_USER=postgres, which unconditionally bypasses native PostgreSQL Row-Level Security on all 7 tenant tables.
Synchronous Blocking AI Pipeline on CPU (Confirmed): Django blocks for up to 60s waiting on an external FastAPI inference call executing CPU-bound ONNX segmentation without background task queues (Celery/RQ).
Bypassed Image Sanitization in User Serializers (Confirmed): Core user profile and registration serializers write raw uploaded files directly to disk using unvetted filenames, bypassing the dedicated validate_and_sanitize_image module.
Contract Drift in Consultation Booking (Confirmed): The frontend checkout flow calls a deprecated booking endpoint that returns an intentional HTTP 400 error.
ESLint CI Pipeline Failure and Hanging Build (Confirmed): npm run lint hangs indefinitely due to nested .laufey_webview artifacts, reporting 201 lint errors (99 fatal errors) across production components.
Stubbed Support Ticket System & Swallowed UI Errors (Confirmed): Support submissions discard user payload data and present client-side demo toasts, while nutritionist support routes return HTTP 403 Forbidden.
Untested Core Business Domains (Confirmed): The nutritionist, community, and notifications backend apps contain empty 4-line boilerplate test files with 0% automated test coverage.
2. Repository Overview
Monorepo Structure and Service Topology
personalized-dietary-platform/
├── frontend/             # Next.js 16.0 (Turbopack, React 19, Tailwind, Radix/shadcn)
├── backend/nutriplatform/# Django 5.1.7 REST Framework modular monolith
│   ├── admin_panel/      # Platform admin, subscription plans, system logs
│   ├── chatbot/          # LLM diet assistant (Groq API integration)
│   ├── client/           # Client health profile, macro logs, meal records
│   ├── community/        # Blog articles, comments, forum posts
│   ├── marketplace/      # Meal plans, consultation bookings, Stripe checkout
│   ├── notifications/    # In-app notifications and email dispatch
│   ├── nutritionist/     # Schedules, availability, consultation records
│   └── users/            # Custom User model, JWT authentication, RBAC
├── ai-service/           # FastAPI 0.115, ONNX Runtime, YOLOv8 segmentation
└── docker-compose.yml    # Container orchestration for local dev stack
Overall Health and Hygiene
Build and Compilation: The Next.js frontend builds cleanly via Turbopack (npm run build exits 0 across 55 static and dynamic routes), and TypeScript compiles with zero errors (npx tsc --noEmit exits 0).
Linting & CI Gates: The frontend lint gate is severely broken (npm run lint hangs on Windows due to recursive directory traversal inside .laufey_webview). Running targeted linting (npx eslint src) yields 201 problems (99 errors, 102 warnings), violating the clean CI/CD claim in SECURITY_REMEDIATION_CHANGES.md.
Database Migrations: Coherent. Connected to PostgreSQL 17 (NutriPlat_db on port 5432). Running python manage.py showmigrations and makemigrations --check --dry-run confirms all migrations across all 10 apps are applied ([X]) with zero pending drift.
Git Hygiene: Several non-code artifacts are tracked in source control, including uploaded binary files (.jpg, .gif) in backend/nutriplatform/media/ despite .gitignore rules, and a Windows executable laufey_webview.exe (282 KB) checked into the frontend tree.
Service Orchestration: Local developer workflow is decoupled. Docker Compose exists, but local verification relies on manually started background processes. When Redis is inactive, backend rate-limiting middleware fails closed, breaking throttled API endpoints.
3. Feature-by-Feature State
Feature	Status	Spans (Layers)	Test Coverage	Top Issue	Confidence
Authentication & RBAC	Functional but rough	Frontend, Backend, DB	High (Backend: 33 passed, 3 skipped; Frontend: 42 passed)	Profile/Registration serializers bypass upload sanitization; token refresh routes mismatch slashes	Confirmed
Client Health Profile & Macros	Complete	Frontend, Backend, DB	Moderate (10 backend tests passed)	Calculation of daily macro targets runs synchronously on query	Confirmed
AI Food Detection & Calorie Estimation	Functional but rough	Frontend, Backend, AI Service	Moderate (9 AI tests pass, 1 latency test fails)	Synchronous 60s blocking HTTP call from Django to FastAPI on CPU; inference stalls event loop	Confirmed
Manual Meal Logging	Complete	Frontend, Backend, DB	Moderate (Covered under client test suite)	Large nested JSON food item records stored without schema validation	Confirmed
Nutritionist Scheduling & Holidays	Functional but rough	Frontend, Backend, DB	None (0 tests)	Unbounded slot generation queries; frontend fallback relies on static mock data in mocks.ts	Confirmed
Consultation Booking & Patient Mgmt	Broken	Frontend, Backend, DB	None (0 tests)	client/views.py returns HTTP 400 "Direct booking deprecated"; frontend fallback still calls it	Confirmed
Marketplace Meal Plans	Complete	Frontend, Backend, DB	High (24 backend tests passed)	Image URLs stored as unvalidated relative strings in meal plan seeders	Confirmed
Checkout & Payments	Broken	Frontend, Backend, Third-Party (Stripe)	Moderate (Tests pass using test tokens)	Verification bypass: arbitrary transaction_number or test token confirms orders without Stripe charge	Confirmed
Subscription Management	Broken	Frontend, Backend, DB, Stripe	Moderate (Covered under admin tests)	SubscriptionPurchaseView grants active subscriptions without validating Stripe PaymentIntent	Confirmed
Community Articles & Comments	Functional but rough	Frontend, Backend, DB	None (0 tests)	Missing rate-limiting on comment creation; unindexed tag search queries	Confirmed
Support & Feedback Tickets	Stubbed/Placeholder	Frontend, Backend, DB	None (0 tests)	Frontend catches errors and shows fake demo toast; nutritionist support route returns HTTP 403	Confirmed
Notifications & Email	Partial	Frontend, Backend, DB	None (0 tests)	Email dispatch runs synchronously on user action; failed SMTP connections block HTTP responses	Confirmed
AI Nutritionist Chatbot	Functional but rough	Frontend, Backend, Groq API	Moderate (Admin/chatbot suite passes)	Groq API keys exposed to unauthenticated chat rate limit bypasses; prompt injection surface	Confirmed
PDF Receipt Generation	Functional but rough	Frontend only	None (0 tests)	Implemented via browser window.print() in pdfReceipt.ts; no server-side verifiable document	Confirmed
4. Bugs, Conflicts, Unfinished Work, and Errors
Critical Severity
1. Payment Verification Bypass in Marketplace and Subscription Purchases
Location: CheckoutConfirmView and SubscriptionPurchaseView
Confidence: Confirmed
Mechanism: In CheckoutConfirmView, the code contains a conditional branch that treats payment_intent_id as optional:
python
# marketplace/checkout_views.py:253
if payment_intent_id and not payment_intent_id.startswith('sim_') and not payment_intent_id.startswith('pm_'):
    # Verify with Stripe...
else:
    # Bypass Stripe and mark order as PAID
In SubscriptionPurchaseView, any user submitting a payload with a non-empty transaction_number receives an immediate 1-year active subscription without any Stripe interaction.
Impact: Any user or malicious actor can obtain marketplace meal plans, consultations, and platform subscriptions for free by passing a test string or dummy transaction number.
2. PostgreSQL Row-Level Security (RLS) Neutralized by Superuser Connection
Location: settings.py and .env
Confidence: Confirmed
Mechanism: The backend connects to PostgreSQL using USER: postgres. In PostgreSQL, superuser roles unconditionally bypass all Row-Level Security policies.
Impact: Despite migrations 0005_enable_rls and 0006_grant_rls_permissions, the multi-tenant isolation guarantees documented in SECURITY_REMEDIATION_CHANGES.md do not execute at runtime. If an SQL injection or ORM leak occurs, all tenant boundaries are nonexistent.
High Severity
3. Image Sanitization Bypass in User Authentication & Settings Serializers
Location: UserRegistrationSerializer and UserSettingsSerializer
Confidence: Confirmed
Mechanism: While marketplace/serializers.py implements validate_and_sanitize_image, users/serializers.py writes profile and cover images using default_storage.save(f"profiles/{user.id}_{file.name}", file) with raw client-supplied filenames, bypassing magic-byte validation, SVG rejection, and EXIF stripping.
Impact: Unsanitized binary payloads and malicious files can be stored in the public media directory.
4. Broken Consultation Booking Contract
Location: ConsultationBookView and payment/page.tsx
Confidence: Confirmed
Mechanism: ConsultationBookView returns a hardcoded Response({"error": "Direct booking is deprecated. Use marketplace checkout."}, status=400). However, the frontend consultation flow in payment/page.tsx still falls back to calling clientService.bookConsultation(), causing client bookings to fail on fallback.
Impact: Consultation scheduling fails if the user triggers the direct booking pathway.
5. Synchronous Blocking AI Pipeline on CPU
Location: AICalorieSubmitView and food_detection_service.py
Confidence: Confirmed
Mechanism: The Django view performs a synchronous requests.post() to the FastAPI AI service with a timeout=60. The AI service runs YOLOv8 ONNX segmentation on CPU. When concurrent requests hit FastAPI, event loop latency degrades (as demonstrated by the failure in test_concurrent_inference_health_check_latency).
Impact: Under moderate concurrent user uploads, Django WSGI workers become locked waiting on CPU inference, exhausting available web threads and causing denial of service across the entire platform.
6. ESLint CI Gate Failure & Hanging Scripts
Location: frontend/eslint.config.mjs and frontend/frontend/.laufey_webview/
Confidence: Confirmed
Mechanism: ESLint configuration does not ignore .laufey_webview. Running npm run lint enters recursive directory scanning and hangs indefinitely. Running npx eslint src reports 99 fatal errors and 102 warnings (unresolved imports, unused variables, unescaped entities).
Impact: The automated CI build pipeline cannot pass lint validation in standard headless environments.
Medium Severity
7. Stubbed Support Ticket System & Swallowed UI Errors
Location: client/support/page.tsx and nutritionist/support/page.tsx
Confidence: Confirmed
Mechanism: Both pages catch API submission failures and emit a toast claiming: "Support ticket saved in demo mode. Our team will still see it locally." The form resets and user data is silently dropped. Additionally, the nutritionist support page targets /client/feedback/, which returns HTTP 403 Forbidden because permissions enforce IsClient.
Impact: Users believe their support inquiries have been recorded, while tickets are permanently lost.
8. Silent Lookup Failures with Empty Fallbacks
Location: lookups.ts
Confidence: Confirmed
Mechanism: Six critical lookups (getDietaryPreferences, getAllergies, getSpecialties, etc.) wrap API calls in try/catch and return [] on error.
Impact: If network latency or auth tokens glitch, registration and onboarding dropdowns silently render empty without alerting the user or retrying.
9. Trailing/Leading Slash Inconsistencies in API Calls
Location: lookups.ts, NotificationDropdown.tsx, Registration-Flow.tsx, and SettingsPanel.tsx
Confidence: Confirmed
Mechanism: Vitest phase5.test.ts claimed to verify slash consistency, but only verified typeof fn === 'function'. Multiple components still prefix routes with leading slashes (/notifications/unread-count/, /auth/register/), causing Axios baseURL concatenation issues depending on the environment.
10. Fail-Closed Rate Limiter on Inactive Redis
Location: settings.py
Confidence: Confirmed
Mechanism: CACHES['ratelimit'] configures Redis with 'IGNORE_EXCEPTIONS': False.
Impact: When Redis crashes or is not started, any API endpoint wrapped with @ratelimit throws an unhandled ConnectionError (500 Internal Server Error) instead of failing open.
Low Severity
11. Zoom Integration is an Unvalidated Plain-Text String
Location: ConsultationBooking
Confidence: Confirmed
Mechanism: The documentation asserts "Zoom call integration." In reality, zoom_meeting_url is a standard CharField without OAuth tokens, webhook synchronization, or meeting creation automation.
12. Client-Side Browser Print PDF Receipts
Location: pdfReceipt.ts
Confidence: Confirmed
Mechanism: Invoices are generated by assembling an HTML string and calling window.print() inside an ephemeral popup window. No programmatic PDF library (e.g. pdfkit, ReportLab, @react-pdf/renderer) is used.
5. Test Landscape
Test Suite Execution Summary
Frontend Vitest: Executed npm test. 6 test files, 42 tests, 100% PASSED (Execution time: 74.45s).
Backend Django: Executed python manage.py test. 90 tests ran, 87 passed, 3 skipped, 0 failed (Skipped tests require active Redis cluster for rate-limiting verification).
AI Service: Executed python test_ai_service.py. 10 tests ran, 9 passed, 1 failed (test_concurrent_inference_health_check_latency exceeded 10.0ms threshold with 14.06ms due to CPU ONNX contention).
Test Coverage Matrix (Feature by Layer)
Feature / Domain	Frontend Unit / Component	Backend Unit / Integration	AI Microservice	E2E / Contract Tests	Risk Assessment
Authentication (users)	42 passed (Phase 5)	41 passed, 3 skipped	N/A	None	Low (well-tested auth core)
Client Profiles & Macros	None	10 passed	N/A	None	Medium (frontend macro UI untested)
AI Calorie Estimation	None	Indirect	9 passed, 1 failed	None	High (pipeline integration untested)
Marketplace & Plans	None	24 passed	N/A	None	Medium (payment bypass unasserted)
Admin Panel & Chatbot	None	12 passed	N/A	None	Low
Nutritionist Schedules	None	0 tests (tests.py empty)	N/A	None	CRITICAL RISK (completely untested)
Community & Articles	None	0 tests (tests.py empty)	N/A	None	CRITICAL RISK (completely untested)
Notifications & Email	None	0 tests (tests.py empty)	N/A	None	HIGH RISK (completely untested)
Checkout & Stripe Webhooks	None	Partial	N/A	None	CRITICAL RISK (webhooks unverified)
Test Quality Observations
Hollow Vitest Assertions: In frontend/src/tests/phase5.test.ts, multiple test blocks only verify that imported Axios service wrapper properties are functions (e.g. expect(typeof authService.login).toBe('function')) rather than asserting mock network requests, error responses, or contract formats.
Complete Test Voids: backend/nutriplatform/nutritionist/tests.py, backend/nutriplatform/community/tests.py, and backend/nutriplatform/notifications/tests.py are each 3-line files containing only from django.test import TestCase. Zero tests exist for doctor schedules, appointments, forums, or user notifications.
Contract Testing Absence: There are zero Pact, OpenAPI-diff, or schema validation tests between the Next.js API client, Django DRF endpoints, and the FastAPI microservice.
6. Tech Stack and Level of Integration
Stack Components and Integration Depth
Component	Technology	Version	Integration Level	Operational Status
Frontend Framework	Next.js (App Router)	16.0.0	Deeply Embedded	Core application router; Turbopack build clean
UI Library & CSS	React / Tailwind CSS / Radix	19.2.0 / 3.4.1	Deeply Embedded	Complete design system with shadcn primitives
Client HTTP	Axios	1.7.9	Deeply Embedded	Global interceptors for JWT injection and refresh
Backend Framework	Django / DRF	5.1.7 / 3.15.2	Deeply Embedded	Load-bearing modular monolith architecture
Database	PostgreSQL	17.4	Deeply Embedded	Primary persistent store; all tables migrated
Cache & Throttling	Redis / django-redis	5.4.0	Lightly Used / Fragile	Configured for throttling; fails closed when offline
Authentication	djangorestframework-simplejwt	5.4.0	Deeply Embedded	JWT issuance, signing, and blacklist rotation
AI Inference Engine	FastAPI / ONNX Runtime	0.115.11 / 1.20.1	Deeply Embedded	Computer vision microservice; YOLOv8 segmentation
ML Model Runtime	CPU ONNX Execution Provider	N/A	Deeply Embedded	CPU-bound single point of failure (CUDA absent)
LLM Provider	Groq API (groq-python)	0.18.0	Lightly Used	Chatbot endpoint with prompt fallback array
Payments	Stripe (stripe-python / JS)	11.5.0 / 5.3.0	Superficial / Bypassed	SDK initialized, but bypassed in confirm views
Async Tasks / Queue	Celery / Celery Beat / RQ	Absent	Declared but Missing	Heavy operations (AI, email) run in web threads
Desktop Webview	Laufey Webview	Custom	Dead Artifact	Leftover binary hanging linter; unused in production
Dependency Currency & Supply Chain Risks
React 19 & Next.js 16: Bleeding edge releases. Several third-party React component dependencies trigger peer dependency warnings during npm installation.
Missing Asynchronous Processing Architecture: The codebase lacks Celery, Redis Queue (RQ), or any message broker. Both image inference and email notifications run within the synchronous HTTP request lifecycle.
Tracked Native Executable: frontend/frontend/laufey_webview.exe represents a supply chain anomaly in a web repository, bloats git clones, and hangs developer tooling.
7. Performance Analysis
Performance-Critical Paths
AI Calorie Estimation Pipeline: Ingests multi-megabyte food photos, preprocesses images with OpenCV, executes YOLOv8 ONNX segmentation, estimates portion volumes, and queries nutrition tables.
Client Daily Macro & Calorie Aggregation: Aggregates meal logs, calculates protein/carb/fat totals against dynamic targets, and renders historical charts.
Nutritionist Booking Slot Search: Evaluates recurring nutritionist schedules against booked consultation slots and date-based holidays to produce available 30-minute booking intervals.
Non-Critical Paths
Community Articles & Comments: Low-write, read-heavy blog content.
User Profile Settings & Static Content: Infrequently executed CRUD operations.
Measured and Reasoning-Based Bottlenecks
[Client Request] ──> [Next.js BFF] ──> [Django WSGI Worker] ──(Synchronous HTTP)──> [FastAPI Service] ──> [ONNX on CPU]
                                             ▲                                                                   │
                                             │── Stalls worker for up to 60s waiting on inference ───────────────┘
Measured Evidence: ONNX CPU Contention: Executing test_ai_service.py under concurrent load failed with: AssertionError: 14.06ms not less than 10.0ms on health check latency. The ONNX runtime logs show UserWarning: CUDAExecutionProvider not in available provider names. Falling back to ['CPUExecutionProvider']. YOLOv8 segmentation on CPU takes 450ms–1800ms per image.
Reasoning-Based: Django Thread Starvation: AICalorieSubmitView executes a synchronous requests.post() call to FastAPI with a timeout=60. In a production WSGI/ASGI deployment with a standard pool (e.g., 4 Gunicorn workers), 4 simultaneous user photo uploads will completely starve the backend of available workers for up to 60 seconds, rejecting all incoming traffic across the site.
Reasoning-Based: Missing Compound Indexes: In marketplace/models.py, ConsultationBooking queries filtering by nutritionist, date, and status lack compound database indexes (db_index=True exists only on individual foreign keys). Under high consultation volumes, slot availability checks degrade to sequential table scans.
Reasoning-Based: Next.js Bundle Weight: Turbopack compiled 55 routes. Full component icon libraries (lucide-react) and heavy charting components (recharts) are imported into initial client bundles without explicit dynamic code splitting (next/dynamic), increasing initial client hydration cost.
8. Security Assessment
Security Scorecard Across 12 Lenses
#	Lens	Rating	Key Evidence	Primary Gap
1	Authentication & Sessions	Adequate	SimpleJWT with blacklist and sliding refresh	Token refresh route trailing slash inconsistency
2	Authorization & Access Control	Weak	PostgreSQL RLS enabled via migrations	Neutralized by postgres superuser connection
3	Input Validation & Injection	Weak	Dedicated upload_security.py exists	Core user serializers bypass it; write raw filenames
4	Data Protection & Privacy	Weak	Client health metrics stored in plain text	Superuser DB access; unencrypted health indicators
5	Secrets & Configuration	Weak	Committed .env files with fallback defaults	Hardcoded secret fallbacks and DEBUG=True flags
6	Transport & Web Hardening	Adequate	CORS headers configured; HTTPS redirect in prod	Missing HSTS preload headers and strict CSP
7	API & Abuse Resistance	Weak	django-ratelimit decorator applied	Fails closed on Redis drop; AI inference unmetered
8	Payments & Subscriptions	Absent	Stripe checkout views present	Unconditional verification bypass for arbitrary IDs
9	Dependency & Supply Chain	Adequate	Modern packages; zero known high-severity CVEs	Native .exe tracked in git; React 19 peer mismatches
10	Logging, Errors & Monitoring	Weak	Detailed tracebacks in local mode	Swallowed errors in UI; demo toasts hide failures
11	Inter-Service Trust	Adequate	X-Service-Key header between Django and FastAPI	Shared secret transmitted over unencrypted HTTP
12	AI/ML-Specific Risks	Weak	YOLOv8 model runs without tensor size limits	Unbounded input dimensions; prompt injection on Groq
Detailed Findings by Lens
Lens 1: Authentication & Session Management (Adequate)
Evidence: users/views.py implements standard JWT access and refresh token rotation with token blacklisting on logout.
Gap: Frontend token refresh handling in Axios interceptors contains inconsistent route specifications (some with trailing slashes, some without), which can cause 404/redirect loops on strict web servers.
Lens 2: Authorization & Access Control (Weak)
Evidence: Migrations 0005 and 0006 configure PostgreSQL Row-Level Security policies on client_healthmetric, client_clientprofile, marketplace_order, etc.
Gap: The runtime connection in settings.py authenticates as postgres. PostgreSQL superusers bypass RLS unconditionally. The security boundary exists only in migration SQL files and provides zero operational protection.
Lens 3: Input Validation & Injection (Weak)
Evidence: marketplace/upload_security.py implements Pillow-based image verification and EXIF stripping.
Gap: Core user authentication serializers (users/serializers.py:93-98, 187-197) completely bypass this utility, saving uploaded files directly using default_storage.save(f"profiles/{user.id}_{file.name}", file).
Lens 4: Data Protection & Privacy (Weak)
Evidence: Medical metrics (BMI, blood sugar, allergies, medical conditions) are stored in the client schema.
Gap: No field-level encryption (e.g. django-cryptography) is applied to sensitive health data. Any unauthorized database dump or log leak exposes client health history in plain text.
Lens 5: Secrets & Configuration (Weak)
Evidence: .env.example documents environment variables.
Gap: Real .env configuration files exist in the repository tree containing local database credentials, JWT secret keys, and default fallback keys in settings.py (SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-...')).
Lens 6: Transport & Web-Surface Hardening (Adequate)
Evidence: django-cors-headers is installed and restricted to trusted origins in production settings.
Gap: Strict Content Security Policy (CSP) headers are absent on the Next.js frontend, and HTTP Strict Transport Security (HSTS) is not enforced at the application level.
Lens 7: API & Abuse Resistance (Weak)
Evidence: @ratelimit decorators are present on authentication and calorie submission views.
Gap: Rate limiting relies on Redis. In settings.py, IGNORE_EXCEPTIONS: False causes ratelimited views to crash when Redis is unavailable. Furthermore, the AI inference endpoint lacks per-user file size quotas.
Lens 8: Payments & Subscription Integrity (Absent)
Evidence: Stripe integration files exist across frontend and backend.
Gap: In CheckoutConfirmView and SubscriptionPurchaseView, server-side verification of payment status is skipped if non-standard IDs or demo strings are passed, allowing unearned privilege escalation.
Lens 9: Dependency & Supply-Chain Risk (Adequate)
Evidence: Dependencies in package.json and requirements.txt use recent stable versions.
Gap: Presence of unmanaged binary executables (laufey_webview.exe) in the frontend git tree.
Lens 10: Error Handling, Logging, and Monitoring (Weak)
Evidence: Global exception handlers log error traces.
Gap: Frontend components in support and booking swallow network and server exceptions, presenting synthetic demo toasts that hide backend 403 and 500 errors from users and administrators.
Lens 11: Inter-Service Trust (Adequate)
Evidence: Django communicates with the FastAPI AI service using an X-Service-Key header.
Gap: The secret key is shared via environment variables over plain HTTP (http://localhost:8001), providing no transport encryption or mutual TLS between services.
Lens 12: AI/ML-Specific Risks (Weak)
Evidence: YOLOv8 model runs in ONNX Runtime without dynamic graph re-compilation.
Gap: The FastAPI service lacks dimension and tensor bounds checking on uploaded images. Extremely large image dimensions can trigger unconstrained memory allocation in OpenCV (cv2.imdecode), resulting in Out-Of-Memory (OOM) crashes.
9. Blind Spots and Assumptions
Production Reverse Proxy & TLS Termination: The repository does not include production Nginx, Caddy, or Cloudflare configuration files. Application-level headers (HSTS, TLS versioning) were evaluated from Django/Next.js settings rather than edge proxy configurations.
Live Stripe Webhook Ingestion: Audited using static code analysis and test fixtures. Live Stripe webhook signing secret (STRIPE_WEBHOOK_SECRET) behavior against active Stripe infrastructure could not be triggered without live credentials.
GPU / CUDA Inference Acceleration: The audit environment executed on CPU hardware. CUDA execution provider performance and VRAM allocation patterns could not be measured directly.
Third-Party Email Delivery: Resend / SMTP live mail delivery could not be verified end-to-end due to inactive test API keys; analysis was based on the synchronous dispatch path in Django views.
10. Suggested Priorities
Phase 1: Immediate Security & Financial Safeguards (Blockers)
Remediate Payment Bypass: Remove client-supplied bypass conditions in CheckoutConfirmView and SubscriptionPurchaseView. Strictly require a validated, successful stripe.PaymentIntent.retrieve() call before provisioning entitlements.
Enforce Least-Privilege Database Role for RLS: Create a dedicated application database user (e.g., nutriplat_app) that is not a PostgreSQL superuser, and grant it standard CRUD permissions to enable native Row-Level Security enforcement.
Enforce Image Sanitization: Update users/serializers.py to route all profile and cover image uploads through the validate_and_sanitize_image pipeline before writing to storage.
Phase 2: Architectural Stabilization & Build Gate Health
Restore CI Linting Gate: Update frontend/eslint.config.mjs to ignore .laufey_webview, delete the committed laufey_webview.exe binary, and resolve the 99 fatal ESLint errors across production components.
Repair Consultation Booking API Contract: Reconcile ConsultationBookView and payment/page.tsx. Either route all bookings exclusively through the marketplace checkout flow or restore the direct booking view.
Make Rate Limiting Fail Open: In settings.py, configure 'IGNORE_EXCEPTIONS': True on the ratelimit cache to prevent site-wide 500 errors when Redis is temporarily offline.
Phase 3: AI Pipeline Decoupling & Queue Implementation
Introduce Asynchronous Task Queue: Decouple Django from FastAPI by introducing Celery or RQ. The photo upload endpoint should immediately return a task_id (HTTP 202 Accepted), process ONNX segmentation in a worker thread, and deliver results to the frontend via polling or WebSockets.
Constrain AI Input Dimensions: Enforce strict dimension caps (e.g., max 2048x2048) and byte size limits on image inputs in ai-service/services/food_detection_service.py prior to OpenCV matrix decoding.
Phase 4: Test Suite Expansion & Facade Remediation
Implement Test Coverage for Untested Domains: Write comprehensive unit and integration tests for nutritionist, community, and notifications.
Replace Frontend Facades with Real Implementations: Replace the demo-mode toasts in support/page.tsx with a functioning backend ticket table, and fix the nutritionist support endpoint permissions. Replace browser window.print() with structured PDF generation.