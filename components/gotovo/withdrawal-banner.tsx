'use client';

import { useTranslations } from 'next-intl';

export function CancelledBanner() {
  const t = useTranslations('event.cancelled');
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border p-3"
      style={{
        background: 'var(--rose-highlight)',
        borderColor: 'var(--rose-border)',
        color: 'var(--rose)',
      }}
    >
      <p className="font-semibold">{t('title')}</p>
      <p className="text-[12px] mt-1 opacity-90">{t('description')}</p>
    </div>
  );
}

export function PostponedBanner() {
  const t = useTranslations('event.postponed');
  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border p-3"
      style={{
        background: 'var(--amber-highlight)',
        borderColor: 'var(--amber-border)',
        color: 'var(--amber)',
      }}
    >
      <p className="font-semibold">{t('title')}</p>
      <p className="text-[12px] mt-1 opacity-90">{t('description')}</p>
    </div>
  );
}
