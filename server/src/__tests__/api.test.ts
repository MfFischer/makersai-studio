import request from 'supertest';
import express from 'express';
import printerRoutes from '../routes/printers';

const app = express();
app.use(express.json());
app.use('/api/printers', printerRoutes);

describe('Printer API Endpoints', () => {
  describe('GET /api/printers/profiles', () => {
    it('should return all printer profiles', async () => {
      const response = await request(app).get('/api/printers/profiles');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should include Kobra 3 Combo profile', async () => {
      const response = await request(app).get('/api/printers/profiles');

      const kobra3 = response.body.data.find(
        (p: any) => p.id === 'anycubic-kobra-3-combo'
      );
      expect(kobra3).toBeDefined();
      expect(kobra3.name).toBe('Anycubic Kobra 3 Combo');
    });
  });

  describe('GET /api/printers/profiles/:profileId', () => {
    it('should return specific printer profile', async () => {
      const response = await request(app).get(
        '/api/printers/profiles/anycubic-kobra-3-combo'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('anycubic-kobra-3-combo');
    });

    it('should return 404 for invalid profile', async () => {
      const response = await request(app).get('/api/printers/profiles/invalid');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/printers/validate/dimensions', () => {
    it('should validate valid dimensions', async () => {
      const response = await request(app)
        .post('/api/printers/validate/dimensions')
        .send({
          width: 200,
          height: 200,
          depth: 200,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should reject oversized dimensions', async () => {
      const response = await request(app)
        .post('/api/printers/validate/dimensions')
        .send({
          width: 300,
          height: 200,
          depth: 200,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/printers/validate/dimensions')
        .send({
          width: 'invalid',
          height: 200,
          depth: 200,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should provide optimization suggestions', async () => {
      const response = await request(app)
        .post('/api/printers/validate/dimensions')
        .send({
          width: 240,
          height: 240,
          depth: 240,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.suggestions).toBeDefined();
      expect(Array.isArray(response.body.data.suggestions)).toBe(true);
    });
  });

  describe('POST /api/printers/validate/laser', () => {
    it('should validate laser dimensions', async () => {
      const response = await request(app)
        .post('/api/printers/validate/laser')
        .send({
          width: 350,
          height: 350,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should reject oversized laser dimensions', async () => {
      const response = await request(app)
        .post('/api/printers/validate/laser')
        .send({
          width: 450,
          height: 350,
          profileId: 'anycubic-kobra-3-combo',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.valid).toBe(false);
    });

    it('should reject for printer without laser', async () => {
      const response = await request(app)
        .post('/api/printers/validate/laser')
        .send({
          width: 200,
          height: 200,
          profileId: 'generic-fdm',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.errors).toContain(
        'Printer does not support laser engraving'
      );
    });
  });
});

