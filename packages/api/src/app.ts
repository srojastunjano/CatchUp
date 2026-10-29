import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { API_PREFIX } from '@catchup/shared';
import { config } from './config.ts';
import { logger } from './utils/logger.ts';
import { rateLimit } from './middleware/rateLimit.ts';
import { notFound } from './middleware/notFound.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { routes } from './routes.ts';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(rateLimit);
  app.use(API_PREFIX, routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
