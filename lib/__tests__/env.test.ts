import { describe, expect, it } from 'vitest';

describe('env validation', () => {
  it('parses valid client env', async () => {
    const { z } = await import('zod');
    const schema = z.object({
      NEXT_PUBLIC_API_BASE_URL: z.string().url(),
    });
    expect(() =>
      schema.parse({ NEXT_PUBLIC_API_BASE_URL: 'https://api.example.com/v1' }),
    ).not.toThrow();
  });

  it('rejects missing API base URL', async () => {
    const { z } = await import('zod');
    const schema = z.object({
      NEXT_PUBLIC_API_BASE_URL: z.string().url(),
    });
    expect(() => schema.parse({})).toThrow();
  });

  it('rejects invalid URL', async () => {
    const { z } = await import('zod');
    const schema = z.object({
      NEXT_PUBLIC_API_BASE_URL: z.string().url(),
    });
    expect(() => schema.parse({ NEXT_PUBLIC_API_BASE_URL: 'not-a-url' })).toThrow();
  });

  it('coerces search flag true/false strings', async () => {
    const { z } = await import('zod');
    const schema = z.object({
      NEXT_PUBLIC_SEARCH_ENABLED: z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
    });
    expect(schema.parse({ NEXT_PUBLIC_SEARCH_ENABLED: 'true' })).toEqual({
      NEXT_PUBLIC_SEARCH_ENABLED: true,
    });
    expect(schema.parse({ NEXT_PUBLIC_SEARCH_ENABLED: 'false' })).toEqual({
      NEXT_PUBLIC_SEARCH_ENABLED: false,
    });
    expect(schema.parse({})).toEqual({ NEXT_PUBLIC_SEARCH_ENABLED: false });
  });
});
