/**
 * Environment variable validation. Deliberately zod-free: `clientEnv` is
 * imported by client-side code (via lib/api/client), and pulling the zod
 * runtime into the first-load bundle costs ~13 KB gzipped for three
 * build-time constants.
 */

export interface ServerEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  /**
   * Shared HMAC secret with backend RevalidateNotifier. Required to enable
   * /api/revalidate; optional in dev.
   */
  REVALIDATE_SECRET?: string;
}

export interface ClientEnv {
  /** Base URL for the Gotovo backend /v1/* API. Example: https://api.gotovo.app/v1 */
  NEXT_PUBLIC_API_BASE_URL: string;
  /** Feature flag for the q= full-text search input (Decision 0006). */
  NEXT_PUBLIC_SEARCH_ENABLED: boolean;
  /** Canonical site URL used by manifest, sitemap, robots, and OG metadata. */
  NEXT_PUBLIC_SITE_URL: string;
}

type Source = Record<string, string | undefined>;

const isUrl = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const fail = (label: string, issues: string[]): never => {
  throw new Error(
    `[env] Invalid ${label} environment variables:\n${issues.map((i) => `  - ${i}`).join('\n')}\n\n` +
      `See .env.example for the expected shape.`,
  );
};

export const parseServerEnv = (source: Source): ServerEnv => {
  const issues: string[] = [];

  const nodeEnv = source.NODE_ENV ?? 'development';
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production') {
    issues.push(`NODE_ENV: expected development | test | production, got '${nodeEnv}'`);
  }

  const secret = source.REVALIDATE_SECRET;
  if (secret !== undefined && secret.length < 32) {
    issues.push('REVALIDATE_SECRET: REVALIDATE_SECRET must be at least 32 chars');
  }

  if (issues.length > 0) fail('server', issues);
  return {
    NODE_ENV: nodeEnv as ServerEnv['NODE_ENV'],
    ...(secret !== undefined ? { REVALIDATE_SECRET: secret } : {}),
  };
};

export const parseClientEnv = (source: Source): ClientEnv => {
  const issues: string[] = [];

  const apiBaseUrl = source.NEXT_PUBLIC_API_BASE_URL;
  if (apiBaseUrl === undefined || !isUrl(apiBaseUrl)) {
    issues.push(`NEXT_PUBLIC_API_BASE_URL: expected a valid URL, got '${apiBaseUrl}'`);
  }

  const searchFlag = source.NEXT_PUBLIC_SEARCH_ENABLED ?? 'false';
  if (searchFlag !== 'true' && searchFlag !== 'false') {
    issues.push(`NEXT_PUBLIC_SEARCH_ENABLED: expected 'true' or 'false', got '${searchFlag}'`);
  }

  const siteUrl = source.NEXT_PUBLIC_SITE_URL ?? 'https://gotovo.app';
  if (!isUrl(siteUrl)) {
    issues.push(`NEXT_PUBLIC_SITE_URL: expected a valid URL, got '${siteUrl}'`);
  }

  if (issues.length > 0) fail('client', issues);
  return {
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl as string,
    NEXT_PUBLIC_SEARCH_ENABLED: searchFlag === 'true',
    NEXT_PUBLIC_SITE_URL: siteUrl,
  };
};

/**
 * Use only in Server Components, Route Handlers, Middleware, Server Actions.
 * Importing `env` into a Client Component throws at runtime (no values inlined).
 */
export const env: ServerEnv = parseServerEnv(process.env as Source);

/**
 * Use anywhere. NEXT_PUBLIC_* values are inlined at build time — the literal
 * `process.env.NEXT_PUBLIC_*` references below are required for that and must
 * not be replaced with dynamic lookups.
 */
export const clientEnv: ClientEnv = parseClientEnv({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SEARCH_ENABLED: process.env.NEXT_PUBLIC_SEARCH_ENABLED,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});
