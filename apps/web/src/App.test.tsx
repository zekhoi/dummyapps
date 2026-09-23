import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from './App.tsx';

function json(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('/api/health')) return json({ status: 'ok', db: 'disabled' });
      if (url.startsWith('/api/hello')) return json({ message: 'Hello, tester!' });
      return json({}, 404);
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows API and database status', async () => {
  render(<App />);
  expect(await screen.findByText('disabled')).toBeInTheDocument();
  expect(screen.getByText('ok')).toBeInTheDocument();
});

it('greets the submitted name', async () => {
  const user = userEvent.setup();
  render(<App />);

  const input = screen.getByLabelText('Name');
  await user.clear(input);
  await user.type(input, 'tester');
  await user.click(screen.getByRole('button', { name: 'Send' }));

  expect(await screen.findByRole('status')).toHaveTextContent('Hello, tester!');
  expect(fetch).toHaveBeenCalledWith('/api/hello?name=tester', expect.anything());
});
