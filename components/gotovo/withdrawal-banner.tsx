'use client';

import { useTranslations } from 'next-intl';

/** Status banners for withdrawn events — soft tinted cards, no border. */

function Banner({
  tone,
  title,
  description,
}: {
  tone: 'rose' | 'amber';
  title: string;
  description: string;
}) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-[10px] px-3.5 py-3"
      style={{
        background: tone === 'rose' ? 'var(--rose-soft)' : 'var(--amber-soft)',
        color: tone === 'rose' ? 'var(--rose)' : 'var(--amber)',
      }}
    >
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-[3px] text-[13px] opacity-90">{description}</p>
    </div>
  );
}

export function CancelledBanner() {
  const t = useTranslations('event.cancelled');
  return <Banner tone="rose" title={t('title')} description={t('description')} />;
}

export function PostponedBanner() {
  const t = useTranslations('event.postponed');
  return <Banner tone="amber" title={t('title')} description={t('description')} />;
}
