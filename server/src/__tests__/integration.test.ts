import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import generateRoutes from '../routes/generate';
import printerRoutes from '../routes/printers';
import { createRateLimiter } from '../middleware/rateLimiter';
import fs from 'fs';
import path from 'path';

// Create test app with same configuration as main app
const createTestApp = (corsOrigin: string = 'http://localhost:3003') => {
  const app = express();

  app.use(helmet());
  app.use(compression());
  app.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Disable rate limiting for tests
  // app.use(createRateLimiter());

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: 'test',
    });
  });

  app.use('/api/generate', generateRoutes);
  app.use('/api/printers', printerRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });

  return app;
};

describe('Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.environment).toBe('test');
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from configured origin', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3003');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3003'
      );
    });

    it('should handle preflight requests', async () => {
      const response = await request(app)
        .options('/api/generate/model')
        .set('Origin', 'http://localhost:3003')
        .set('Access-Control-Request-Method', 'POST');

      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe(
        'http://localhost:3003'
      );
    });
  });

  describe('Image Upload Endpoint', () => {
    it('should have image-to-model endpoint', async () => {
      // Create a simple test image buffer (1x1 PNG)
      const testImageBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const response = await request(app)
        .post('/api/generate/image-to-model')
        .set('Origin', 'http://localhost:3003')
        .attach('image', testImageBuffer, 'test.png')
        .field('additionalPrompt', 'test prompt');

      // Should fail due to missing API key, but endpoint should exist
      expect(response.status).not.toBe(404);
    });

    it('should reject non-image files', async () => {
      const textBuffer = Buffer.from('This is not an image');

      const response = await request(app)
        .post('/api/generate/image-to-model')
        .set('Origin', 'http://localhost:3003')
        .attach('image', textBuffer, 'test.txt');

      expect(response.status).toBe(500); // Multer will reject
    });

    it('should require image file', async () => {
      const response = await request(app)
        .post('/api/generate/image-to-model')
        .set('Origin', 'http://localhost:3003')
        .field('additionalPrompt', 'test prompt');

      expect(response.status).toBe(400);
    });
  });

  describe('Generate Model Endpoint', () => {
    it('should accept text-to-3D requests', async () => {
      const response = await request(app)
        .post('/api/generate/model')
        .set('Origin', 'http://localhost:3003')
        .send({
          prompt: 'a simple cube',
          dimensions: { width: 20, height: 20 },
        });

      // Should fail due to missing API key, but endpoint should exist
      expect(response.status).not.toBe(404);
    });

    it('should validate input', async () => {
      const response = await request(app)
        .post('/api/generate/model')
        .set('Origin', 'http://localhost:3003')
        .send({
          // Missing prompt
          dimensions: { width: 20, height: 20 },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Construction Plan Endpoint', () => {
    it('should accept construction plan requests', async () => {
      const response = await request(app)
        .post('/api/generate/construction-plan')
        .set('Origin', 'http://localhost:3003')
        .send({
          prompt: 'a simple chair',
          availableColors: ['red', 'blue'],
        });

      // Should fail due to missing API key, but endpoint should exist
      expect(response.status).not.toBe(404);
    });
  });

  describe('Printer Endpoints', () => {
    it('should list printer profiles', async () => {
      const response = await request(app)
        .get('/api/printers/profiles')
        .set('Origin', 'http://localhost:3003');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should validate dimensions', async () => {
      const response = await request(app)
        .post('/api/printers/validate/dimensions')
        .set('Origin', 'http://localhost:3003')
        .send({
          width: 200,
          height: 200,
          depth: 200,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate laser dimensions', async () => {
      const response = await request(app)
        .post('/api/printers/validate/laser')
        .set('Origin', 'http://localhost:3003')
        .send({
          width: 350,
          height: 350,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown')
        .set('Origin', 'http://localhost:3003');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/generate/model')
        .set('Origin', 'http://localhost:3003')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3003');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });
});

