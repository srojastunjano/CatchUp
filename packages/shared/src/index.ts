export const API_PREFIX = '/api/v1';

export interface HealthResponse {
  status: 'ok';
  uptimeSeconds: number;
}
