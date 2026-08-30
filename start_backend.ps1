# S. pyogenes Ranker — Backend Launcher
# Run this from the project root: .\start_backend.ps1

$ErrorActionPreference = "Stop"
$BackendDir = Join-Path $PSScriptRoot "backend"

Write-Host "=== S. pyogenes Ranker Backend ===" -ForegroundColor Cyan

# Try to activate a virtual environment if it exists
$VenvPaths = @(
    (Join-Path $PSScriptRoot ".venv\Scripts\Activate.ps1"),
    (Join-Path $PSScriptRoot "venv\Scripts\Activate.ps1"),
    (Join-Path $BackendDir ".venv\Scripts\Activate.ps1"),
    (Join-Path $BackendDir "venv\Scripts\Activate.ps1")
)
foreach ($venv in $VenvPaths) {
    if (Test-Path $venv) {
        Write-Host "Activating virtual environment: $venv" -ForegroundColor Green
        & $venv
        break
    }
}

Write-Host "Starting FastAPI on http://localhost:8000 ..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

Push-Location $BackendDir
try {
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
} finally {
    Pop-Location
}
