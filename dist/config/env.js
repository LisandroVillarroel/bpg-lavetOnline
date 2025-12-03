"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().int().min(0).default(4000),
    MONGODB_URI: zod_1.z.string().min(1, 'MONGODB_URI is required'),
    JWT_SECRET: zod_1.z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
    JWT_EXPIRES_IN: zod_1.z.string().default('1h'),
    REFRESH_TOKEN_EXPIRES_IN: zod_1.z.string().default('7d'),
    LOG_LEVEL: zod_1.z.string().default('info'),
    MONGO_DB: zod_1.z.string().min(1, 'MONGO_DB is required'),
    MONGO_USER: zod_1.z.string().min(1, 'MONGO_USER is required'),
    MONGO_PASS: zod_1.z.string().min(1, 'MONGO_PASS is required'),
    MONGO_AUTH_SOURCE: zod_1.z.string().min(1, 'MONGO_AUTH_SOURCE is required'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment configuration', parsed.error.format());
    process.exit(1);
}
exports.env = parsed.data;
