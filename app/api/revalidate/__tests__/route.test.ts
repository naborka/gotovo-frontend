import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const SECRET = 'a'.repeat(48);

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));

const sign = async (epoch: number, body: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const tsBytes = new TextEncoder().encode(String(epoch));
  const bodyBytes = new TextEncoder().encode(body);
  const data = new Uint8Array(tsBytes.length + 1 + bodyBytes.length);
  data.set(tsBytes, 0);
  data[tsBytes.length] = 0;
  data.set(bodyBytes, tsBytes.length + 1);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const bytes = new Uint8Array(sig);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] as number);
  return `sha256=${btoa(s)}`;
};

const buildRequest = async (
  body: string,
  opts: { ts?: string; sig?: string } = {},
): Promise<Request> => {
  const epoch = Math.floor(Date.now() / 1000);
  const ts = opts.ts ?? String(epoch);
  const sig = opts.sig ?? (await sign(epoch, body));
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-timestamp': ts, 'x-signature': sig },
    body,
  });
};

let POST: typeof import('../route').POST;
let revalidateTagMock: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  process.env.REVALIDATE_SECRET = SECRET;
  process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.gotovo.app/v1';
  process.env.NEXT_PUBLIC_SEARCH_ENABLED = 'false';
  ({ POST } = await import('../route'));
  const cache = await import('next/cache');
  revalidateTagMock = cache.revalidateTag as ReturnType<typeof vi.fn>;
});

beforeEach(() => {
  revalidateTagMock.mockClear();
});

const validPayload = JSON.stringify({
  uids: ['evt_01'],
  tags: ['events:list', 'events:detail:evt_01', 'facets'],
  reason: 'upsert',
});

describe('POST /api/revalidate', () => {
  it('200 on a properly signed payload', async () => {
    const res = await POST(await buildRequest(validPayload));
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; revalidated: number };
    expect(json).toEqual({ ok: true, revalidated: 3 });
  });

  it('calls revalidateTag for every tag in payload', async () => {
    await POST(await buildRequest(validPayload));
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);
    expect(revalidateTagMock).toHaveBeenCalledWith('events:list', 'max');
    expect(revalidateTagMock).toHaveBeenCalledWith('events:detail:evt_01', 'max');
    expect(revalidateTagMock).toHaveBeenCalledWith('facets', 'max');
  });

  it('400 on missing headers', async () => {
    const req = new Request('http://localhost/api/revalidate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: validPayload,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('401 on signature mismatch', async () => {
    const epoch = Math.floor(Date.now() / 1000);
    const res = await POST(
      await buildRequest(validPayload, {
        ts: String(epoch),
        sig: 'sha256=BAD' + 'a'.repeat(40),
      }),
    );
    expect(res.status).toBe(401);
  });

  it('401 on timestamp skew > 300s', async () => {
    const oldEpoch = Math.floor(Date.now() / 1000) - 600;
    const sig = await sign(oldEpoch, validPayload);
    const res = await POST(await buildRequest(validPayload, { ts: String(oldEpoch), sig }));
    expect(res.status).toBe(401);
  });

  it('400 on malformed body', async () => {
    const bad = '{ this is not json';
    const res = await POST(await buildRequest(bad));
    expect(res.status).toBe(400);
  });

  it('400 on schema mismatch', async () => {
    const bad = JSON.stringify({ wrong: true });
    const res = await POST(await buildRequest(bad));
    expect(res.status).toBe(400);
  });
});
