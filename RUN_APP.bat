@echo off
echo ========================================
echo   Starting ASL Recognition App
echo ========================================
echo.

REM Navigate to backend and start it
echo [1/2] Starting Backend...
cd /d "%~dp0backend"
start "Backend" cmd /k "py -3.12 -m pip install fastapi uvicorn numpy pydantic websockets && py -3.12 main.py"

REM Wait for backend
timeout /t 5 /nobreak >nul

REM Navigate to frontend and start it  
echo [2/2] Starting Frontend...
cd /d "%~dp0"
start "Frontend" cmd /k ""C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js"

REM Wait then open browser
timeout /t 5 /nobreak >nul
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo   App is running!
echo ========================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo ========================================
pause
