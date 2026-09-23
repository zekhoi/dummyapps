import type { HealthResponse, HelloResponse } from '@dummyapps/shared';

async function getJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  // /api/health returns 503 with a JSON body when the database is down.
  if (!res.ok && res.status !== 503) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: (signal?: AbortSignal) => getJSON<HealthResponse>('/api/health', signal),
  hello: (name: string, signal?: AbortSignal) =>
    getJSON<HelloResponse>(`/api/hello?name=${encodeURIComponent(name)}`, signal),
};
