# Post-Hardening Performance Report: Asynchronous AI Calorie Estimation Pipeline ("After" State)

- **Date**: 2026-10-03
- **Environment**: Local Windows development runtime (PostgreSQL 17 on 127.0.0.1:5432, Redis 7 in WSL2 on 127.0.0.1:6379, Uvicorn FastAPI AI service on 127.0.0.1:8001, Django Waitress on 127.0.0.1:8000 with 4 worker threads, Background Django AI Worker on 1 process with 0.5s poll).
- **Code State**: Post-Session F hardened asynchronous pipeline (atomic enqueue on `AICalorieLog`, `SELECT FOR UPDATE SKIP LOCKED` worker claim, lease fencing, decoupled nutrition computation, owner-only proxy overlay).
- **Test Harness**: `scripts/benchmark_after.py` with independent ThreadPool 5 Hz non-blocking prober split across Submit Burst and Queue Drain phases.
- **Load**: 15 concurrent authenticated client users submitting sample meal image (`ai-service/food_api/test_images/f1.jpg`, 11 KB) on a clean queue.

---

## 1. Per-Criterion Plan Validation Table

| Criterion | Target | Measured Result | Status / Analysis |
| :--- | :--- | :--- | :--- |
| **Submit Latency (Single User, 11 KB Test Image)** | $< 500\text{ ms}$ | **~35 ms** | **PASS** (Immediate queue insertion & 202 acknowledgment) |
| **Submit Latency (p95 Under 15 Concurrency, 11 KB Test Image)** | $< 500\text{ ms}$ | **1,654.4 ms** (Min: 367.0 ms, p50: 711.3 ms, Avg: 902.4 ms) | **FAIL** on this rig (15 concurrent uploads serialized through 4 Waitress worker threads) |
| **Health Probe Errors (Submit Burst)** | 0 errors | **0 errors** (0 / 11 probes) | **PASS** |
| **Health Probe Errors (Queue Drain Phase)** | 0 errors | **0 errors** (0 / 375 probes) | **PASS** (Paced polling at server's `poll_after_ms` prevents thread starvation) |
| **Health Probe Errors (Total Run)** | 0 errors | **0 errors** (0 / 386 probes) | **PASS** (0.0% error rate across entire test duration) |
| **Health Probe Latency (Drain Phase)** | $< 200\text{ ms}$ | Min: 114.1 ms, p50: 244.1 ms, p95: 1,923.6 ms | **FAIL** on this rig (The exact bottleneck remains unproven between client harness thread scheduling, Waitress connection queueing, or Windows desktop rig limitations; definitive measurement requires an isolated Linux VM benchmark with the prober executing in a separate client process) |
| **Jobs Terminal Within 180s Deadline** | 100% | **100% (15 / 15 jobs reached `pending_user_review`)** | **PASS** (All 15 jobs drained in 74.90s total, well inside the 180s deadline) |

> [!NOTE] Payload Size & Client-Side Compression Context
> The 35 ms uncontended and 1,654.4 ms concurrent submit figures were measured with an unrealistic 11 KB, 256x256 test image (`f1.jpg`).
> When tested with an uncompressed 11.0 MP (3,840 x 2,880, 6.09 MB) photo, uncontended submit latency measured **782.11 ms** due to multipart transfer, Pillow verification, server-side downsampling from 3,840 px to 2,048 px max-side, re-encoding, and disk write. On uncompressed mobile photos, the server alone cannot meet a 500 ms target.
> The production frontend (`AIMealConfirmationModal.tsx` / `useAICalorieTracker.ts`) compresses images in the browser to a max side of 1,920 px before upload, producing roughly ~1 MB JPEG payloads. A 15-concurrency burst using realistic 1 MB compressed photos remains untested under this harness.

---

## 2. Worker Execution Timing Breakdown (Pre-Caching vs Post-Caching)

From the PostgreSQL job records and worker logs across the benchmark runs:

| Component | Pre-Caching Duration | Post-Caching (Measured) | Description |
| :--- | :--- | :--- | :--- |
| **1. Storage Read & Preprocessing** | 5 – 15 ms | 5 – 15 ms | Reads normalized JPEG from `default_storage` |
| **2. ONNX AI Inference (`inference_ms`)** | 2,500 – 3,500 ms | 2,500 – 3,200 ms | 3-thread ONNX Runtime inference on CPU (`f1.jpg`) |
| **3. External Nutrition API (`nutrition_ms`)** | **6,000 – 12,000 ms** | **2.79 ms (Warm Cache)** / 1,898 ms (Cold) | Outbound HTTPS requests to CalorieNinjas API (cached in Redis with 24h TTL) |
| **4. Mask Overlay Generation (`overlay_ms`)** | 300 – 500 ms | 80 – 150 ms | Decodes polygon mask, performs alpha blending, saves JPEG overlay |
| **5. Database Finalize & RLS Context** | 10 – 30 ms | 10 – 25 ms | Atomic update under job owner tenant context via `job_queue.complete_job` |
| **Sum of Isolated Components** | ~9 – 16 s | **~2.8 – 3.5 s (Warm)** / **~4.5 – 5.3 s (Cold)** | Sum of pipeline steps |
| **Measured Per-Job Drain Rate** | **11.44 s (Average)** | **~4.99 s (Average, Warm Best-Case)** | Realized throughput across 15 jobs in 74.90s |

> [!IMPORTANT] Warm-Cache vs Cold-Cache Reality & Component Timing Gap
> - **Best-Case Cache Overstatement**: The 74.90 s drain (4.99 s per job) represents a **best-case scenario**. Because all 15 benchmark submissions used the same `f1.jpg` test image, job #259 warmed the cache for `'potato'` and jobs #260–#273 hit 100% warm cache (2.8 ms). In production, real clients submit diverse meals with different ingredients; cache hit rates will be lower. The **cold figure (~5–6 s per job**, measured at 4.59 s with outbound CalorieNinjas network call) must serve as the true baseline for capacity planning.
> - **Timing Gap Explanation**: Isolated warm components sum to ~2.8–3.5 s, yet realized per-job throughput averaged 4.99 s. This ~1.5–2.0 s gap is accounted for by:
>   1. Job #259 incurred a cold-cache outbound network call (5.52 s).
>   2. Background worker `--poll-interval 0.5s` sleep slices between claim loops.
>   3. CPU context switching and thread scheduling contention between the 3 ONNX inference threads and Waitress's 4 worker threads on the shared 4 physical CPU cores of the local rig.
>   4. PostgreSQL transaction commit, lease renewal verification, and local disk I/O.

---

## 3. Queue Capacity & SLA Deadline Math

Using the realistic cold-cache figure of $T_{\text{job}} \approx 5.5\text{ s}$ per job:
- Single-worker capacity in 180 seconds (`AI_JOB_MAX_AGE_SECONDS = 180`): $\lfloor 180 / 5.5 \rfloor = 32\text{ jobs}$ (or 36 jobs in the best-case warm scenario).
- **Safe Global Cap Configuration**:
  - `AI_GLOBAL_QUEUE_CAP` set to **15**.
  - `AI_ETA_SECONDS_PER_JOB` set to **10** (incorporating a ~2x safety margin over cold-cache execution).
  - System check `client.E005` strictly enforces $\text{AI\_GLOBAL\_QUEUE\_CAP} \times \text{AI\_ETA\_SECONDS\_PER\_JOB} \le \text{AI\_JOB\_MAX\_AGE\_SECONDS}$ ($15 \times 10 = 150\text{s} \le 180\text{s}$).

---

## 4. Benchmark Job Record Evidence (74.90s Post-Caching Run)

Records from the 15-job concurrent run (#259 to #273) on a clean queue:

| Job ID | Status | Error Code | Claim Age ($t_{\text{claim}} - t_{\text{log}}$) | Worker Processing Time ($t_{\text{update}} - t_{\text{claim}}$) |
| :--- | :--- | :--- | :--- | :--- |
| **#259** | `pending_user_review` | `None` | **0.48 s** | 5.52 s (Cold cache query for detected ingredients) |
| **#260** | `pending_user_review` | `None` | **6.00 s** | 4.38 s (Warm cache) |
| **#261** | `pending_user_review` | `None` | **10.34 s** | 4.57 s (Warm cache) |
| **#262** | `pending_user_review` | `None` | **14.72 s** | 4.43 s (Warm cache) |
| **#263** | `pending_user_review` | `None` | **19.06 s** | 4.98 s (Warm cache) |
| **#264** | `pending_user_review` | `None` | **24.04 s** | 4.34 s (Warm cache) |
| **#265** | `pending_user_review` | `None` | **28.38 s** | 4.35 s (Warm cache) |
| **#266** | `pending_user_review` | `None` | **32.47 s** | 4.15 s (Warm cache) |
| **#267** | `pending_user_review` | `None` | **36.21 s** | 4.32 s (Warm cache) |
| **#268** | `pending_user_review` | `None` | **40.49 s** | 4.11 s (Warm cache) |
| **#269** | `pending_user_review` | `None` | **44.56 s** | 4.57 s (Warm cache) |
| **#270** | `pending_user_review` | `None` | **48.99 s** | 5.14 s (Warm cache) |
| **#271** | `pending_user_review` | `None` | **53.86 s** | 4.41 s (Warm cache) |
| **#272** | `pending_user_review` | `None` | **58.13 s** | 7.47 s (Warm cache) |
| **#273** | `pending_user_review` | `None` | **65.56 s** | 8.34 s (Warm cache) |

**Summary**: All 15 jobs (#259 to #273) were claimed well within the 180s deadline (last job claimed at 65.56s) and finalized into `pending_user_review` with 0 failures. Total queue drain time was 74.90 s (averaging 4.99 s per job).
