import { Router, Request } from 'express';
import { generateScadImageAndSvg, generateConstructionPlan, generateModelFromImage } from '../services/geminiService.js';
import { validateRequest, generateModelSchema, constructionPlanSchema } from '../middleware/validation.js';
import { createStrictRateLimiter } from '../middleware/rateLimiter.js';
import { getDatabase } from '../config/database.js';
import multer from 'multer';
import { z } from 'zod';

const router = Router();

// Configure multer for image uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Apply rate limiting to all routes
router.use(createStrictRateLimiter());

// Generate model endpoint
router.post(
  '/model',
  validateRequest(generateModelSchema),
  async (req: Request, res) => {
    try {
      const { prompt, dimensions, colors } = req.body;

      console.log(`🎨 Generating model from IP: ${req.ip}`);

      const result = await generateScadImageAndSvg(prompt, dimensions, colors);

      // Track usage
      const db = getDatabase();
      db.prepare('INSERT INTO usage_tracking (action, metadata) VALUES (?, ?)').run(
        'generate_model',
        JSON.stringify({ prompt, has_dimensions: !!dimensions, color_count: colors?.length || 0 })
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Generate model error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate model',
      });
    }
  }
);

// Generate construction plan endpoint
router.post(
  '/construction-plan',
  validateRequest(constructionPlanSchema),
  async (req: Request, res) => {
    try {
      const { prompt, availableColors } = req.body;

      console.log(`🏗️  Generating construction plan from IP: ${req.ip}`);

      const result = await generateConstructionPlan(prompt, availableColors || []);

      // Track usage
      const db = getDatabase();
      db.prepare('INSERT INTO usage_tracking (action, metadata) VALUES (?, ?)').run(
        'generate_construction_plan',
        JSON.stringify({ prompt, part_count: result.length })
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Generate construction plan error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate construction plan',
      });
    }
  }
);

// Image-to-3D conversion endpoint
router.post(
  '/image-to-model',
  upload.single('image'),
  async (req: Request, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided',
        });
      }

      const { additionalPrompt, dimensions, colors } = req.body;

      console.log(`🖼️  Converting image to 3D model from IP: ${req.ip}`);
      console.log(`📁 File: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`);

      // Convert buffer to base64
      const imageBase64 = req.file.buffer.toString('base64');

      // Parse dimensions if provided
      let parsedDimensions;
      if (dimensions) {
        try {
          parsedDimensions = typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions;
        } catch (e) {
          console.warn('Failed to parse dimensions:', e);
        }
      }

      // Parse colors if provided
      let parsedColors;
      if (colors) {
        try {
          parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
        } catch (e) {
          console.warn('Failed to parse colors:', e);
        }
      }

      const result = await generateModelFromImage({
        imageBase64,
        mimeType: req.file.mimetype,
        additionalPrompt,
        dimensions: parsedDimensions,
        colors: parsedColors,
      });

      // Track usage
      const db = getDatabase();
      db.prepare('INSERT INTO usage_tracking (action, metadata) VALUES (?, ?)').run(
        'generate_from_image',
        JSON.stringify({
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          has_additional_prompt: !!additionalPrompt,
        })
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Image-to-model error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate model from image',
      });
    }
  }
);

export default router;

