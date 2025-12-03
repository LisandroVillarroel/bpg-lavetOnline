import type { NextFunction, Request, Response } from 'express';

import { logger } from '../../config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const { method, originalUrl } = req;
  const started = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - started;
    logger.info({ method, url: originalUrl, statusCode: res.statusCode, duration }, 'HTTP request');
  });

  next();
}
