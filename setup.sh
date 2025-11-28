#!/bin/bash
# ============================================
# ASL Recognition System - Complete Setup
# Automated Installation for macOS/Linux
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "   ASL Recognition System Setup"
echo "========================================"
echo ""
echo "This script will:"
echo "  1. Check prerequisites (Node.js, Python)"
echo "  2. Install frontend dependencies (npm)"
echo "  3. Install backend dependencies (pip)"
echo "  4. Set up environment variables"
echo "  5. Configure the system"
echo ""
read -p "Press Enter to continue..."

# ============================================
# STEP 1: Check Prerequisites
# ============================================

echo ""
echo -e "${BLUE}[1/6] Checking Prerequisites...${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Minimum version required: 18.0+"
    exit 1
fi
echo -e "${GREEN}[OK] Node.js found:${NC} $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] npm found:${NC} $(npm --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR] Python3 is not installed!${NC}"
    echo "Please install Python from https://www.python.org/"
    echo "Minimum version required: 3.9+"
    exit 1
fi
echo -e "${GREEN}[OK] Python found:${NC} $(python3 --version)"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}[ERROR] pip3 is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] pip found:${NC} $(pip3 --version)"

echo ""
echo -e "${GREEN}[SUCCESS] All prerequisites are installed!${NC}"
echo ""

# ============================================
# STEP 2: Install Frontend Dependencies
# ============================================

echo ""
echo -e "${BLUE}[2/6] Installing Frontend Dependencies...${NC}"
echo "This may take 2-5 minutes..."
echo ""

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Frontend installation failed!${NC}"
    exit 1
fi

# Install MediaPipe Holistic
echo ""
echo "Installing MediaPipe Holistic for face + hand detection..."
npm install @mediapipe/holistic || npm install @mediapipe/holistic --legacy-peer-deps

echo ""
echo -e "${GREEN}[SUCCESS] Frontend dependencies installed!${NC}"
echo ""

# ============================================
# STEP 3: Create Python Virtual Environment
# ============================================

echo ""
echo -e "${BLUE}[3/6] Setting up Python Virtual Environment...${NC}"
echo ""

cd backend

# Check if venv already exists
if [ -d "venv" ]; then
    echo "Virtual environment already exists. Skipping creation..."
else
    echo "Creating virtual environment..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}[ERROR] Failed to create virtual environment!${NC}"
        cd ..
        exit 1
    fi
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

echo -e "${GREEN}[SUCCESS] Virtual environment ready!${NC}"
echo ""

# ============================================
# STEP 4: Install Backend Dependencies
# ============================================

echo ""
echo -e "${BLUE}[4/6] Installing Backend Dependencies...${NC}"
echo "This may take 5-10 minutes (especially NumPy)..."
echo ""

# Upgrade pip
python -m pip install --upgrade pip

# Install packages
echo "Installing FastAPI..."
pip install fastapi "uvicorn[standard]" --no-cache-dir

echo "Installing WebSockets..."
pip install websockets python-socketio

echo "Installing NumPy..."
pip install numpy

echo "Installing Google Generative AI (Gemini)..."
pip install google-generativeai

echo "Installing remaining packages..."
pip install python-multipart pydantic

echo ""
echo -e "${GREEN}[SUCCESS] Backend dependencies installed!${NC}"
echo ""

cd ..

# ============================================
# STEP 5: Configure Environment Variables
# ============================================

echo ""
echo -e "${BLUE}[5/6] Configuring Environment Variables...${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file with Gemini API key..."
    cat > backend/.env << EOL
# ASL Recognition System - Environment Variables

# Google Gemini API Key (for sentence refinement)
GEMINI_API_KEY=AIzaSyBMlLMXILt7mHhKQttsqWg_EckZy-3gfk8

# Optional: Other LLM Providers
# GROQ_API_KEY=your_groq_key_here
# OPENAI_API_KEY=your_openai_key_here
EOL
    echo -e "${GREEN}[SUCCESS] .env file created!${NC}"
else
    echo ".env file already exists. Skipping..."
fi

echo ""
echo -e "${GREEN}[SUCCESS] Environment configured!${NC}"
echo ""

# ============================================
# STEP 6: Make scripts executable
# ============================================

echo ""
echo -e "${BLUE}[6/6] Making scripts executable...${NC}"
echo ""

chmod +x quick_start.sh 2>/dev/null || true
chmod +x setup.sh 2>/dev/null || true

# ============================================
# Installation Complete
# ============================================

echo ""
echo "========================================"
echo "   Installation Complete!"
echo "========================================"
echo ""
echo -e "${GREEN}Everything is set up and ready to use!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run './quick_start.sh' to start both servers"
echo "  2. OR manually start:"
echo "     - Backend:  cd backend && source venv/bin/activate && python main.py"
echo "     - Frontend: npm run dev"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:8081"
echo "  Backend:  http://localhost:8000"
echo "  Signs:    http://localhost:8081/signs"
echo ""
echo "For detailed usage instructions, see README.md"
echo ""

# Ask if user wants to start servers now
read -p "Would you like to start the servers now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting servers..."
    
    # Start backend in background
    cd backend
    source venv/bin/activate
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait a bit
    sleep 3
    
    # Start frontend in background
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait a bit more
    sleep 5
    
    # Try to open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:8081
    elif command -v open &> /dev/null; then
        open http://localhost:8081
    else
        echo "Please open http://localhost:8081 in your browser"
    fi
    
    echo ""
    echo "Servers are running!"
    echo "Backend PID: $BACKEND_PID"
    echo "Frontend PID: $FRONTEND_PID"
    echo ""
    echo "Press Ctrl+C to stop servers..."
    
    # Wait for user to press Ctrl+C
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
    wait
fi

echo ""
echo "Setup complete! Goodbye!"

