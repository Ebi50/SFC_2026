# Stop all node processes
Write-Host "Stopping all Node.js processes..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "tsx" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait a moment
Start-Sleep -Seconds 2

# Start backend in new window
Write-Host "Starting backend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npx tsx index.ts"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window  
Write-Host "Starting frontend server..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "Both servers are starting..."
Write-Host "Backend: http://localhost:3001"
Write-Host "Frontend: http://localhost:5000"