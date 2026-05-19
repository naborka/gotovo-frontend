import { z } from 'zod';

/**
 * Server-only environment variables.
 * Never inlined into the client bundle. Reading these from a Client Component
 * results in `undefined`; throw at boot if used incorrectly.
 */
const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  REVALIDATE_SECRET: z
    .string()
    .min(32, 'REVALIDATE_SECRET must be at least 32 chars')
    .optional()
    .describe(
      'Shared HMAC secret with backend RevalidateNotifier. Required to enable /api/revalidate; optional in dev.',
    ),
});

/**
 * Client-visible environment variables.
 * Every key MUST be prefixed `NEXT_PUBLIC_` so Next inlines it into the
 * bundle. Adding a key here without the prefix is a build-time bug.
 */
const ClientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url()
    .describe('Base URL for the Gotovo backend /v1/* API. Example: https://api.gotovo.app/v1'),
  NEXT_PUBLIC_SEARCH_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true')
    .describe('Feature flag for the q= full-text search input (Decision 0006).'),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .default('https://gotovo.app')
    .describe('Canonical site URL used by manifest, sitemap, robots, and OG metadata.'),
});

type ServerEnv = z.infer<typeof ServerEnvSchema>;
type ClientEnv = z.infer<typeof ClientEnvSchema>;

const parse = <S extends z.ZodTypeAny>(
  schema: S,
  source: Record<string, string | undefined>,
  label: string,
): z.infer<S> => {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const formatted = result.error.errors
    .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
    .join('\n');
  throw new Error(
    `[env] Invalid ${label} environment variables:\n${formatted}\n\n` +
      `See .env.example for the expected shape.`,
  );
};

/**
 * Use only in Server Components, Route Handlers, Middleware, Server Actions.
 * Importing `env` into a Client Component throws at runtime (no values inlined).
 */
export const env: ServerEnv = parse(
  ServerEnvSchema,
  process.env as Record<string, string | undefined>,
  'server',
);

/**
 * Use anywhere. NEXT_PUBLIC_* values are inlined at build time.
 */
export const clientEnv: ClientEnv = parse(
  ClientEnvSchema,
  {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_SEARCH_ENABLED: process.env.NEXT_PUBLIC_SEARCH_ENABLED,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  'client',
);
