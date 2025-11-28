# 🎥 Camera Setup for Face+Hand Detection

## Important: Updated System Requirements

The ASL Recognition System now uses **MediaPipe Holistic** instead of just hands. This allows detection of:
- ✅ Hand gestures (alphabet, numbers)
- ✅ Face + hand combinations (MOTHER, FATHER, THANK YOU, PLEASE, EAT, DRINK, etc.)
- ✅ Body pose context

## 📸 Camera Positioning

For the system to work correctly, you need to position your camera so it can see:

### ✅ **Optimal Camera Position:**
```
        [Camera]
           |
           v
    +-------------+
    |   👤 Face   |  <- Upper frame
    |             |
    |   👐 Hands  |  <- Middle/lower frame
    |             |
    |   🫁 Chest  |  <- For PLEASE, SORRY signs
    +-------------+
```

### **Distance from Camera:**
- **Ideal:** 2-3 feet (60-90 cm)
- **Too close:** Face fills entire frame, hands cut off
- **Too far:** Landmarks not detected accurately

### **What Should Be Visible:**
✅ Your entire head (face)  
✅ Your shoulders  
✅ Your chest area  
✅ Both hands when raised to face level  
✅ Space above and below for hand movements

## 🚀 Quick Setup Steps

### 1. Install New Dependencies
```bash
cd sign_to_speech-main
npm install @mediapipe/holistic
```

### 2. Start the Application
```batch
# Windows
quick_start_optimized.bat

# Or manually
npm run dev   # Frontend (Terminal 1)
cd backend && python main.py   # Backend (Terminal 2)
```

### 3. Camera Test Checklist
When the camera starts, verify you can see:
- [ ] Green face mesh overlay on your face
- [ ] Blue hand landmarks on right hand
- [ ] Purple hand landmarks on left hand
- [ ] Orange pose landmarks (shoulders, chest)

### 4. Test Face+Hand Gestures

#### Easy Test: MOTHER
1. Position yourself so camera sees your face AND hands
2. Make "5" handshape (open palm)
3. Touch your thumb to your chin
4. ✅ Should detect "MOTHER"

#### Easy Test: FATHER
1. Open palm (5 fingers)
2. Touch thumb to your forehead
3. ✅ Should detect "FATHER"

#### Easy Test: THANK YOU
1. Open palm at chin level
2. Move hand forward and down
3. ✅ Should detect "THANK_YOU"

## ⚠️ Troubleshooting

### Problem: "Only detecting hands, not face gestures"
**Solution:** 
- Make sure your face is visible in the camera
- Adjust distance: move back so camera sees face + chest + hands
- Check lighting: face should be well-lit
- Verify camera permissions in browser

### Problem: "No landmarks appearing"
**Solution:**
- Check browser console for errors
- Verify @mediapipe/holistic is installed: `npm list @mediapipe/holistic`
- Clear browser cache and reload
- Try different browser (Chrome recommended)

### Problem: "Slow/laggy detection"
**Solution:**
- Close other browser tabs
- Use modelComplexity: 1 (in code, already optimized)
- Ensure good lighting (reduces processing)
- Check CPU usage

### Problem: "Camera permission denied"
**Solution:**
- Click the camera icon in browser address bar
- Select "Always allow" for this site
- Reload the page

## 📊 Performance Notes

**Loading Time:**
- First load: ~5-10 seconds (downloading Holistic model)
- Subsequent loads: ~2-3 seconds (cached)

**Detection Speed:**
- Hand-only gestures: 30-60 FPS
- Face+hand gestures: 20-30 FPS
- Complex scenes: 15-20 FPS

**Browser Compatibility:**
- ✅ Chrome/Edge (Chromium): Best performance
- ✅ Firefox: Good performance
- ⚠️ Safari: Limited support

## 🎯 Signs That Require Face Detection

**Greetings:**
- PLEASE ⭐ (hand on chest)
- THANK YOU ⭐ (chin to forward)
- SORRY ⭐ (fist on chest)

**Family:**
- MOTHER ⭐ (thumb at chin)
- FATHER ⭐ (thumb at forehead)

**Verbs:**
- EAT ⭐ (hand to mouth)
- DRINK ⭐ (thumb to mouth)
- SLEEP ⭐ (hand on face)
- KNOW ⭐ (fingertips at forehead)

⭐ = Requires camera to see face + hands

## 💡 Tips for Best Results

1. **Lighting:** Face should be evenly lit, no harsh shadows
2. **Background:** Plain, uncluttered background works best
3. **Position:** Sit straight, face the camera directly
4. **Hand Speed:** Move deliberately, not too fast
5. **Practice:** Some signs need practice for consistent detection

## 📝 Still Having Issues?

Check the browser console (F12) for error messages and report them with:
- Your browser version
- Error message
- Which sign you were trying to make
- Screenshot if possible

---

**Remember:** The ⭐ star indicates signs that need face+hand visibility!

