// API contract — keep in sync with apps/api/internal/server/router.go.

export type DbStatus = 'ok' | 'error' | 'disabled';

export interface HealthResponse {
  status: 'ok';
  db: DbStatus;
}

export interface HelloResponse {
  message: string;
}
