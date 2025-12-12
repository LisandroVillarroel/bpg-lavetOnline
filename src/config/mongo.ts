import mongoose from 'mongoose';

import { env } from './env';
import { logger } from './logger';

export async function connectMongo(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGO_DB,
      user: env.MONGO_USER,
      pass: env.MONGO_PASS,
      authSource: env.MONGO_AUTH_SOURCE,
      autoIndex: true,
      maxPoolSize: 10,
    });
    logger.info('Conexión a MongoDB exitosa...');
  } catch (error) {
    logger.error({ err: error }, 'Error al conectar a MongoDB');
    process.exit(1);
  }
}
