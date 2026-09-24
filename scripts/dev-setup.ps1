## Dev Setup — Windows (PowerShell)

Param(
    [switch]$SkipInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Frontend = Join-Path $Root "frontend"
$Backend  = Join-Path $Root "backend"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PromptWars Legal AI — Dev Setup              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Check Node.js ───────────────────────────────────────────────────────────
Write-Host "→ Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version 2>&1
    Write-Host " $nodeVersion ✓" -ForegroundColor Green
} catch {
    Write-Host " NOT FOUND" -ForegroundColor Red
    Write-Host "  Install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# ─── Check Python ────────────────────────────────────────────────────────────
Write-Host "→ Checking Python..." -NoNewline
try {
    $pythonVersion = python --version 2>&1
    Write-Host " $pythonVersion ✓" -ForegroundColor Green
} catch {
    Write-Host " NOT FOUND" -ForegroundColor Red
    Write-Host "  Install Python 3.11+ from https://python.org" -ForegroundColor Yellow
    exit 1
}

# ─── Check uv ────────────────────────────────────────────────────────────────
Write-Host "→ Checking uv..." -NoNewline
$uvAvailable = $false
try {
    $uvVersion = uv --version 2>&1
    Write-Host " $uvVersion ✓" -ForegroundColor Green
    $uvAvailable = $true
} catch {
    Write-Host " NOT FOUND" -ForegroundColor Yellow
    Write-Host "  Installing uv..." -ForegroundColor Yellow
    pip install uv --quiet
    $uvAvailable = $true
}

# ─── Environment files ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "→ Setting up environment files..."

$envExample = Join-Path $Root ".env.example"

# Frontend .env.local
$frontendEnv = Join-Path $Frontend ".env.local"
if (-not (Test-Path $frontendEnv)) {
    Copy-Item $envExample $frontendEnv
    Write-Host "  Created: frontend/.env.local (fill in your Firebase values)" -ForegroundColor Yellow
} else {
    Write-Host "  Exists:  frontend/.env.local" -ForegroundColor Gray
}

# Backend .env
$backendEnv = Join-Path $Backend ".env"
if (-not (Test-Path $backendEnv)) {
    Copy-Item $envExample $backendEnv
    Write-Host "  Created: backend/.env (review defaults)" -ForegroundColor Yellow
} else {
    Write-Host "  Exists:  backend/.env" -ForegroundColor Gray
}

if ($SkipInstall) {
    Write-Host ""
    Write-Host "Skipping dependency installation (--SkipInstall)" -ForegroundColor Gray
} else {
    # ─── Frontend dependencies ────────────────────────────────────────────────
    Write-Host ""
    Write-Host "→ Installing frontend dependencies..."
    Set-Location $Frontend
    npm install --silent
    Write-Host "  Frontend dependencies installed ✓" -ForegroundColor Green

    # ─── Backend dependencies ─────────────────────────────────────────────────
    Write-Host ""
    Write-Host "→ Installing backend dependencies..."
    Set-Location $Backend
    if ($uvAvailable) {
        uv sync --dev
    } else {
        pip install -r requirements.txt
    }
    Write-Host "  Backend dependencies installed ✓" -ForegroundColor Green
}

Set-Location $Root

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   Setup complete!                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Fill in frontend/.env.local with your Firebase config" -ForegroundColor Yellow
Write-Host "     (Firebase Console → Project Settings → Web app)" -ForegroundColor Gray
Write-Host "  2. Add your App Check debug token to frontend/.env.local" -ForegroundColor Yellow
Write-Host "     (Firebase Console → Build → App Check → Manage debug tokens)" -ForegroundColor Gray
Write-Host ""
Write-Host "Start frontend:" -ForegroundColor White
Write-Host "  cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Start backend:" -ForegroundColor White
Write-Host "  cd backend && uv run uvicorn app.main:app --reload --port 8000" -ForegroundColor Cyan
Write-Host ""
