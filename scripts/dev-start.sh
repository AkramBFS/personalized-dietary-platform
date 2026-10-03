#!/usr/bin/env bash
# scripts/dev-start.sh
# Starts the complete Nutriplatform local development stack

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=================================================="
echo " Starting Nutriplatform Development Environment   "
echo "=================================================="

cleanup() {
    echo -e "\nShutting down dev background services..."
    kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 1. Start AI Service
echo "[1/4] Starting AI Service (Uvicorn on port 8001)..."
(cd "$ROOT_DIR/ai-service/food_api" && python -m uvicorn app:app --host 127.0.0.1 --port 8001) &

# 2. Start Django Web Server
echo "[2/4] Starting Django Web Server (port 8000)..."
(cd "$ROOT_DIR/backend/nutriplatform" && python manage.py runserver 127.0.0.1:8000) &

# 3. Start AI Queue Worker
echo "[3/4] Starting AI Queue Worker..."
(cd "$ROOT_DIR/backend/nutriplatform" && python manage.py run_ai_worker --concurrency 1) &

# 4. Start Next.js Frontend
echo "[4/4] Starting Frontend Dev Server (port 3000)..."
(cd "$ROOT_DIR/frontend" && npm run dev) &

echo "All dev services running. Press Ctrl+C to stop all."
wait
