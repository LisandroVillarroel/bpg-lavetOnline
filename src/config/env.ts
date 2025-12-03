import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(0).default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z.string().default('info'),
  MONGO_DB: z.string().min(1, 'MONGO_DB is required'),
  MONGO_USER: z.string().min(1, 'MONGO_USER is required'),
  MONGO_PASS: z.string().min(1, 'MONGO_PASS is required'),
  MONGO_AUTH_SOURCE: z.string().min(1, 'MONGO_AUTH_SOURCE is required'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
