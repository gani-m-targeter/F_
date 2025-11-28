# 🤖 Google Gemini Pro API Setup Guide

Complete guide to integrate Google Gemini Pro for AI-powered sentence refinement.

---

## ✨ What is Gemini Pro?

Google Gemini Pro is a powerful, FREE AI model that will convert your ASL signs into grammatically correct English sentences.

**Example:**
- **Input:** "ME GO STORE TOMORROW"
- **Output:** "I am going to the store tomorrow."

---

## 📋 Step-by-Step Setup

### Step 1: Get Your Free API Key

1. **Open this URL in your browser:**
   ```
   https://makersuite.google.com/app/apikey
   ```
   Or: https://aistudio.google.com/apikey

2. **Sign in** with your Google account

3. **Click "Create API Key"**

4. **Copy the generated key** (starts with `AIza...`)
   - Keep this key secure!
   - Don't share it publicly

---

### Step 2: Set Up the API Key

You have **3 options** to set your API key:

#### Option 1: Use the Setup Script (EASIEST) ⭐

1. Navigate to the backend folder
2. Run the setup script:
   ```batch
   cd backend
   set_gemini_key.bat
   ```

3. Paste your API key when prompted
4. Server starts automatically!

---

#### Option 2: Set Environment Variable (Windows)

**Temporary (Current Session Only):**
```batch
set GEMINI_API_KEY=your_api_key_here
cd backend
python main.py
```

**Permanent (All Sessions):**
1. Press `Windows + R`
2. Type: `sysdm.cpl` and press Enter
3. Click "Advanced" tab → "Environment Variables"
4. Under "User variables", click "New"
5. Variable name: `GEMINI_API_KEY`
6. Variable value: `your_api_key_here`
7. Click OK

---

#### Option 3: Python-dotenv (Recommended for Development)

1. Install python-dotenv:
   ```bash
   pip install python-dotenv
   ```

2. Create a `.env` file in the `backend` folder:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Add this to the top of `main.py`:
   ```python
   from dotenv import load_dotenv
   load_dotenv()  # Load environment variables from .env
   ```

4. Start the server:
   ```bash
   python main.py
   ```

---

## 🚀 Testing Your Setup

### 1. Start the Backend

```bash
cd backend
python main.py
```

**You should see:**
```
✓ Gemini API initialized
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     ASL Recognition System started successfully
```

---

### 2. Test the API

Open your browser and visit:
```
http://localhost:8000/health
```

**Should return:**
```json
{
  "status": "operational",
  "version": "2.0.0",
  "features": {
    "llm_refinement": true
  }
}
```

---

### 3. Test from Frontend

1. **Start your frontend:**
   ```bash
   npm run dev
   ```

2. **Open:** http://localhost:5173 (or 8081)

3. **Enable AI Server** toggle (on the UI)

4. **Sign some gestures** (e.g., HELLO, I, GO)

5. **Press `R`** or click "Refine with AI"

6. **See the magic!** ✨
   - Raw: "HELLO I GO"
   - Refined: "Hello, I am going."

---

## 🎯 How It Works

```
Your Hand Gestures
        ↓
MediaPipe Detection
        ↓
   [Words Buffer]
   "HELLO I GO STORE"
        ↓
   Press [R] to refine
        ↓
    Gemini Pro API
        ↓
  "Hello, I am going to the store."
        ↓
   Text-to-Speech (Press S)
```

---

## 💡 Usage Examples

### Example 1: Simple Greeting
**Signs:** HELLO YOU  
**Refined:** "Hello, how are you?"

### Example 2: Request
**Signs:** I WANT HELP  
**Refined:** "I want help."

### Example 3: Action
**Signs:** ME GO STORE TOMORROW  
**Refined:** "I am going to the store tomorrow."

### Example 4: Question
**Signs:** YOU GOOD  
**Refined:** "Are you okay?"

---

## ⚙️ Configuration Options

You can adjust Gemini's behavior in `backend/llm_integration.py`:

```python
async def _refine_with_gemini(self, text: str) -> str:
    prompt = (
        f"Convert this American Sign Language (ASL) word sequence into a "
        f"grammatically correct English sentence. ASL grammar differs from English. "
        f"Return only the refined sentence:\n\n{text}"
    )
    
    # Optional: Add generation config
    response = self.client.generate_content(
        prompt,
        generation_config={
            "temperature": 0.3,  # Lower = more consistent
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 200,
        }
    )
    return response.text.strip()
```

---

## 🆘 Troubleshooting

### Issue 1: "GEMINI_API_KEY not found"

**Problem:** API key not set

