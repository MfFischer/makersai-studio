import { Router, Request } from 'express';
import { generateScadImageAndSvg, generateConstructionPlan } from '../services/geminiService.js';
import { validateRequest, generateModelSchema, constructionPlanSchema } from '../middleware/validation.js';
import { createStrictRateLimiter } from '../middleware/rateLimiter.js';
import { getDatabase } from '../config/database.js';

const router = Router();

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

export default router;

