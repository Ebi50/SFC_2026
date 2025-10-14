Write-Host "Stopping all development servers..." -ForegroundColor Yellow

# Stop Node.js processes safely
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        $nodeProcesses | Stop-Process -Force
        Write-Host "Node.js processes stopped" -ForegroundColor Green
    } else {
        Write-Host "No Node.js processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "No Node.js processes to stop" -ForegroundColor Gray
}

# Stop TSX processes safely  
try {
    $tsxProcesses = Get-Process -Name "tsx" -ErrorAction SilentlyContinue
    if ($tsxProcesses) {
        $tsxProcesses | Stop-Process -Force
        Write-Host "TSX processes stopped" -ForegroundColor Green
    } else {
        Write-Host "No TSX processes found" -ForegroundColor Gray
    }
} catch {
    Write-Host "No TSX processes to stop" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Starting Backend Server on port 3001..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server"

Start-Sleep -Seconds 3

Write-Host "Starting Frontend Server on port 5000/5001..." -ForegroundColor Cyan  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "Frontend: http://localhost:5000 or http://localhost:5001" -ForegroundColor White