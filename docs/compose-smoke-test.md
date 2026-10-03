# Docker Compose Smoke Test & Deployment Verification Checklist

This document provides the step-by-step verification checklist for deploying and validating the multi-container stack on a production or staging Linux VM with Docker and Docker Compose.

---

## 1. Prerequisites & Network Topology
- Docker Engine >= 24.0.0 and Docker Compose v2.
- Environment variables configured in `.env` (copied from `.env.docker.example`).
- Model weight file `best_foodinsseg.onnx` located in `ai-service/food_api/best_foodinsseg.onnx`.

### Dual-Network Architecture:
1. `backend_net` (Standard bridge): Connects `frontend`, `backend`, `worker`, `postgres`, and `redis`. Allows outbound internet egress for external nutrition APIs and payment gateways.
2. `internal_ai_net` (`internal: true` bridge): Strictly isolated internal network with **no default gateway and no external internet access**. Connects `backend`, `worker`, and `ai-service`. The AI service publishes **no host ports** and cannot make outbound connections.

---

## 2. Verification Checklist

### Step 1: Build All Images
```bash
docker compose build --no-cache
```
- [ ] Backend image builds without errors (`python:3.11-slim`, non-root `appuser`, gunicorn installed).
- [ ] AI service image builds without errors (`opencv-python-headless` installed, non-root `appuser`).
- [ ] Frontend image builds without errors (multi-stage Next.js standalone build).

### Step 2: Model Missing Fail-Fast Verification (Strict Mode)
Verify that the AI service container safely exits non-zero if the model file is not mounted:
```bash
# Start AI service with a non-existent model mount path
docker run --rm \
  -e AI_SERVICE_SECRET_KEY="0123456789abcdef0123456789abcdef" \
  -e AI_MODEL_PATH="/models/non_existent.onnx" \
  personalized-dietary-platform-ai-service
```
- [ ] Container exits with non-zero code.
- [ ] Logs show: `FATAL: ONNX model file not found at /models/non_existent.onnx. Refusing to start AI service without model in production mode.`

### Step 3: Bring Up Stack & Migration Service
```bash
docker compose up -d
```
- [ ] One-shot `migrate` service runs `python manage.py migrate` and exits with code 0 (`Exited (0)`).
- [ ] `postgres` and `redis` services are healthy (`healthy` status via docker healthcheck).
- [ ] `backend` is running under Gunicorn (2 workers x 2 threads).
- [ ] `worker` daemon is running `python manage.py run_ai_worker`.
- [ ] `ai-service` is running with resource limits applied (`cpus: 3`, `mem_limit: 2048M`).
- [ ] `frontend` is serving on port 3000.

### Step 4: Network Isolation & Port Publishing Verification
```bash
docker compose ps
```
- [ ] `ai-service` publishes **no host ports** (only reachable internally via `http://ai-service:8001` on `internal_ai_net`).
- [ ] `backend` only exposes `http://127.0.0.1:8000` or reverse proxy port.

### Step 5: Backend Liveness & Readiness Checks
```bash
# Dependency-free liveness probe
curl -f http://127.0.0.1:8000/api/v1/health/live/
# Expected: {"status":"ok","service":"nutriplatform-backend"}

# Dependency check
curl -f http://127.0.0.1:8000/api/v1/health/
# Expected: {"database":"healthy","cache":"healthy"}
```
- [ ] `GET /api/v1/health/live/` returns 200 OK (<10ms).
- [ ] `GET /api/v1/health/` returns 200 OK.

### Step 6: End-to-End Ingestion Smoke Test
```bash
# Submit sample meal image through the Django BFF
curl -X POST http://127.0.0.1:8000/api/v1/client/calorie-tracker/ai/ \
  -H "Authorization: Bearer <VALID_JWT_ACCESS_TOKEN>" \
  -F "image=@ai-service/food_api/test_images/f1.jpg" \
  -F "meal_type=lunch"
```
- [ ] Request returns `202 Accepted` with `log_id` / `status="queued"`.
- [ ] Background worker claims job via PostgreSQL `SKIP LOCKED`.
- [ ] Inference completes successfully and transitions status to `pending_user_review`.
- [ ] Output includes detected ingredients, mass estimates, and nutrition breakdown.
