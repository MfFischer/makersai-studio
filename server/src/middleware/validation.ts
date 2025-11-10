import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Validation schemas
export const generateModelSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Prompt must be at least 3 characters')
    .max(1000, 'Prompt must not exceed 1000 characters')
    .trim(),
  dimensions: z
    .object({
      width: z.number().positive().max(1000).optional(),
      height: z.number().positive().max(1000).optional(),
    })
    .optional(),
  colors: z.array(z.string()).max(10).optional(),
});

export const constructionPlanSchema = z.object({
  prompt: z
    .string()
    .min(3, 'Prompt must be at least 3 characters')
    .max(1000, 'Prompt must not exceed 1000 characters')
    .trim(),
  availableColors: z.array(z.string()).max(10).optional(),
});

export const saveDesignSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  prompt: z.string().min(1).max(1000).trim(),
  scadCode: z.string().min(1),
  imageUrl: z.string().url(),
  svgCode: z.string().nullable(),
  tags: z.array(z.string()).max(10).optional(),
});

