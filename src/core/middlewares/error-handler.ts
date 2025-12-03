import type { NextFunction, Request, Response } from 'express';

import { logger } from '../../config/logger';
import { AppError } from '../errors/app-error';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    logger.warn({ err }, 'Handled application error');
    res.status(err.statusCode).json({ message: err.message, details: err.details ?? null });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
}
