#!/bin/bash
# Quick Start Script for macOS/Linux
# This script sets up and runs both frontend and backend

set -e

echo "================================================"
echo "ASL Recognition System - Quick Start"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python is not installed!"
    echo "Please install Python from https://www.python.org/"
    exit 1
fi

echo "[1/5] Installing frontend dependencies..."
npm install || {
    echo "[ERROR] Failed to install frontend dependencies"
    exit 1
}

echo ""
echo "[2/5] Setting up Python virtual environment..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

echo ""
echo "[3/5] Installing backend dependencies..."
pip install -r requirements.txt || {
    echo "[ERROR] Failed to install backend dependencies"
    exit 1
}

echo ""
echo "[4/5] Starting backend server..."
# Start backend in background
python main.py &
BACKEND_PID=$!
cd ..

echo ""
echo "[5/5] Starting frontend development server..."
sleep 3

# Start frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo "Setup Complete!"
echo "================================================"
echo ""
echo "Backend running on: http://localhost:8000"
echo "Frontend running on: http://localhost:5173"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Opening browser..."
sleep 3

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:5173
fi

echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait

