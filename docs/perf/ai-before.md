# Baseline Performance Report: AI Calorie Estimation Pipeline ("Before" State) - Preliminary Baseline

- **Date**: 2026-10-03  
- **Commit**: `c41cff4d` (Baseline Django code state)
- **Status**: **Preliminary Limited Baseline**
- **Environment**: Local Windows development runtime (PostgreSQL 17 on 127.0.0.1:5432, Redis 7 in WSL2 on 127.0.0.1:6379, FastAPI AI service on 127.0.0.1:8001, Django Waitress server on 127.0.0.1:8000 with 4 worker threads).
- **Code State**: Run in Session A after the AI service hardening was already in place (the AI service was already hardened with its single-slot concurrency gate, and only the Django view was the original unhardened synchronous implementation).
- **Harness & Limitations**: The test harness fired sequential probes blocked by 5.0s timeouts, yielding only 14 completed probe attempts over 63.54s instead of ~317 at a fixed 5 Hz. Note that the "before" and "after" probe harnesses differ (14 sequential timeout-blocked probes vs an independent non-blocking 5 Hz concurrent prober), so the probe metrics between the two reports are not directly comparable. When re-attempted from a git worktree at `c41cff4d` against the shared development database, requests returned HTTP 500; the root cause was not diagnosed (the application connects to PostgreSQL as a superuser, which bypasses RLS, so RLS was not the cause).

---

## 1. Executive Summary & Observations

Under the original architecture, sending 20 concurrent image submissions locked all 4 worker threads for over 63 seconds. Because inference and third-party API lookups were performed synchronously in the Django request cycle, incoming HTTP traffic suffered severe starvation.

Key preliminary measurements:
- **Server Starvation**: 12 of 14 attempted liveness probes timed out at 5.0 seconds (**85.7% probe failure rate**).
- **Client Submission Latency**: p95 reached **63.30 seconds** (Min: 13.06s, p50: 38.08s, Max: 63.51s, Avg: 38.42s).
- **Liveness Starvation**: The sequential probe harness was delayed by timeout waits, preventing full 5 Hz dispatch.

---

## 2. Preliminary Benchmark Metrics (63.54s Duration)

### AI Meal Image Submissions
| Metric | Value |
| :--- | :--- |
| **Total Requests** | 20 simultaneous client requests |
| **Concurrency** | 20 concurrent client uploads |
| **HTTP Status Breakdown** | 202 Accepted: 20 (100% after extreme queueing) |
| **Wall Clock Duration** | **63.54 seconds** |
| **Min Latency** | 13,060.5 ms (13.06 s) |
| **p50 (Median) Latency** | **38,082.4 ms (38.08 s)** |
| **p95 Latency** | **63,298.6 ms (63.30 s)** |
| **Max Latency** | **63,505.7 ms (63.51 s)** |
| **Average Latency** | **38,417.5 ms (38.42 s)** |

### Background Liveness Probe Under Load (`GET /api/v1/health/live/`)
| Metric | Value |
| :--- | :--- |
| **Expected Probes (5Hz over 63.5s)** | ~317 probes |
| **Completed Probe Attempts** | 14 probes (limited by sequential 5s timeout blocking) |
| **Probe Timeouts / Failures** | **12 failed (85.7% failure rate)** |
| **Min Latency** | 300.0 ms |
| **p50 (Median) Latency** | **5,013.3 ms** (timed out) |
| **p95 Latency** | **5,034.8 ms** (timed out) |
| **Max Latency** | **5,034.8 ms** (timed out) |
| **Average Latency** | **4,387.7 ms** |
