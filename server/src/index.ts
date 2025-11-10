import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env.js';
import { connectCache, disconnectCache } from './config/redis.js';
import { initDatabase, closeDatabase } from './config/database.js';
import { createRateLimiter } from './middleware/rateLimiter.js';

// Import routes
import generateRoutes from './routes/generate.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiter (less strict than route-specific ones)
app.use(createRateLimiter());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.isDevelopment ? 'development' : 'production',
  });
});

// API routes
app.use('/api/generate', generateRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: config.isDevelopment ? err.message : 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database
    initDatabase();

    // Initialize cache
    await connectCache();

    // Start Express server
    app.listen(config.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 MakersAI Studio Server                              ║
║                                                           ║
║   Environment: ${config.isDevelopment ? 'Development' : 'Production'}                              ║
║   Port: ${config.port}                                           ║
║   Frontend: ${config.frontendUrl}                        ║
║   Database: ${config.database.path}                      ║
║                                                           ║
║   Features:                                               ║
║   - Rate Limiting: ${config.features.rateLimiting ? '✅' : '❌'}                              ║
║   - Caching: ${config.features.caching ? '✅' : '❌'}                                    ║
║                                                           ║
║   API Endpoints:                                          ║
║   - POST /api/generate/model                              ║
║   - POST /api/generate/construction-plan                  ║
║   - GET  /health                                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  closeDatabase();
  await disconnectCache();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();

