import { createApp } from './app.ts';
import { config } from './config.ts';
import { runMigrations } from './db/migrate.ts';
import { logger } from './utils/logger.ts';

await runMigrations();
createApp().listen(config.port, () => {
  logger.info(`API listening on http://localhost:${config.port}`);
});
