// Default env for tests. Set BEFORE @/lib/env evaluates (via setupFiles, which
// run before test-file imports). Individual tests can override before importing
// the module under test.
process.env.NEXT_PUBLIC_API_BASE_URL ??= 'https://api.gotovo.app/v1';
process.env.NEXT_PUBLIC_SEARCH_ENABLED ??= 'false';

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// next/navigation alias lives in vitest.config.ts (resolve.alias).

afterEach(() => {
  cleanup();
});
