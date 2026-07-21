import { useTranslations } from 'next-intl';
import { DetailActions } from '@/components/gotovo/detail-actions';
import { DetailHeader } from '@/components/gotovo/detail-header';
import { EventDetailContent } from '@/components/gotovo/event-detail-content';
import { Footer } from '@/components/gotovo/footer';
import type { GotovoEventDetail } from '@/lib/types';

/** Direct-URL event detail: full page with the same chrome as the modal. */
export function EventDetailFullPage({
  event,
  locale,
}: {
  event: GotovoEventDetail;
  locale: 'ru' | 'en';
}) {
  const t = useTranslations('event');
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DetailHeader backLabel={t('actions.back')} title={event.title} backHref="/" />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-xl px-5 pb-7 pt-5">
          <EventDetailContent event={event} locale={locale} />
        </div>
      </main>

      <div className="mx-auto w-full max-w-xl">
        <DetailActions event={event} />
        <Footer />
      </div>
    </div>
  );
}
