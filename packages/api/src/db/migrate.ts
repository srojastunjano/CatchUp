import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import migrate from 'migrate';
import { pool } from './pool.ts';
import { logger } from '../utils/logger.ts';

// Migration files: `<timestamp>-<name>.ts` exporting `async up()` / `async down()` that use `pool`.
const migrationsDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

type StoredState = { lastRun?: string; migrations: { title: string; timestamp: number | null }[] };

const postgresStateStore = {
  async load(fn: (err: Error | null, state?: StoredState) => void) {
    try {
      await pool.query('CREATE TABLE IF NOT EXISTS migrations_state (id int PRIMARY KEY, data jsonb NOT NULL)');
      const { rows } = await pool.query<{ data: StoredState }>('SELECT data FROM migrations_state WHERE id = 1');
      // node-migrate treats an empty object as "no state yet".
      fn(null, rows[0]?.data ?? ({} as StoredState));
    } catch (err) {
      fn(err as Error);
    }
  },
  async save(set: { lastRun: string | null; migrations: unknown[] }, fn: (err: Error | null) => void) {
    try {
      const data = { lastRun: set.lastRun, migrations: set.migrations };
      await pool.query(
        'INSERT INTO migrations_state (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data',
        [JSON.stringify(data)],
      );
      fn(null);
    } catch (err) {
      fn(err as Error);
    }
  },
};

export function runMigrations(): Promise<void> {
  // tsc emits no migrations folder until the first migration exists.
  if (!existsSync(migrationsDirectory)) {
    logger.info('No migrations directory; skipping migrations');
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    migrate.load(
      {
        stateStore: postgresStateStore as never,
        migrationsDirectory,
        filterFunction: (file) => /\.(ts|js)$/.test(file) && !file.endsWith('.d.ts'),
      },
      (loadErr, set) => {
        if (loadErr) return reject(loadErr);
        set.on('migration', (migration, direction) => logger.info({ migration: migration.title, direction }, 'migration'));
        set.up((upErr) => {
          if (upErr) return reject(upErr);
          logger.info({ count: set.migrations.length }, 'Migrations up to date');
          resolve();
        });
      },
    );
  });
}
