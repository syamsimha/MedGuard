import type { HealthStatusResponse } from '../types/health';

/**
 * Fetches the backend operational health status.
 * Automatically leverages the Vite proxy (/api) or direct fallback.
 */
export async function checkApiHealth(): Promise<HealthStatusResponse> {
  const response = await fetch('/api/health', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API health check failed with status: ${response.status}`);
  }

  return response.json();
}
