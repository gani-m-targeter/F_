@echo off
REM ============================================
REM ASL Recognition System - Complete Setup
REM Automated Installation for Windows
REM ============================================

echo.
echo ========================================
echo   ASL Recognition System Setup
echo ========================================
echo.
echo This script will:
echo  1. Check prerequisites (Node.js, Python)
echo  2. Install frontend dependencies (npm)
echo  3. Install backend dependencies (pip)
echo  4. Set up environment variables
echo  5. Start both servers
echo.
pause

REM ============================================
REM STEP 1: Check Prerequisites
REM ============================================

echo.
echo [1/6] Checking Prerequisites...
echo.

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo Minimum version required: 18.0+
    pause
    exit /b 1
)
echo [OK] Node.js found: 
node --version

REM Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please download and install Python from https://www.python.org/
    echo Minimum version required: 3.9+
    pause
    exit /b 1
)
echo [OK] Python found: 
python --version

REM Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)
echo [OK] npm found: 
npm --version

REM Check pip
pip --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] pip is not installed!
    pause
    exit /b 1
)
echo [OK] pip found: 
pip --version

echo.
echo [SUCCESS] All prerequisites are installed!
echo.

REM ============================================
REM STEP 2: Install Frontend Dependencies
REM ============================================

echo.
echo [2/6] Installing Frontend Dependencies...
echo This may take 2-5 minutes...
echo.

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend installation failed!
    pause
    exit /b 1
)

REM Install MediaPipe Holistic specifically
echo.
echo Installing MediaPipe Holistic for face + hand detection...
call npm install @mediapipe/holistic
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MediaPipe Holistic installation failed. Will retry...
    call npm install @mediapipe/holistic --legacy-peer-deps
)

echo.
echo [SUCCESS] Frontend dependencies installed!
echo.

REM ============================================
REM STEP 3: Create Python Virtual Environment
REM ============================================

echo.
echo [3/6] Setting up Python Virtual Environment...
echo.

cd backend

REM Check if venv already exists
if exist venv (
    echo Virtual environment already exists. Skipping creation...
) else (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment!
        cd ..
        pause
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo [SUCCESS] Virtual environment ready!
echo.

REM ============================================
REM STEP 4: Install Backend Dependencies
REM ============================================

echo.
echo [4/6] Installing Backend Dependencies...
echo This may take 5-10 minutes (especially NumPy)...
echo.

REM Upgrade pip first
python -m pip install --upgrade pip

REM Install packages one by one for better error handling
echo Installing FastAPI...
pip install fastapi uvicorn[standard] --no-cache-dir
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] FastAPI installation failed!
    cd ..
    pause
    exit /b 1
)

echo Installing WebSockets...
pip install websockets python-socketio
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] WebSockets installation failed!
    cd ..
    pause
    exit /b 1
)

echo Installing NumPy (this may take a while)...
pip install numpy --only-binary :all:
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Pre-built NumPy failed. Installing from source...
    pip install numpy
)

echo Installing Google Generative AI (Gemini)...
pip install google-generativeai

echo Installing remaining packages...
pip install python-multipart pydantic

echo.
echo [SUCCESS] Backend dependencies installed!
echo.

cd ..

REM ============================================
REM STEP 5: Configure Environment Variables
REM ============================================

echo.
echo [5/6] Configuring Environment Variables...
echo.

REM Create .env file if it doesn't exist
if not exist backend\.env (
    echo Creating .env file with Gemini API key...
    (
        echo # ASL Recognition System - Environment Variables
        echo.
        echo # Google Gemini API Key ^(for sentence refinement^)
        echo GEMINI_API_KEY=AIzaSyBMlLMXILt7mHhKQttsqWg_EckZy-3gfk8
        echo.
        echo # Optional: Other LLM Providers
        echo # GROQ_API_KEY=your_groq_key_here
        echo # OPENAI_API_KEY=your_openai_key_here
    ) > backend\.env
    echo [SUCCESS] .env file created!
) else (
    echo .env file already exists. Skipping...
)

echo.
echo [SUCCESS] Environment configured!
echo.

REM ============================================
REM STEP 6: Installation Complete
REM ============================================

echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Everything is set up and ready to use!
echo.
echo Next steps:
echo   1. Run 'quick_start_optimized.bat' to start both servers
echo   2. OR manually start:
echo      - Backend:  cd backend ^&^& python main.py
echo      - Frontend: npm run dev
echo.
echo The application will be available at:
echo   Frontend: http://localhost:8081
echo   Backend:  http://localhost:8000
echo   Signs:    http://localhost:8081/signs
echo.
echo For detailed usage instructions, see README.md
echo.
pause

REM Ask if user wants to start servers now
echo.
echo Would you like to start the servers now? (Y/N)
set /p START_NOW=
if /i "%START_NOW%"=="Y" (
    echo.
    echo Starting servers...
    start "ASL Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"
    timeout /t 3 /nobreak >nul
    start "ASL Frontend" cmd /k "npm run dev"
    timeout /t 5 /nobreak >nul
    start http://localhost:8081
    echo.
    echo Servers are starting in separate windows!
    echo Close those windows to stop the servers.
)

echo.
echo Setup complete! Goodbye!
pause

