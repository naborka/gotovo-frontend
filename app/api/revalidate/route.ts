import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { env } from '@/lib/env';

export const runtime = 'nodejs';

const Payload = z.object({
  uids: z.array(z.string()),
  tags: z.array(z.string()),
  reason: z.enum(['upsert', 'merge', 'split', 'cancel']),
  timestamp: z.string().optional(),
});

const MAX_SKEW_SECONDS = 300;

const problem = (status: number, detail: string): Response =>
  new Response(
    JSON.stringify({ type: 'about:blank', title: 'Revalidate rejected', status, detail }),
    { status, headers: { 'content-type': 'application/problem+json' } },
  );

export async function POST(request: Request): Promise<Response> {
  const secret = env.REVALIDATE_SECRET;
  if (!secret) return problem(503, 'REVALIDATE_SECRET not configured');

  const ts = request.headers.get('x-timestamp');
  const sig = request.headers.get('x-signature');
  if (!ts || !sig) return problem(400, 'missing X-Timestamp or X-Signature');

  const epoch = Number.parseInt(ts, 10);
  if (!Number.isFinite(epoch)) return problem(400, 'X-Timestamp not numeric');
  const skew = Math.abs(Math.floor(Date.now() / 1000) - epoch);
  if (skew > MAX_SKEW_SECONDS)
    return problem(401, `timestamp skew ${skew}s > ${MAX_SKEW_SECONDS}s`);

  const bodyBytes = new Uint8Array(await request.arrayBuffer());
  const expectedHeader = `sha256=${await signHmac(secret, epoch, bodyBytes)}`;
  if (!timingSafeEqual(sig, expectedHeader)) return problem(401, 'invalid signature');

  let payload: z.infer<typeof Payload>;
  try {
    payload = Payload.parse(JSON.parse(new TextDecoder().decode(bodyBytes)));
  } catch {
    return problem(400, 'malformed payload');
  }

  for (const tag of payload.tags) {
    revalidateTag(tag, 'max');
  }
  return Response.json({ ok: true, revalidated: payload.tags.length });
}

async function signHmac(secret: string, epoch: number, body: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const tsBytes = new TextEncoder().encode(String(epoch));
  const message = new Uint8Array(tsBytes.length + 1 + body.length);
  message.set(tsBytes, 0);
  message[tsBytes.length] = 0;
  message.set(body, tsBytes.length + 1);
  const sig = await crypto.subtle.sign('HMAC', key, message);
  return arrayBufferToBase64(sig);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] as number);
  return btoa(s);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
