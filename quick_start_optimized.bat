@echo off
REM ============================================
REM Optimized Quick Start Script for ASL App
REM Starts both Backend and Frontend servers
REM ============================================

echo.
echo ========================================
echo   ASL Recognition - Quick Start
echo ========================================
echo.

REM Set API Key directly in environment
set GEMINI_API_KEY=AIzaSyBMlLMXILt7mHhKQttsqWg_EckZy-3gfk8

echo [1/2] Starting Backend Server (FastAPI)...
cd backend
start "ASL Backend" cmd /k "python main.py"
cd ..

REM Wait for backend to initialize
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (Vite)...
start "ASL Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:8081
echo  Signs:    http://localhost:8081/signs
echo.
echo  Press any key to open the app in browser...
pause >nul

REM Open in browser
start http://localhost:8081

echo.
echo Servers are running in separate windows.
echo Close those windows to stop the servers.
echo.
pause

