import type { Request, Response, NextFunction } from 'express';

// Placeholder: rate limiting is deferred for the MVP but keeps its slot in the middleware order.
export function rateLimit(_req: Request, _res: Response, next: NextFunction) {
  next();
}
