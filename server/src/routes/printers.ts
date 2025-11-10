import { Router, Request, Response } from 'express';
import {
  PRINTER_PROFILES,
  getPrinterProfile,
  validateDimensions,
  validateLaserDimensions,
  getOptimizationSuggestions,
} from '../config/printerProfiles.js';
import { z } from 'zod';

const router = Router();

// Get all printer profiles
router.get('/profiles', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(PRINTER_PROFILES),
  });
});

// Get specific printer profile
router.get('/profiles/:profileId', (req: Request, res: Response) => {
  const { profileId } = req.params;
  const profile = getPrinterProfile(profileId);

  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Printer profile not found',
    });
  }

  res.json({
    success: true,
    data: profile,
  });
});

// Validate dimensions for a printer
const validateDimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  profileId: z.string(),
});

router.post('/validate/dimensions', (req: Request, res: Response) => {
  try {
    const { width, height, depth, profileId } = validateDimensionsSchema.parse(req.body);

    const validation = validateDimensions(width, height, depth, profileId);
    const suggestions = validation.valid
      ? getOptimizationSuggestions({ width, height, depth }, profileId)
      : [];

    res.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        suggestions,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Validate laser dimensions
const validateLaserSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  profileId: z.string(),
});

router.post('/validate/laser', (req: Request, res: Response) => {
  try {
    const { width, height, profileId } = validateLaserSchema.parse(req.body);

    const validation = validateLaserDimensions(width, height, profileId);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

