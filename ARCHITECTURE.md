# MakersAI Studio - Architecture Documentation

## Overview

MakersAI Studio is a full-stack TypeScript application that transforms natural language prompts into 3D printable models and laser-cuttable designs using Google's Gemini AI.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + Vite                        │  │
│  │  - App.tsx (Main UI)                                 │  │
│  │  - ScadPreview.tsx (JSCAD 3D Viewer)                 │  │
│  │  - ImageModal.tsx (Image Preview)                    │  │
│  │  - services/apiClient.ts (API Communication)         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express + TypeScript                                │  │
│  │                                                       │  │
│  │  Routes:                                             │  │
│  │  - POST /api/generate/model                          │  │
│  │  - POST /api/generate/construction-plan              │  │
│  │  - GET  /health                                      │  │
│  │                                                       │  │
│  │  Middleware:                                         │  │
│  │  - Rate Limiting (express-rate-limit)               │  │
│  │  - Input Validation (Zod)                           │  │
│  │  - CORS, Helmet, Compression                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Gemini AI Service      │  │   Local Storage          │
│                          │  │                          │
│  - Gemini 2.5 Pro        │  │  - SQLite Database       │
│    (Code Generation)     │  │    (better-sqlite3)      │
│  - Imagen 4.0            │  │  - Usage Tracking        │
│    (Image Generation)    │  │  - Design History        │
│                          │  │                          │
│  - In-Memory Cache       │  │  - Node-Cache            │
│    (node-cache)          │  │    (Response Caching)    │
└──────────────────────────┘  └──────────────────────────┘
```

## Technology Stack

### Frontend
- **React 19**: Modern UI library with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **JSCAD Web**: 3D visualization library for OpenSCAD

### Backend
- **Node.js 20+**: JavaScript runtime
- **Express**: Web framework
- **TypeScript**: Type-safe server code
- **Better-SQLite3**: Synchronous SQLite database
- **Node-Cache**: In-memory caching
- **Zod**: Schema validation
- **Helmet**: Security headers
- **Express-Rate-Limit**: API rate limiting

### AI Services
- **Google Gemini 2.5 Pro**: Code generation (OpenSCAD, SVG)
- **Google Imagen 4.0**: Image generation for visualization

## Data Flow

### 1. Model Generation Flow

```
User Input (Prompt)
    │
    ▼
Frontend Validation
    │
    ▼
API Request → POST /api/generate/model
    │
    ▼
Backend Middleware
    ├─ Rate Limiting Check
    ├─ Input Validation (Zod)
    └─ CORS Check
    │
    ▼
Cache Check (node-cache)
    ├─ Cache Hit → Return Cached Result
    └─ Cache Miss ▼
         │
         ▼
    Gemini Service
         ├─ Generate OpenSCAD Code
         ├─ Generate SVG (if applicable)
         └─ Generate Image Prompt
         │
         ▼
    Imagen Service
         └─ Generate Visualization Image
         │
         ▼
    Cache Result
         │
         ▼
    Track Usage (SQLite)
         │
         ▼
    Return Response
         │
         ▼
Frontend Display
    ├─ 3D Preview (JSCAD)
    ├─ Image Preview
    └─ Download Options
```

### 2. Construction Kit Flow

```
User Input (Complex Object Prompt)
    │
    ▼
POST /api/generate/construction-plan
    │
    ▼
Gemini 2.5 Pro
    └─ Decompose into Parts
         │
         ▼
    For Each Part:
         ├─ Generate OpenSCAD
         ├─ Generate SVG
         ├─ Generate Image
         └─ Assign Color
         │
         ▼
    Return Part List
         │
         ▼
Frontend Display
    └─ Color-coded Part Cards
```

## Database Schema

### SQLite Tables

```sql
-- Design History
CREATE TABLE designs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  scad_code TEXT NOT NULL,
  image_url TEXT NOT NULL,
  svg_code TEXT,
  tags TEXT,
  is_favorite INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usage Tracking
CREATE TABLE usage_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

### 1. API Key Protection
- Gemini API key stored server-side only
- Never exposed to frontend
- Environment variable configuration

### 2. Rate Limiting
- IP-based rate limiting
- Configurable limits (default: 10 requests/hour)
- Separate limits for expensive operations

### 3. Input Validation
- Zod schema validation
- Prompt length limits (3-1000 characters)
- Dimension validation
- Color array limits

### 4. Security Headers
- Helmet.js for security headers
- CORS configuration
- Content Security Policy

## Caching Strategy

### In-Memory Cache (node-cache)
- **Cache Key**: SHA-256 hash of input parameters
- **TTL**: 24 hours (configurable)
- **Cached Data**:
  - Construction plans
  - OpenSCAD/SVG outputs
  - Generated images

### Benefits
- Reduced API costs
- Faster response times
- Improved user experience

## Deployment Options

### 1. Docker (Recommended)
```bash
docker-compose up
```
- Isolated environment
- Easy scaling
- Consistent deployment

### 2. Manual Deployment
```bash
# Backend
cd server && npm run build && npm start

# Frontend
npm run build && serve dist
```

### 3. Cloud Platforms
- **Vercel**: Frontend deployment
- **Railway/Render**: Backend deployment
- **Fly.io**: Full-stack deployment

## Performance Optimizations

### Frontend
- Code splitting with Vite
- Lazy loading of 3D viewer
- Image optimization
- Tailwind CSS purging

### Backend
- Response compression (gzip)
- In-memory caching
- Connection pooling (SQLite WAL mode)
- Efficient database queries

## Monitoring & Logging

### Usage Tracking
- All API calls logged to SQLite
- Metadata includes:
  - Action type
  - Prompt details
  - Timestamp

### Health Checks
- `/health` endpoint
- Returns server status
- Environment information

## Future Enhancements

### Phase 3: Advanced Features
- [ ] User authentication (optional)
- [ ] Design sharing/community
- [ ] Advanced printer profiles
- [ ] G-code generation
- [ ] Material cost estimation
- [ ] Print time calculation

### Phase 4: AI Improvements
- [ ] Fine-tuned models for specific printers
- [ ] Multi-language support
- [ ] Voice input
- [ ] Image-to-3D conversion

### Phase 5: Enterprise Features
- [ ] Team collaboration
- [ ] Design versioning
- [ ] API access for integrations
- [ ] Custom branding

## Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Functional components (React)

### Testing Strategy
- Unit tests (Jest)
- Integration tests (Supertest)
- E2E tests (Playwright)
- API contract tests

### Git Workflow
- Feature branches
- Pull request reviews
- Semantic versioning
- Conventional commits

## Troubleshooting

### Common Issues

1. **Database locked**
   - Solution: Check WAL mode enabled
   - Restart server

2. **Cache not working**
   - Solution: Check ENABLE_CACHING=true
   - Verify node-cache initialization

3. **Rate limit errors**
   - Solution: Adjust RATE_LIMIT_MAX_REQUESTS
   - Or disable with ENABLE_RATE_LIMITING=false

4. **Gemini API errors**
   - Solution: Verify API key
   - Check quota limits
   - Review error logs

## Contributing

See CONTRIBUTING.md for development setup and guidelines.

## License

MIT License - see LICENSE file for details.

