import { describe, expect, it } from 'vitest';
import { parseClientEnv, parseServerEnv } from '@/lib/env';

describe('parseClientEnv', () => {
  it('parses valid client env', () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_API_BASE_URL: 'https://api.example.com/v1',
      NEXT_PUBLIC_SEARCH_ENABLED: 'false',
      NEXT_PUBLIC_SITE_URL: 'https://example.com',
    });
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe('https://api.example.com/v1');
    expect(env.NEXT_PUBLIC_SEARCH_ENABLED).toBe(false);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('https://example.com');
  });

  it('rejects missing API base URL', () => {
    expect(() => parseClientEnv({})).toThrow(/NEXT_PUBLIC_API_BASE_URL/);
  });

  it('rejects invalid URL', () => {
    expect(() => parseClientEnv({ NEXT_PUBLIC_API_BASE_URL: 'not-a-url' })).toThrow(
      /NEXT_PUBLIC_API_BASE_URL/,
    );
  });

  it('coerces search flag true/false strings and defaults to false', () => {
    const base = { NEXT_PUBLIC_API_BASE_URL: 'https://api.example.com/v1' };
    expect(
      parseClientEnv({ ...base, NEXT_PUBLIC_SEARCH_ENABLED: 'true' }).NEXT_PUBLIC_SEARCH_ENABLED,
    ).toBe(true);
    expect(
      parseClientEnv({ ...base, NEXT_PUBLIC_SEARCH_ENABLED: 'false' }).NEXT_PUBLIC_SEARCH_ENABLED,
    ).toBe(false);
    expect(parseClientEnv(base).NEXT_PUBLIC_SEARCH_ENABLED).toBe(false);
  });

  it('rejects a search flag that is neither true nor false', () => {
    expect(() =>
      parseClientEnv({
        NEXT_PUBLIC_API_BASE_URL: 'https://api.example.com/v1',
        NEXT_PUBLIC_SEARCH_ENABLED: 'yes',
      }),
    ).toThrow(/NEXT_PUBLIC_SEARCH_ENABLED/);
  });

  it('defaults site URL and rejects an invalid one', () => {
    const base = { NEXT_PUBLIC_API_BASE_URL: 'https://api.example.com/v1' };
    expect(parseClientEnv(base).NEXT_PUBLIC_SITE_URL).toBe('https://gotovo.app');
    expect(() => parseClientEnv({ ...base, NEXT_PUBLIC_SITE_URL: 'nope' })).toThrow(
      /NEXT_PUBLIC_SITE_URL/,
    );
  });

  it('reports every invalid variable in one error', () => {
    expect(() =>
      parseClientEnv({ NEXT_PUBLIC_API_BASE_URL: 'nope', NEXT_PUBLIC_SITE_URL: 'also-nope' }),
    ).toThrow(/NEXT_PUBLIC_API_BASE_URL[\s\S]*NEXT_PUBLIC_SITE_URL/);
  });
});

describe('parseServerEnv', () => {
  it('defaults NODE_ENV to development', () => {
    expect(parseServerEnv({}).NODE_ENV).toBe('development');
  });

  it('accepts the three known NODE_ENV values', () => {
    for (const v of ['development', 'test', 'production'] as const) {
      expect(parseServerEnv({ NODE_ENV: v }).NODE_ENV).toBe(v);
    }
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => parseServerEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('accepts an absent REVALIDATE_SECRET', () => {
    expect(parseServerEnv({}).REVALIDATE_SECRET).toBeUndefined();
  });

  it('rejects a REVALIDATE_SECRET shorter than 32 chars', () => {
    expect(() => parseServerEnv({ REVALIDATE_SECRET: 'short' })).toThrow(/at least 32/);
  });

  it('accepts a 32+ char REVALIDATE_SECRET', () => {
    const secret = 'a'.repeat(32);
    expect(parseServerEnv({ REVALIDATE_SECRET: secret }).REVALIDATE_SECRET).toBe(secret);
  });
});
