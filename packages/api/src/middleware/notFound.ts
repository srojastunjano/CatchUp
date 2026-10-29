import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.ts';

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}
