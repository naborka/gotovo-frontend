import { ImageResponse } from 'next/og';
import { getEvent } from '@/lib/api/client';
import { categoryDisplayName } from '@/lib/display';

export const runtime = 'nodejs';
export const alt = 'gotovo event';
export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';

type Params = { locale: 'ru' | 'en'; uid: string };

export default async function OpengraphImage({ params }: { params: Promise<Params> }) {
  const { locale, uid } = await params;

  const event = await getEvent(uid, { locale }).catch(() => null);

  if (!event) {
    return new ImageResponse(
      <div
        style={{
          background: '#0d0c12',
          color: '#fff',
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 96,
          fontWeight: 800,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '-0.04em',
        }}
      >
        gotovo
      </div>,
      size,
    );
  }

  const dateLabel = new Date(event.startsAt).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return new ImageResponse(
    <div
      style={{
        background: '#0d0c12',
        color: '#fff',
        width: '100%',
        height: '100%',
        padding: 64,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: '#9d7ff4',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {categoryDisplayName(event.category, locale)}
      </div>
      <div
        style={{
          fontSize: 84,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          maxWidth: '92%',
        }}
      >
        {event.title}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: 28,
          color: '#a1a1aa',
        }}
      >
        <span>{dateLabel}</span>
        <span style={{ color: '#fff', fontWeight: 700 }}>gotovo.app</span>
      </div>
    </div>,
    size,
  );
}
