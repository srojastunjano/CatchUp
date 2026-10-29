function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var ${name} (see .env.example)`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: required('DATABASE_URL'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  isProduction: process.env.NODE_ENV === 'production',
};
