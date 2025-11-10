# MakersAI Studio

AI-powered 3D model and laser cutting generator. Transform text prompts into print-ready STL files and laser-cuttable SVG designs. Built for makers with Anycubic printers and laser engravers.

## Features

- **Text-to-3D**: Convert natural language descriptions into OpenSCAD code
- **Live 3D Preview**: Real-time visualization using JSCAD viewer
- **Multi-format Export**: Download as .scad, .stl, .png, and .svg files
- **Construction Kit Mode**: Break complex objects into individual parts with color coding
- **Laser Cutting Support**: Generate 2D SVG profiles for laser cutting
- **Smart Caching**: Reduce API costs with intelligent caching
- **Rate Limiting**: Built-in protection against API abuse
- **Local Database**: SQLite storage for design history

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Tailwind CSS
- JSCAD Web Viewer

### Backend
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- Google Gemini AI (2.5 Pro + Imagen 4.0)
- In-memory caching (node-cache)

## Prerequisites

- Node.js 20+
- npm or yarn
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## Quick Start

### Option 1: Docker (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/MfFischer/makersai-studio.git
cd makersai-studio
```

2. Create environment file:
```bash
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

3. Run with Docker Compose:
```bash
docker-compose up
```

4. Open http://localhost:3000

### Option 2: Manual Setup

1. Clone and install dependencies:
```bash
git clone https://github.com/MfFischer/makersai-studio.git
cd makersai-studio

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

2. Configure environment variables:
```bash
# Backend configuration
cp server/.env.example server/.env
# Edit server/.env and add your GEMINI_API_KEY

# Frontend configuration (optional)
cp .env.example .env
```

3. Start the backend:
```bash
cd server
npm run dev
```

4. In a new terminal, start the frontend:
```bash
npm run dev
```

5. Open http://localhost:3000

## Project Structure

```
makersai-studio/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Configuration (env, database, cache)
│   │   ├── middleware/    # Express middleware (rate limiting, validation)
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic (Gemini AI integration)
│   │   └── index.ts       # Server entry point
│   ├── data/              # SQLite database (auto-created)
│   ├── package.json
│   └── tsconfig.json
├── src/                   # Frontend (React)
│   ├── App.tsx           # Main application component
│   ├── ScadPreview.tsx   # 3D preview component
│   ├── ImageModal.tsx    # Image modal component
│   └── services/         # API client services
├── docker-compose.yml    # Docker orchestration
├── Dockerfile.frontend   # Frontend Docker image
├── nginx.conf           # Nginx configuration
└── README.md

```

## 🧪 Testing

### Run Unit and Integration Tests

```bash
cd server
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

**Test Coverage:**
- ✅ 27 tests passing
- ✅ 16 unit tests for printer profiles
- ✅ 11 integration tests for API endpoints

## 📦 Building for Production

### Build Web Application

```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build
cd ..

# Start production server
cd server
npm start
```

### Build Windows Executable

Create a standalone Windows application with Electron:

```bash
# Build both frontend and backend
npm run build
cd server && npm run build && cd ..

# Package as Windows executable
npm run package:win
```

This will create in the `release/` directory:
- **Installer**: `MakersAI Studio Setup X.X.X.exe` (NSIS installer)
- **Portable**: `MakersAI Studio X.X.X.exe` (Portable executable)

**Windows Executable Features:**
- ✅ Embedded Node.js backend
- ✅ React frontend
- ✅ SQLite database
- ✅ No external dependencies required
- ✅ Auto-starts backend on launch
- ✅ Native window controls
- ✅ Works offline (after initial setup)

## API Endpoints

### Generate Model
```http
POST /api/generate/model
Content-Type: application/json

{
  "prompt": "a 20mm cube with rounded corners",
  "dimensions": { "width": 250, "height": 250 },
  "colors": ["red", "blue"]
}
```

### Generate Construction Plan
```http
POST /api/generate/construction-plan
Content-Type: application/json

{
  "prompt": "a simple chair",
  "availableColors": ["red", "blue", "green"]
}
```

### Health Check
```http
GET /health
```

## Configuration

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API key | **Required** |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `3600000` (1 hour) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `10` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `ENABLE_CACHING` | Enable response caching | `true` |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | `true` |
| `CACHE_TTL_SECONDS` | Cache TTL in seconds | `86400` (24 hours) |
| `DATABASE_PATH` | SQLite database path | `./data/makersai.db` |

## Development

### Backend Development
```bash
cd server
npm run dev    # Start with hot reload
npm run build  # Build for production
npm start      # Run production build
```

### Frontend Development
```bash
npm run dev    # Start Vite dev server
npm run build  # Build for production
npm run preview # Preview production build
```

## Production Deployment

### Using Docker

1. Build and run:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop:
```bash
docker-compose down
```

### Manual Deployment

1. Build backend:
```bash
cd server
npm run build
```

2. Build frontend:
```bash
npm run build
```

3. Serve with a process manager (PM2):
```bash
npm install -g pm2
cd server
pm2 start dist/index.js --name makersai-backend
```

## Printer Compatibility

Optimized for:
- **Anycubic Kobra 3 Combo**
  - Print volume: 250×250×260mm
  - Laser area: 400×400mm
- Other FDM printers with similar specifications

## Troubleshooting

### Database Issues
```bash
# Reset database
rm server/data/makersai.db
# Restart server to recreate
```

### Cache Issues
```bash
# Disable caching temporarily
# In server/.env:
ENABLE_CACHING=false
```

### Rate Limiting
```bash
# Increase limits in server/.env:
RATE_LIMIT_MAX_REQUESTS=50
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Google Gemini AI for code generation
- JSCAD for 3D visualization
- OpenSCAD community

## Support

For issues and questions:
- GitHub Issues: https://github.com/MfFischer/makersai-studio/issues
- Discussions: https://github.com/MfFischer/makersai-studio/discussions
