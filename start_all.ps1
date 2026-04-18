Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Starting ChefAI Full Stack" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Ollama Engine (Port 11434)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"ollama serve`"" -WindowStyle Minimized

Write-Host "Starting Backend & Sentiment ML (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `".\.venv\Scripts\Activate.ps1; python run.py`"" -WindowStyle Minimized

Write-Host "Starting Frontend UI (Port 6969)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit -Command `"cd frontend; npm run dev`"" -WindowStyle Minimized

Write-Host ""
Write-Host "All three subsystems are now booting in separate background windows!" -ForegroundColor Green
Write-Host "The UI will shortly be available at: http://localhost:6969" -ForegroundColor Green
