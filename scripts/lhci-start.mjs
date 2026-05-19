import { spawn } from 'node:child_process';

const api = spawn('node', ['tests/e2e/fixtures/api-server.mjs'], {
  env: { ...process.env, MOCK_API_PORT: '4000' },
  stdio: 'pipe',
});

api.stdout.on('data', (d) => process.stdout.write(d));
api.stderr.on('data', (d) => process.stderr.write(d));

// Start Next.js in foreground so LHCI can manage the process group
const next = spawn('pnpm', ['start'], {
  env: {
    ...process.env,
    NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:4000/v1',
    NEXT_PUBLIC_SEARCH_ENABLED: 'false',
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    PORT: '3000',
  },
  stdio: 'inherit',
});

next.on('exit', (code) => {
  api.kill();
  process.exit(code);
});

process.on('SIGTERM', () => {
  api.kill();
  next.kill();
});
process.on('SIGINT', () => {
  api.kill();
  next.kill();
});
