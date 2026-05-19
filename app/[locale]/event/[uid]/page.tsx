import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ApiError, getEvent } from '@/lib/api/client';
import { getPopularEventUids } from '@/lib/api/popular';
import { tagEventDetail } from '@/lib/api/tags';
import { EventDetailFullPage } from './_components/EventDetailFullPage';

type Props = {
  params: Promise<{ locale: 'ru' | 'en'; uid: string }>;
};

/**
 * Pre-renders top N popular events × every locale at build time. Long-tail
 * uids fall back to on-demand rendering (`dynamicParams` defaults to true).
 */
export async function generateStaticParams() {
  const uids = await getPopularEventUids();
  return routing.locales.flatMap((locale) => uids.map((uid) => ({ locale, uid })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, uid } = await params;
  try {
    const event = await getEvent(uid, {
      locale,
      next: { revalidate: 600, tags: [tagEventDetail(uid)] },
    });
    return { title: `${event.title} — Gotovo` };
  } catch {
    return { title: 'Event — Gotovo' };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { locale, uid } = await params;
  try {
    const event = await getEvent(uid, {
      locale,
      next: { revalidate: 600, tags: [tagEventDetail(uid)] },
    });
    return <EventDetailFullPage event={event} locale={locale} />;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 410)) {
      // 410 handled fully in #0047; for now treat as not-found.
      notFound();
    }
    throw err;
  }
}
