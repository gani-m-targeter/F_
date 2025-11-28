@echo off
REM Quick Start Script for Windows
REM This script sets up and runs both frontend and backend

echo ================================================
echo ASL Recognition System - Quick Start
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo [1/5] Installing frontend dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Setting up Python virtual environment...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate

echo.
echo [3/5] Installing backend dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [4/5] Starting backend server...
start "ASL Backend" cmd /k "cd /d %CD% && venv\Scripts\activate && python main.py"

cd ..

echo.
echo [5/5] Starting frontend development server...
timeout /t 3 /nobreak >nul
start "ASL Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo Setup Complete!
echo ================================================
echo.
echo Backend running on: http://localhost:8000
echo Frontend running on: http://localhost:5173
echo.
echo Two new windows have been opened:
echo - ASL Backend (FastAPI server)
echo - ASL Frontend (React app)
echo.
echo Open your browser and navigate to:
echo http://localhost:5173
echo.
echo Press any key to open in browser...
pause >nul

start http://localhost:5173

echo.
echo To stop the servers, close both terminal windows.
echo.
pause

