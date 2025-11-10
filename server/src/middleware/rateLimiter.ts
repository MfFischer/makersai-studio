import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';

export const createRateLimiter = () => {
  if (!config.features.rateLimiting) {
    return (req: any, res: any, next: any) => next();
  }

  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: config.rateLimit.windowMs / 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
  });
};

// Stricter rate limit for expensive operations (image generation)
export const createStrictRateLimiter = () => {
  if (!config.features.rateLimiting) {
    return (req: any, res: any, next: any) => next();
  }

  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: Math.floor(config.rateLimit.maxRequests / 2),
    message: {
      error: 'Generation limit reached. Please try again later.',
      retryAfter: config.rateLimit.windowMs / 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'unknown',
  });
};

