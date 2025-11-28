# 🚀 Complete Installation Guide

This guide will help you set up the ASL Recognition System from scratch on any machine.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Automated Installation](#automated-installation)
- [Manual Installation](#manual-installation)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [For Developers](#for-developers)

---

## ✅ Prerequisites

Before starting, make sure you have these installed:

### Required Software

| Software | Minimum Version | Download Link |
|----------|----------------|---------------|
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.9+ | [python.org](https://www.python.org/) |
| **Webcam** | Any USB or built-in | - |
| **Browser** | Chrome/Firefox/Edge (latest) | - |

### How to Check Versions

**Windows (Command Prompt or PowerShell):**
```cmd
node --version
python --version
npm --version
pip --version
```

**macOS/Linux (Terminal):**
```bash
node --version
python3 --version
npm --version
pip3 --version
```

If any command returns "not found" or "not recognized", install that software first.

---

## 🎯 Automated Installation

### For Windows Users

1. **Download the Project**
   - Extract the `sign_to_speech-main` folder to your desired location
   - Example: `C:\Users\YourName\Downloads\sign_to_speech-main`

2. **Run the Setup Script**
   - Navigate to the project folder
   - **Double-click** `setup.bat`
   - OR open Command Prompt and run:
     ```cmd
     cd path\to\sign_to_speech-main
     setup.bat
     ```

3. **Wait for Installation**
   - The script will automatically:
     - Check prerequisites
     - Install frontend dependencies (~2-5 min)
     - Install backend dependencies (~5-10 min)
     - Configure environment variables
     - Set up API keys

4. **Start the Application**
   - When prompted, choose "Y" to start servers automatically
   - OR run `quick_start_optimized.bat` later

### For macOS/Linux Users

1. **Download the Project**
   - Extract the `sign_to_speech-main` folder
   - Example: `~/Downloads/sign_to_speech-main`

2. **Make Scripts Executable**
   ```bash
   cd ~/Downloads/sign_to_speech-main
   chmod +x setup.sh
   chmod +x quick_start.sh
   ```

3. **Run the Setup Script**
   ```bash
   ./setup.sh
   ```

4. **Wait for Installation**
   - The script will handle everything automatically
   - Total time: ~10-15 minutes

5. **Start the Application**
   - When prompted, choose "y" to start servers
   - OR run `./quick_start.sh` later

---

## 🔧 Manual Installation

If automated installation fails, follow these manual steps:

### Step 1: Install Frontend Dependencies

```bash
# Navigate to project folder
cd sign_to_speech-main

# Install npm packages
npm install

# Install MediaPipe Holistic
npm install @mediapipe/holistic
```

### Step 2: Install Backend Dependencies

**Windows:**
```cmd
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install fastapi uvicorn[standard] websockets python-socketio
pip install numpy --only-binary :all:
pip install google-generativeai python-multipart pydantic

# Go back to project root
cd ..
```

**macOS/Linux:**
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install fastapi "uvicorn[standard]" websockets python-socketio
pip install numpy
pip install google-generativeai python-multipart pydantic

# Go back to project root
cd ..
```

### Step 3: Configure Environment Variables

Create a file `backend/.env` with the following content:

```env
# Google Gemini API Key (for sentence refinement)
GEMINI_API_KEY=AIzaSyBMlLMXILt7mHhKQttsqWg_EckZy-3gfk8

# Optional: Other LLM Providers
# GROQ_API_KEY=your_groq_key_here
# OPENAI_API_KEY=your_openai_key_here
```

---

## ▶️ Running the Application

### Quick Start (Easiest)

**Windows:**
```cmd
quick_start_optimized.bat
```

**macOS/Linux:**
```bash
./quick_start.sh
```

### Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

python main.py
```

**Terminal 2 - Frontend:**
```bash
# In project root
npm run dev
```

### Access the Application

Once both servers are running:

- **Main App:** http://localhost:8081
- **API Docs:** http://localhost:8000/docs
- **Sign Reference:** http://localhost:8081/signs

---

## 🐛 Troubleshooting

### Issue: "node: command not found"

**Solution:** Install Node.js from [nodejs.org](https://nodejs.org/)

After installation, restart your terminal.

### Issue: "python: command not found" (macOS/Linux)

**Solution:** Use `python3` instead of `python`:
```bash
python3 --version
```

### Issue: "@mediapipe/holistic not found"

**Solution:** Install it manually:
```bash
npm install @mediapipe/holistic --legacy-peer-deps
```

### Issue: "ModuleNotFoundError: No module named 'fastapi'"

**Solution:** 
1. Make sure virtual environment is activated
2. Reinstall dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Issue: NumPy installation fails

**Solution (Windows):**
```cmd
pip install numpy --only-binary :all:
```

**Solution (macOS/Linux):**
```bash
# Install build tools first
# macOS:
xcode-select --install
# Ubuntu/Debian:
sudo apt-get install python3-dev
# Then:
pip install numpy
```

### Issue: "Port 8081 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8081 | xargs kill -9
```

### Issue: Camera not working

**Solution:**
1. Allow camera permissions in browser
2. Close other apps using the camera
3. Try a different browser (Chrome recommended)
4. Check camera privacy settings in OS

---

## 👨‍💻 For Developers

### Project Structure

```
sign_to_speech-main/
├── backend/                 # FastAPI backend
│   ├── main.py             # Main server file
│   ├── llm_integration.py  # LLM/AI integration
│   ├── requirements.txt    # Python dependencies
│   ├── venv/               # Virtual environment (created during setup)
│   └── .env                # Environment variables (created during setup)
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── pages/              # Page components
│   └── services/           # API/WebSocket services
├── public/                 # Static assets
├── node_modules/           # npm packages (created during setup)
├── package.json            # Frontend dependencies
├── setup.bat               # Windows setup script
├── setup.sh                # Unix/Mac setup script
├── quick_start_optimized.bat  # Windows quick start
├── quick_start.sh          # Unix/Mac quick start
└── README.md               # Main documentation
```

### Key Dependencies

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Framer Motion
- MediaPipe Holistic (face + hand + pose detection)
- Shadcn UI components
- Socket.io client

**Backend:**
- FastAPI (web framework)
- Uvicorn (ASGI server)
- WebSockets
- NumPy (numerical computing)
- Google Generative AI (Gemini API)

### Development Commands

```bash
# Frontend dev server with hot reload
npm run dev

# Backend dev server with auto-reload
cd backend
uvicorn main:app --reload

# Build frontend for production
npm run build

# Preview production build
npm run preview

# Lint frontend code
npm run lint
```

### API Endpoints

**Backend (http://localhost:8000):**
- `GET /` - API info
- `GET /health` - Health check
- `WS /ws/{client_id}` - WebSocket connection
- `GET /docs` - Swagger API documentation

**Frontend:**
- `/` - Main app (camera + detection)
- `/signs` - ASL sign reference guide
- `/classic` - Classic mode (if available)

---

## 📦 Sharing the Project

### For Recipients

If someone sends you this project:

1. **Extract the folder**
2. **Run the setup script:**
   - Windows: Double-click `setup.bat`
   - Mac/Linux: Run `./setup.sh` in terminal
3. **Wait for installation** (~15 minutes)
4. **Start the app** when prompted

That's it! No manual configuration needed.

### For Senders

When sharing this project:

1. **Compress the entire folder**
2. **Include these files:**
   - `setup.bat` (for Windows)
   - `setup.sh` (for Mac/Linux)
   - `quick_start_optimized.bat`
   - `quick_start.sh`
   - `README.md`
   - `INSTALLATION.md` (this file)

3. **Optional:** Remove these folders to reduce size:
   - `node_modules/` (will be recreated)
   - `backend/venv/` (will be recreated)
   - `.git/` (if not needed)

4. **Tell recipient:**
   - "Just run `setup.bat` (Windows) or `./setup.sh` (Mac/Linux)"
   - "Make sure Node.js and Python are installed first"

---

## 🎉 Success!

If installation was successful, you should see:

1. ✅ Both servers running without errors
2. ✅ Browser opens to http://localhost:8081
3. ✅ Camera interface loads
4. ✅ Face + hand detection working (green/blue/orange overlays)

Now you're ready to use the ASL Recognition System!

For usage instructions, see [README.md](README.md)

For camera setup tips, see [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
3. Check browser console (F12) for errors
4. Verify all prerequisites are correctly installed

---

**Happy Signing! 🤟**

