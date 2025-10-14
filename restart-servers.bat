@echo off
echo Stopping all development servers...

REM Stop Node.js processes (ignore errors)
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js processes stopped
) else (
    echo ℹ️ No Node.js processes to stop
)

REM Stop TSX processes (ignore errors)
taskkill /f /im tsx.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ TSX processes stopped
) else (
    echo ℹ️ No TSX processes to stop
)

REM Stop any processes using ports 3001 and 5000/5001
netstat -ano | findstr :3001 | for /f "tokens=5" %%a in ('more') do taskkill /f /pid %%a >nul 2>&1
netstat -ano | findstr :5000 | for /f "tokens=5" %%a in ('more') do taskkill /f /pid %%a >nul 2>&1
netstat -ano | findstr :5001 | for /f "tokens=5" %%a in ('more') do taskkill /f /pid %%a >nul 2>&1

echo.
echo 🚀 Starting Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd /d %~dp0 && npm run server"

echo.
echo ⏳ Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo 🚀 Starting Frontend Server (Port 5000/5001)...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Both servers are starting...
echo 📋 Backend:  http://localhost:3001
echo 📋 Frontend: http://localhost:5000 or http://localhost:5001
echo.
echo Press any key to continue...
pause >nul