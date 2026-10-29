import { useEffect, useState } from 'react';
import { API_PREFIX, type HealthResponse } from '@catchup/shared';

export function HomePage() {
  const [apiStatus, setApiStatus] = useState('checking…');

  useEffect(() => {
    fetch(`${API_PREFIX}/health`)
      .then((res) => (res.ok ? (res.json() as Promise<HealthResponse>) : Promise.reject(res.status)))
      .then((body) => setApiStatus(body.status))
      .catch(() => setApiStatus('unreachable'));
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6">
      <h1 className="text-2xl font-semibold">CatchUp</h1>
      <p className="text-sm text-gray-600">API: {apiStatus}</p>
    </main>
  );
}
