'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect } from 'react';
import { DetailActions } from '@/components/gotovo/detail-actions';
import { DetailHeader } from '@/components/gotovo/detail-header';
import { EventDetailContent } from '@/components/gotovo/event-detail-content';
import { useRouter } from '@/i18n/routing';
import type { GotovoEventDetail } from '@/lib/types';

/**
 * Intercepted-route detail: full page under 640px, centered modal above.
 * Esc and the backdrop close it back to the feed.
 */
export function EventDetailModal({
  event,
  locale,
}: {
  event: GotovoEventDetail;
  locale: 'ru' | 'en';
}) {
  const t = useTranslations('event');
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-[rgba(15,14,12,0.4)]"
        onClick={close}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={event.title}
        className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[min(720px,calc(100dvh-48px))] sm:w-[min(560px,calc(100vw-48px))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-divider sm:shadow-[0_24px_64px_rgba(0,0,0,0.22)]"
      >
        <DetailHeader backLabel={t('actions.back')} title={event.title} onBack={close} />

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <div className="px-5 pb-7 pt-5">
            <EventDetailContent event={event} locale={locale} />
          </div>
        </div>

        <DetailActions event={event} />
      </div>
    </>
  );
}
