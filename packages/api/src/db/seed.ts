import { runMigrations } from './migrate.ts';
import { pool } from './pool.ts';
import { logger } from '../utils/logger.ts';

// Seed data (5 users, 1 group, sample posts) is added by B1/B2/B4 as their tables land.
await runMigrations();
logger.info('Seed: nothing to seed yet');
await pool.end();
