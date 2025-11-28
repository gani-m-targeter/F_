# 🤟 ASL Recognition System

**Real-time American Sign Language to Text & Speech Converter**

Convert ASL signs to text and speech instantly using AI-powered computer vision. Built with React, TypeScript, FastAPI, and MediaPipe.

[![ASL](https://img.shields.io/badge/Signs-90+-blue)]() [![React](https://img.shields.io/badge/React-18-61dafb)]() [![Python](https://img.shields.io/badge/Python-3.9+-3776ab)]() [![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688)]() [![Gemini](https://img.shields.io/badge/Gemini-AI-brightgreen)]()

---

## ✨ Features

🎥 **Face + Hand Detection** - MediaPipe Holistic detects face, hands, and body together  
🤖 **90+ ASL Signs** - Full alphabet (A-Z), numbers (0-9), common words, emotions  
⭐ **Face+Hand Gestures** - MOTHER, FATHER, THANK YOU, PLEASE, EAT, DRINK, and more  
📚 **Interactive Sign Guide** - Beautiful reference page with all signs and instructions  
🔊 **Text-to-Speech** - Automatically speak detected signs  
✨ **AI Sentence Refinement** - Convert ASL grammar to proper English using Google Gemini  
🎨 **Beautiful UI** - Glassmorphism design with animated effects  
⌨️ **Keyboard Shortcuts** - Full keyboard control for power users  
♿ **Accessible** - WCAG AAA compliant, screen reader support  
⚡ **Optimized Performance** - Fast loading, smooth animations, efficient processing

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Running the Application](#-running-the-application)
- [How to Use](#-how-to-use)
- [Recognized Signs](#-recognized-signs)
- [Configuration](#-configuration)
- [Troubleshooting](#-troubleshooting)
- [Architecture](#-architecture)

---

## 🚀 Quick Start

### First Time Setup (One-Time Only)

**Windows:**
```batch
# Double-click this file OR run in terminal
setup.bat
```

**macOS / Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

This will:
- ✅ Check prerequisites (Node.js, Python)
- ✅ Install all dependencies automatically
- ✅ Set up environment variables
- ✅ Configure the API keys
- ⏱️ Takes ~10-15 minutes

### Running the App (After Setup)

**Windows:**
```batch
# Double-click this file for instant start
quick_start_optimized.bat
```

**macOS / Linux:**
```bash
./quick_start.sh
```

**That's it!** The browser will open automatically at `http://localhost:8081`.

> 📝 **For detailed installation instructions, see [INSTALLATION.md](INSTALLATION.md)**

---

## 💻 Installation

### Prerequisites

Before you begin, ensure you have:

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.9+ | [python.org](https://www.python.org/) |
| **Webcam** | Any USB/Built-in | - |
| **Browser** | Chrome/Firefox/Edge (latest) | - |

---

### Step 1: Clone or Download

```bash
# If you haven't already, download the project
cd sign_to_speech-main
```

---

### Step 2: Frontend Setup

```bash
# Install dependencies
npm install

# Make sure MediaPipe Holistic is installed
npm install @mediapipe/holistic

# OR use alternative package managers:
# bun install
# pnpm install
```

**What this installs:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + Framer Motion
- **MediaPipe Holistic** (Face + Hand + Pose detection)
- Shadcn UI components
- WebSocket client

---

### Step 3: Backend Setup

```bash
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

**What this installs:**
- FastAPI (web framework)
- Uvicorn (ASGI server)
- WebSockets (real-time communication)
- NumPy (numerical computing)
- Optional: LLM libraries (Groq, Gemini, OpenAI)

---

## ▶️ Running the Application

### Method 1: Automatic (Recommended)

Use the quick start scripts that handle everything:

**Windows:**
```batch
QUICK_START.bat
```

**macOS/Linux:**
```bash
./quick_start.sh
```

---

### Method 2: Manual (Two Terminals)

#### Terminal 1: Start Frontend

```bash
# From project root
npm run dev
```

You'll see:
```
VITE v5.4.19  ready in 1721 ms

➜  Local:   http://localhost:5173/
➜  Network: http://10.0.0.88:5173/
```

#### Terminal 2: Start Backend

```bash
# From project root
cd backend

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Start server
python main.py
```

You'll see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

---

### Method 3: Frontend Only (No AI Features)

If you just want to test the basic gesture recognition without the backend:

```bash
npm run dev
```

**Note:** Without the backend, you won't have:
- AI sentence refinement
- Backend ML model inference
- Advanced gesture analysis

---

## 📱 Accessing the Application

Once the servers are running:

### Frontend URLs:
- **Primary:** http://localhost:5173
- **Fallback:** http://localhost:8081 (if 5173 is in use)
- **Network:** http://your-ip:5173 (access from other devices)

### Backend URLs:
- **API:** http://localhost:8000
- **Health Check:** http://localhost:8000/health
- **WebSocket:** ws://localhost:8000/ws

---

## 🎮 How to Use

### Basic Workflow

1. **Open the App**
   - Navigate to http://localhost:5173 in your browser

2. **Start Camera**
   - Click "Start Camera" button
   - OR press <kbd>Space</kbd>
   - Allow camera permissions when prompted

3. **Make Hand Gestures**
   - Position yourself 2-3 feet from camera
   - Show ASL signs clearly
   - Hold each sign for 1-2 seconds

4. **See Results**
   - Current gesture displays in real-time
   - Words added to transcript automatically
   - Confidence score shown (0-100%)

5. **Build Sentences** (Optional)
   - Sign multiple words in sequence
   - Press <kbd>R</kbd> to refine with AI
   - Converts ASL grammar to English grammar

6. **Listen** (Optional)
   - Press <kbd>S</kbd> to hear text-to-speech
   - OR enable "Auto-speak" for each sign

7. **Clear and Repeat**
   - Press <kbd>C</kbd> to clear transcript
   - Start signing again

---

### Keyboard Shortcuts

| Key | Action | Description |
|-----|--------|-------------|
| <kbd>Space</kbd> | Toggle Camera | Start/stop webcam |
| <kbd>R</kbd> | Refine with AI | Convert signs to proper English |
| <kbd>S</kbd> | Speak | Text-to-speech output |
| <kbd>C</kbd> | Clear | Reset transcript |
| <kbd>A</kbd> | Toggle Auto-speak | Enable/disable automatic speech |
| <kbd>W</kbd> | Toggle AI Server | Switch local/backend processing |
| <kbd>?</kbd> | Show Help | Display keyboard shortcuts |

---

### UI Controls

**Top Bar:**
- 🎥 **Start/Stop Camera** - Toggle webcam
- ✨ **Refine with AI** - Grammar correction
- 🔊 **Speak** - Text-to-speech
- 🗑️ **Clear** - Reset everything

**Settings (Toggles):**
- 🌐 **AI Server** - Use backend for processing
- 🔊 **Auto-speak** - Speak each sign automatically

---

## 🤟 Recognized Signs

The system currently recognizes **25+ ASL signs**. For a complete visual guide with hand positions, see:

👉 **[SIGN_LANGUAGE_GUIDE.md](SIGN_LANGUAGE_GUIDE.md)** 👈

### Quick Reference:

**Greetings:** HELLO, THANKS, PLEASE, SORRY  
**Responses:** YES, NO, OK, GOOD, BAD  
**Pronouns:** I, YOU  
**Numbers:** TWO, THREE, FOUR  
**Actions:** GO, STOP, HELP, WANT, CALL, EAT, DRINK  
**Emotions:** LOVE, LIKE  
**Other:** MORE

---

## ⚙️ Configuration

### Frontend Configuration

**WebSocket URL** (if backend is on different machine):

Edit `src/services/websocket.ts`:
```typescript
// Change localhost to your backend IP
const wsService = new WebSocketService('ws://192.168.1.100:8000/ws');
```

**MediaPipe Settings** (adjust detection sensitivity):

Edit `src/components/EnhancedWebcamCapture.tsx`:
```typescript
hands.setOptions({
  maxNumHands: 2,           // 1 or 2 hands
  modelComplexity: 1,       // 0 (lite), 1 (full)
  minDetectionConfidence: 0.5,   // 0.0 to 1.0
  minTrackingConfidence: 0.5,    // 0.0 to 1.0
});
```

---

### Backend Configuration

**Optional: Add LLM API Key for Sentence Refinement**

Create `backend/.env` file:

```env
# Groq (Recommended - Fast & Free)
GROQ_API_KEY=your_groq_api_key_here

# OR Google Gemini (Free tier available)
GEMINI_API_KEY=your_gemini_api_key_here

# OR OpenAI (Paid)
OPENAI_API_KEY=your_openai_api_key_here
```

**Get API Keys:**
- **Groq:** https://console.groq.com/ (FREE, recommended)
- **Gemini:** https://makersuite.google.com/app/apikey (FREE)
- **OpenAI:** https://platform.openai.com/api-keys (PAID)

**Install LLM Library** (if using):
```bash
# For Groq
pip install groq

# For Gemini
pip install google-generativeai

# For OpenAI
pip install openai
```

**Other Backend Settings:**

Edit `backend/main.py`:
```python
# Confidence threshold (0.0 to 1.0)
confidence_threshold = 0.7

# Max words in buffer
MAX_WORDS = 10

# CORS origins (add your frontend URL)
allow_origins=["http://localhost:5173", "http://your-domain.com"]
```

---

## 🐛 Troubleshooting

### Frontend Issues

#### ❌ Camera Not Working

**Problem:** "Camera access denied" or blank video

**Solutions:**
1. **Check browser permissions:**
   - Chrome: Settings → Privacy → Camera → Allow
   - Firefox: Preferences → Privacy → Permissions → Camera
   
2. **Close other apps using camera:**
   - Zoom, Teams, Skype, etc.
   
3. **Try different browser:**
   - Chrome usually has best webcam support
   
4. **Check camera in other apps first:**
   - Open camera app to verify it works

#### ❌ Port Already in Use

**Problem:** "Port 5173 already in use"

**Solutions:**
1. **Kill the process:**
   ```bash
   # Windows
   netstat -ano | findstr :5173
   taskkill /PID [PID] /F
   
   # macOS/Linux
   lsof -ti:5173 | xargs kill -9
   ```

2. **Change port in vite.config.ts:**
   ```typescript
   export default defineConfig({
     server: {
       port: 3000  // Use different port
     }
   })
   ```

#### ❌ Slow Performance

**Problem:** Low FPS, laggy detection

**Solutions:**
1. **Reduce MediaPipe complexity:**
   - Change `modelComplexity: 0` (lite mode)
   
2. **Reduce particle count:**
   - Edit `src/components/AnimatedBackground.tsx`
   - Change `Array.from({ length: 10 }, ...)` (was 20)
   
3. **Close other tabs/apps**
   
4. **Use wired internet** (for WebSocket)

---

### Backend Issues

#### ❌ Backend Won't Start

**Problem:** Python errors, module not found

**Solutions:**
1. **Verify virtual environment is activated:**
   ```bash
   # Should see (venv) in prompt
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

2. **Reinstall dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Check Python version:**
   ```bash
   python --version  # Should be 3.9+
   ```

#### ❌ WebSocket Connection Failed

**Problem:** "AI Server: Offline" or connection errors

**Solutions:**
1. **Verify backend is running:**
   - Open http://localhost:8000/health
   - Should return JSON with "healthy" status
   
2. **Check firewall:**
   - Allow Python through Windows Firewall
   
3. **Verify CORS settings:**
   - Check `backend/main.py` CORS origins
   
4. **Check WebSocket URL:**
   - Frontend should connect to `ws://localhost:8000/ws`

#### ❌ NumPy Installation Error (Windows)

**Problem:** "Could not build wheels for numpy"

**Solution:**
```bash
# Install pre-built version
pip install numpy --only-binary :all:

# OR install specific version
pip install numpy==2.3.5
```

---

### Detection Issues

#### ❌ Low Accuracy

**Problem:** Wrong signs detected or no detection

**Solutions:**
1. **Improve lighting:**
   - Bright, even lighting from front
   - Avoid backlighting

2. **Check hand position:**
   - Center hands in frame
   - 2-3 feet from camera
   - Keep hands still for 1-2 seconds

3. **Adjust confidence threshold:**
   - Lower `minDetectionConfidence` to 0.3
   
4. **Clean background:**
   - Solid color wall behind you
   - Remove clutter

5. **Practice signs:**
   - See SIGN_LANGUAGE_GUIDE.md for correct positions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│           React + TypeScript + Vite                 │
│                                                      │
│  ┌──────────────┐    ┌─────────────────┐           │
│  │   Webcam     │───→│  MediaPipe      │           │
│  │   (Camera)   │    │  Hands API      │           │
│  └──────────────┘    │  (21 landmarks) │           │
│                      └─────────┬─────────┘           │
│                                │                     │
│                                ↓                     │
│                  ┌──────────────────────┐           │
│                  │  Gesture Recognition │           │
│                  │  (Local/Frontend)    │           │
│                  └──────────────────────┘           │
│                                │                     │
│                                ↓                     │
│                  ┌──────────────────────┐           │
│                  │  UI Display          │           │
│                  │  - Current Gesture   │           │
│                  │  - Transcript        │           │
│                  │  - Confidence        │           │
│                  └──────────────────────┘           │
└─────────────────────┬───────────────────────────────┘
                      │
                      │ WebSocket (Optional)
                      │ Sends: Hand Landmarks
                      │ Receives: Predictions
                      ↓
┌─────────────────────────────────────────────────────┐
│                    BACKEND (Optional)                │
│              FastAPI + Python                       │
│                                                      │
│  ┌──────────────┐    ┌─────────────────┐           │
│  │  WebSocket   │───→│  ML Model       │           │
│  │  Handler     │    │  (LSTM/CNN)     │           │
│  └──────────────┘    └────────┬────────┘           │
│                                │                     │
│                                ↓                     │
│                  ┌──────────────────────┐           │
│                  │  Gesture Recognition │           │
│                  │  (Enhanced)          │           │
│                  └──────────┬───────────┘           │
│                             │                        │
│                             ↓                        │
│                  ┌──────────────────────┐           │
│                  │  LLM Refinement      │           │
│                  │  (Groq/Gemini)       │           │
│                  │  ASL → English       │           │
│                  └──────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **UI Components:** Shadcn UI (Radix UI)
- **State Management:** React Hooks
- **AI/ML:** MediaPipe Hands (Google)
- **Communication:** WebSocket (socket.io-client)

### Backend
- **Framework:** FastAPI (Python)
- **Server:** Uvicorn (ASGI)
- **Communication:** WebSockets
- **ML/AI:** NumPy, TensorFlow/PyTorch (optional)
- **LLM Integration:** Groq, Google Gemini, OpenAI (optional)

---

## 📂 Project Structure

```
sign_to_speech-main/
├── backend/
│   ├── main.py                 # FastAPI server + WebSocket
│   ├── llm_integration.py      # LLM providers (Groq, Gemini, etc.)
│   ├── model_template.py       # ML model template
│   ├── requirements.txt        # Python dependencies
│   └── models/                 # Place your .h5 models here
│
├── src/
│   ├── components/
│   │   ├── EnhancedWebcamCapture.tsx    # Webcam + MediaPipe
│   │   ├── AnimatedBackground.tsx        # Particle effects
│   │   ├── CurrentGestureDisplay.tsx     # Current sign
│   │   ├── TranscriptDisplay.tsx         # Word list
│   │   ├── ConfidenceBar.tsx            # Confidence meter
│   │   └── ui/                          # Shadcn components
│   │
│   ├── pages/
│   │   ├── EnhancedIndex.tsx            # Main app page
│   │   └── NotFound.tsx                 # 404 page
│   │
│   ├── services/
│   │   └── websocket.ts                 # WebSocket client
│   │
│   ├── hooks/                           # React custom hooks
│   ├── lib/                             # Utilities
│   └── main.tsx                         # App entry point
│
├── public/
│   ├── icon.svg                         # App favicon
│   ├── og-image.svg                     # Social sharing image
│   └── placeholder.svg                  # Placeholder image
│
├── index.html                           # HTML template
├── package.json                         # Node dependencies
├── tailwind.config.ts                   # Tailwind configuration
├── vite.config.ts                       # Vite configuration
├── QUICK_START.bat                      # Windows quick start
├── quick_start.sh                       # macOS/Linux quick start
├── README.md                            # This file
└── SIGN_LANGUAGE_GUIDE.md              # Sign language reference
```

---

## 🚀 Next Steps

1. ✅ **Run the app** - Use quick start scripts
2. ✅ **Test basic signs** - Try HELLO, YES, TWO
3. ✅ **Review sign guide** - See SIGN_LANGUAGE_GUIDE.md
4. ✅ **Enable AI refinement** - Add Groq API key
5. ✅ **Customize UI** - Change colors, animations
6. ✅ **Add more signs** - Extend gesture recognition
7. ✅ **Train custom model** - Use your own ML model
8. ✅ **Deploy** - Host on Vercel, Railway, etc.

---

## 📞 Support & Resources

**Need help?**
- 📖 Read [SIGN_LANGUAGE_GUIDE.md](SIGN_LANGUAGE_GUIDE.md) for sign reference
- 🔍 Check troubleshooting section above
- 💬 Open an issue on GitHub
- 📧 Contact support

**Useful Links:**
- MediaPipe Documentation: https://google.github.io/mediapipe/
- Groq API Docs: https://console.groq.com/docs
- FastAPI Docs: https://fastapi.tiangolo.com/
- React Docs: https://react.dev/

---

## 📄 License

MIT License - Free to use for personal and commercial projects.

---

## 🙏 Acknowledgments

- **Google MediaPipe** - Hand tracking technology
- **Shadcn UI** - Beautiful component library
- **Framer Motion** - Smooth animations
- **ASL Community** - Sign language resources and support

---

**Built with ❤️ for accessibility and inclusion**

🤟 **Making communication barrier-free through technology**

---

## ⭐ Star This Project

If you find this project helpful, please consider giving it a star on GitHub!

[⬆ Back to Top](#-asl-recognition-system)
