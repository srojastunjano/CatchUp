import { Router } from 'express';
import type { HealthResponse } from '@catchup/shared';

export const routes = Router();

routes.get('/health', (_req, res) => {
  const body: HealthResponse = { status: 'ok', uptimeSeconds: Math.round(process.uptime()) };
  res.json(body);
});
