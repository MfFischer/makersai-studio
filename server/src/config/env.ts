import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  FRONTEND_URL: z.string().url(),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  RATE_LIMIT_WINDOW_MS: z.string().default('3600000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('10'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  ENABLE_CACHING: z.string().default('true'),
  ENABLE_RATE_LIMITING: z.string().default('true'),
  CACHE_TTL_SECONDS: z.string().default('86400'),

  DATABASE_PATH: z.string().default('./data/makersai.db'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const env = parseEnv();

export const config = {
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  port: parseInt(env.PORT, 10),
  frontendUrl: env.FRONTEND_URL,

  gemini: {
    apiKey: env.GEMINI_API_KEY,
  },

  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  cors: {
    origin: env.CORS_ORIGIN,
  },

  features: {
    caching: env.ENABLE_CACHING === 'true',
    rateLimiting: env.ENABLE_RATE_LIMITING === 'true',
  },

  cache: {
    ttl: parseInt(env.CACHE_TTL_SECONDS, 10),
  },

  database: {
    path: env.DATABASE_PATH,
  },
};

