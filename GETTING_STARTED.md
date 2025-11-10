# 🚀 Getting Started with MakersAI Studio

## Quick Start (3 Steps)

### Step 1: Get Your Gemini API Key

1. Go to https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key

### Step 2: Configure the Application

Open `server/.env` in a text editor and replace this line:

```bash
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

With your actual API key:

```bash
GEMINI_API_KEY=AIzaSyD...your_actual_key_here
```

### Step 3: Run the Application

Open a terminal in the project directory and run:

```bash
npm run dev:all
```

This will start both the backend (port 3001) and frontend (port 3000).

Open your browser to: **http://localhost:3000**

---

## 🎨 Using the Application

### Generate a 3D Model

1. Enter a prompt like: "a 20mm cube with rounded corners"
2. Click "Generate"
3. Wait for the AI to generate OpenSCAD code and a preview image
4. View the 3D model in the preview window
5. Download as .scad, .stl, .png, or .svg

### Validate for Your Printer

Before printing, validate dimensions for your Anycubic Kobra 3 Combo:

```bash
# Example API call (or use the UI)
POST http://localhost:3001/api/printers/validate/dimensions
{
  "profileId": "anycubic-kobra-3-combo",
  "width": 200,
  "depth": 200,
  "height": 250
}
```

The app will tell you if the design fits your printer's build volume (250×250×260mm).

### Generate Laser Cutting Files

1. Enable "Laser Cutting Mode" in the UI
2. Generate a design
3. Download the SVG file
4. Use it with your Kobra 3 Combo's 400×400mm laser engraver

---

## 🧪 Run Tests

To verify everything is working:

```bash
cd server
npm test
```

You should see:
```
Test Suites: 2 passed, 2 total
Tests:       27 passed, 27 total
```

---

## 📦 Build Windows Executable

To create a standalone Windows app:

```bash
# Build everything
npm run build
cd server && npm run build && cd ..

# Package as Windows executable
npm run package:win
```

Find the executable in `release/` directory:
- `MakersAI Studio Setup X.X.X.exe` (Installer)
- `MakersAI Studio X.X.X.exe` (Portable)

---

## 🔧 Troubleshooting

### "Invalid environment variables" Error

**Problem:** Backend won't start

**Solution:** Make sure you've added your Gemini API key to `server/.env`

### "Port 3001 already in use" Error

**Problem:** Another process is using port 3001

**Solution:** 
1. Stop the other process, or
2. Change the port in `server/.env`:
   ```bash
   PORT=3002
   ```

### Tests Failing

**Problem:** Some tests are failing

**Solution:** 
1. Make sure you've installed dependencies: `cd server && npm install`
2. Run tests again: `npm test`
3. If still failing, check the error messages

### Gemini API Errors

**Problem:** "API key invalid" or "Quota exceeded"

**Solution:**
1. Verify your API key is correct in `server/.env`
2. Check your Gemini API quota at https://aistudio.google.com/
3. Wait for quota to reset (rate limit: 10 requests/hour by default)

---

## 📚 Additional Resources

- **Full Documentation:** See `README.md`
- **Implementation Details:** See `IMPLEMENTATION_SUMMARY.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Quick Start:** See `QUICKSTART.md`

---

## 🎯 What's Next?

### Immediate Actions:
1. ✅ Add your Gemini API key to `server/.env`
2. ✅ Run `npm run dev:all`
3. ✅ Generate your first 3D model!

### Optional Enhancements:
- Add more printer profiles for other machines
- Customize rate limits in `server/.env`
- Enable/disable caching
- Deploy to a cloud server (AWS, Azure, DigitalOcean)
- Add authentication for multi-user support
- Integrate with Stripe for monetization

---

## 💡 Tips for Your Anycubic Kobra 3 Combo

### Best Practices:
1. **Always validate dimensions** before printing
2. **Use the optimization suggestions** for better print quality
3. **Enable auto-leveling** in your printer settings
4. **Test with small models first** before large prints
5. **Use the laser cutting mode** for 2D designs

### Recommended Settings:
- **Layer Height:** 0.2mm (default)
- **Wall Thickness:** 1.2mm (default)
- **Infill:** 20% for prototypes, 50%+ for functional parts
- **Print Speed:** 50-100mm/s (Kobra 3 can do up to 500mm/s)

### Laser Engraving:
- **Max Area:** 400×400mm
- **Supported Materials:** Wood, leather, acrylic, cardboard
- **Power:** Adjust based on material (start low, increase gradually)

---

## 🆘 Need Help?

1. Check the documentation files in this repository
2. Review the test files in `server/src/__tests__/` for usage examples
3. Open an issue on GitHub: https://github.com/MfFischer/makersai-studio/issues

---

## 🎉 You're All Set!

Your MakersAI Studio is ready to use. Start generating 3D models and laser cutting designs for your Anycubic Kobra 3 Combo!

**Happy Making!** 🚀

