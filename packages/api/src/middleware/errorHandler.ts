import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.ts';
import { logger } from '../utils/logger.ts';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } });
}
