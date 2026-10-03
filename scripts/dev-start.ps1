# scripts/dev-start.ps1
# Starts the complete Nutriplatform local development stack
param (
    [switch]$NoFrontend,
    [switch]$NoWorker
)

$ErrorActionPreference = "Stop"
$ROOT_DIR = (Resolve-Path "$PSScriptRoot\..").Path

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Starting Nutriplatform Development Environment  " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Start AI Service
Write-Host "[1/4] Starting AI Service (Uvicorn on port 8001)..." -ForegroundColor Green
$aiProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\ai-service\food_api'; python -m uvicorn app:app --host 127.0.0.1 --port 8001" -PassThru

# 2. Start Django Web Server
Write-Host "[2/4] Starting Django Web Server (port 8000)..." -ForegroundColor Green
$djangoProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\backend\nutriplatform'; python manage.py runserver 127.0.0.1:8000" -PassThru

# 3. Start AI Queue Worker
if (-not $NoWorker) {
    Write-Host "[3/4] Starting AI Queue Worker..." -ForegroundColor Green
    $workerProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\backend\nutriplatform'; python manage.py run_ai_worker --concurrency 1" -PassThru
}

# 4. Start Next.js Frontend
if (-not $NoFrontend) {
    Write-Host "[4/4] Starting Frontend Dev Server (port 3000)..." -ForegroundColor Green
    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT_DIR\frontend'; npm run dev" -PassThru
}

Write-Host "`nAll dev services launched in separate windows." -ForegroundColor Yellow
Write-Host "Backend API:  http://127.0.0.1:8000"
Write-Host "AI Service:   http://127.0.0.1:8001"
Write-Host "Frontend:     http://localhost:3000"