**Solution:**
```batch
# Set for current session
set GEMINI_API_KEY=your_key_here

# Verify it's set
echo %GEMINI_API_KEY%
```

---

### Issue 2: "Could not import google.generativeai"

**Problem:** Package not installed

**Solution:**
```bash
cd backend
venv\Scripts\activate
pip install google-generativeai
```

---

### Issue 3: API Returns Error 400/401

**Problem:** Invalid or expired API key

**Solutions:**
1. Generate a new API key from Google AI Studio
2. Check for extra spaces in your key
3. Ensure key starts with `AIza`

---

### Issue 4: "Warning: GEMINI_API_KEY not found. Using fallback."

**Problem:** Server starts but doesn't use Gemini

**Solution:**
- Backend falls back to basic refinement
- Check that environment variable is set **before** starting Python
- Restart terminal after setting environment variable

---

### Issue 5: Slow Response

**Problem:** Refinement takes 3-5 seconds

**This is normal!** Gemini API calls take time.

**Options:**
- Use local processing (toggle "AI Server" OFF)
- Switch to Groq API (faster, also free)
- Cache common phrases (advanced)

---

## 💰 Pricing & Limits

### Free Tier (Gemini Pro)
- **60 requests per minute**
- **1,500 requests per day**
- **FREE forever!**

This is more than enough for personal use!

**Rate limit handling:**
- Backend automatically uses fallback if API fails
- User sees basic refinement instead

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep your API key private
- Use environment variables
- Don't commit `.env` files to Git
- Rotate keys periodically

### ❌ DON'T:
- Share your key publicly
- Hardcode keys in source code
- Commit keys to version control
- Use the same key for multiple projects

---

## 🔄 Switching Providers

Want to try different AI providers?

### Use Groq (Faster, Also Free)

1. Get API key: https://console.groq.com/
2. Set environment variable:
   ```batch
   set GROQ_API_KEY=your_groq_key
   ```
3. Backend automatically uses Groq if available

### Priority Order

Backend checks in this order:
1. **GROQ_API_KEY** → Uses Groq (fastest)
2. **GEMINI_API_KEY** → Uses Gemini (best quality)
3. **OPENAI_API_KEY** → Uses GPT-3.5 (paid)
4. **None** → Basic refinement (free, offline)

---

## 📊 Comparison: Gemini vs Others

| Feature | Gemini Pro | Groq | GPT-3.5 | Basic |
|---------|-----------|------|---------|-------|
| **Cost** | FREE | FREE | PAID | FREE |
| **Speed** | ~2-3s | ~1s | ~2s | <0.1s |
| **Quality** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Setup** | Easy | Easy | Medium | None |
| **Rate Limit** | 60/min | 30/min | Varies | None |
| **Offline** | ❌ No | ❌ No | ❌ No | ✅ Yes |

---

## 🧪 Testing the Integration

### Manual Test

```bash
cd backend
python llm_integration.py
```

**Expected output:**
```
Testing LLM Refinement
==================================================
Input: ME GO STORE TOMORROW

gemini         → I am going to the store tomorrow.
```

---

### WebSocket Test

Use frontend or test with:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  // Send signs
  ws.send(JSON.stringify({
    type: 'landmarks',
    data: [...landmarks...]
  }));
  
  // Request refinement
  ws.send(JSON.stringify({
    type: 'refine_sentence'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'refined_sentence') {
    console.log('Original:', data.original);
    console.log('Refined:', data.refined);
  }
};
```

---

## 📚 Additional Resources

**Official Documentation:**
- Gemini API Docs: https://ai.google.dev/docs
- Python SDK: https://github.com/google/generative-ai-python
- Pricing: https://ai.google.dev/pricing

**Get Help:**
- Google AI Forum: https://discuss.ai.google.dev/
- GitHub Issues: https://github.com/google/generative-ai-python/issues

---

## ✅ Quick Start Checklist

- [ ] Get Gemini API key from Google AI Studio
- [ ] Install `google-generativeai` package
- [ ] Set `GEMINI_API_KEY` environment variable
- [ ] Start backend server
- [ ] See "✓ Gemini API initialized" message
- [ ] Test with frontend
- [ ] Press `R` to refine sentences
- [ ] Enjoy AI-powered translations! 🎉

---

## 🎉 You're All Set!

Your ASL Recognition system now has AI-powered sentence refinement with Google Gemini Pro!

**Next Steps:**
1. Try signing different combinations
2. Experiment with sentence complexity
3. Share feedback on accuracy

**Questions?** Check the main README.md or create an issue!

---

**Happy signing! 🤟**

