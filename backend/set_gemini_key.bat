@echo off
REM Script to set Gemini API Key for the current session

echo ========================================
echo Google Gemini API Key Setup
echo ========================================
echo.
echo Get your FREE API key from:
echo https://makersuite.google.com/app/apikey
echo.
echo.
"

if "%GEMINI_KEY%"=="" (
    echo.
    echo ERROR: No API key provided!
    pause
    exit /b 1
)

REM Set for current session
set GEMINI_API_KEY=%GEMINI_KEY%

echo.
echo ✅ API Key set successfully for this session!
echo.
echo Starting backend server...
echo.

REM Activate virtual environment and run
call venv\Scripts\activate
python main.py

pause


set /p GEMINI_KEY="AIzaSyBMlLMXILt7mHhKQttsqWg_EckZy-3gfk8"