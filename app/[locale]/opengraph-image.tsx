import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'gotovo — events in Novi Sad and Belgrade';
export const size = { width: 1200, height: 630 } as const;
export const contentType = 'image/png';

export default function SiteOpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        background: '#0d0c12',
        color: '#fff',
        width: '100%',
        height: '100%',
        padding: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          color: '#9d7ff4',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        events · Novi Sad · Belgrade
      </div>
      <div
        style={{
          fontSize: 180,
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.05em',
        }}
      >
        gotovo
      </div>
      <div style={{ fontSize: 32, color: '#a1a1aa' }}>discover what's on tonight</div>
    </div>,
    size,
  );
}
