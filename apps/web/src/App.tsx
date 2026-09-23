import type { HealthResponse } from '@dummyapps/shared';
import { type FormEvent, useEffect, useState } from 'react';
import { api } from './api.ts';

type Health = { state: 'loading' } | { state: 'down' } | { state: 'up'; data: HealthResponse };

const badge = {
  ok: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  warn: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  bad: 'bg-rose-100 text-rose-800 ring-rose-600/20',
  idle: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

function StatusBadge({ label, tone }: { label: string; tone: keyof typeof badge }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge[tone]}`}>
      {label}
    </span>
  );
}

export function App() {
  const [health, setHealth] = useState<Health>({ state: 'loading' });
  const [name, setName] = useState('moon');
  const [greeting, setGreeting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .health(ctrl.signal)
      .then((data) => setHealth({ state: 'up', data }))
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) {
          console.error(err);
          setHealth({ state: 'down' });
        }
      });
    return () => ctrl.abort();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.hello(name);
      setGreeting(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const apiTone = health.state === 'up' ? 'ok' : health.state === 'down' ? 'bad' : 'idle';
  const db = health.state === 'up' ? health.data.db : null;
  const dbTone = db === 'ok' ? 'ok' : db === 'error' ? 'bad' : db === 'disabled' ? 'warn' : 'idle';

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-900">
      <div className="mx-auto max-w-lg space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">dummyapps</h1>
          <p className="text-slate-600">
            Go + Gin API and Vite + React web, managed with{' '}
            <a className="font-medium text-indigo-600 hover:underline" href="https://moonrepo.dev">
              moon
            </a>
            .
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Status</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-600">API</dt>
              <dd>
                <StatusBadge label={health.state === 'up' ? 'ok' : health.state} tone={apiTone} />
              </dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-600">Database</dt>
              <dd>
                <StatusBadge label={db ?? '—'} tone={dbTone} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Say hello</h2>
          <form onSubmit={onSubmit} className="flex gap-2">
            <label htmlFor="name" className="sr-only">
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Your name"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Send
            </button>
          </form>
          {greeting && (
            <p role="status" className="mt-4 text-lg">
              {greeting}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 text-rose-700">
              {error}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
