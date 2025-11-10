# Quick Start Guide - MakersAI Studio

Get up and running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- Google Gemini API key ([Get one free here](https://aistudio.google.com/app/apikey))

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/MfFischer/makersai-studio.git
cd makersai-studio
```

### Step 2: Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

Or manually:

```bash
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### Step 3: Configure Environment

```bash
# Backend configuration
cd server
cp .env.example .env
```

Edit `server/.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### Step 4: Start the Application

**Option A: Start both frontend and backend together**

```bash
npm run dev:all
```

**Option B: Start separately (recommended for development)**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### Step 5: Open the App

Open your browser and navigate to:
```
http://localhost:3000
```

## First Steps

### 1. Try a Simple Example

Enter this prompt:
```
a 20mm cube with rounded corners
```

Click "Generate" and watch the magic happen!

### 2. Try Construction Kit Mode

Toggle "Construction Kit Mode" and try:
```
a simple chair
```

This will break down the chair into individual parts with colors.

### 3. Adjust Printer Settings

Set your printer dimensions (for Anycubic Kobra 3 Combo):
- Width: 250mm
- Height: 250mm

### 4. Download Your Design

After generation, you can download:
- **STL**: For 3D printing
- **SCAD**: OpenSCAD source code
- **SVG**: For laser cutting (if applicable)
- **PNG**: Preview image

## Example Prompts

### Simple Objects
- `a 30mm gear with 12 teeth`
- `a phone stand with 45 degree angle`
- `a cable organizer with 5 slots`

### Complex Objects (Construction Kit)
- `a toy car with wheels`
- `a desk organizer with compartments`
- `a modular storage box system`

### Laser Cutting
- `a flat puzzle piece`
- `a decorative wall panel`
- `a box template with finger joints`

## Troubleshooting

### Backend won't start

**Error: "GEMINI_API_KEY is required"**

Solution: Make sure you've created `server/.env` and added your API key.

### Frontend can't connect to backend

**Error: "Failed to fetch"**

Solution: Make sure the backend is running on port 3001:
```bash
cd server
npm run dev
```

### Rate limit errors

**Error: "Too many requests"**

Solution: Default is 10 requests per hour. To increase:

Edit `server/.env`:
```env
RATE_LIMIT_MAX_REQUESTS=50
```

### Database errors

**Error: "Database locked"**

Solution: Delete and recreate the database:
```bash
rm server/data/makersai.db
# Restart the backend
```

## Docker Quick Start

If you prefer Docker:

```bash
# 1. Create .env file
cp .env.example .env
# Edit .env and add GEMINI_API_KEY

# 2. Start with Docker Compose
docker-compose up

# 3. Open http://localhost:3000
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
- Explore the API endpoints in the README
- Customize printer profiles for your specific machine

## Getting Help

- **Issues**: https://github.com/MfFischer/makersai-studio/issues
- **Discussions**: https://github.com/MfFischer/makersai-studio/discussions

## Tips for Best Results

1. **Be specific**: Instead of "a box", try "a 50mm cube with 2mm wall thickness"
2. **Include dimensions**: Always specify sizes in millimeters
3. **Use construction kit mode**: For complex objects with multiple parts
4. **Check printer limits**: Make sure your design fits your printer's build volume
5. **Iterate**: Generate, review, refine your prompt, and regenerate

## Common Use Cases

### 3D Printing
- Replacement parts
- Custom organizers
- Toys and games
- Prototypes
- Decorative items

### Laser Cutting
- Flat patterns
- Box templates
- Decorative panels
- Puzzle pieces
- Stencils

## Performance Tips

- **First generation is slower**: Subsequent identical prompts are cached
- **Construction kit mode**: Takes longer but produces better results for complex objects
- **Image generation**: Can take 10-30 seconds depending on complexity

## Keyboard Shortcuts

- `Ctrl/Cmd + Enter`: Generate (when prompt is focused)
- `Esc`: Close image modal

## Support the Project

If you find this useful:
- ⭐ Star the repository
- 🐛 Report bugs
- 💡 Suggest features
- 🤝 Contribute code

Happy making! 🚀

