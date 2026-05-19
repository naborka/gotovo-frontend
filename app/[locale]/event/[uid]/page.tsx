import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError, getEvent } from '@/lib/api/client';
import { tagEventDetail } from '@/lib/api/tags';
import { EventDetailFullPage } from './_components/EventDetailFullPage';

type Props = {
  params: Promise<{ locale: 'ru' | 'en'; uid: string }>;
};

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
    if (err instanceof ApiError && err.status === 404) notFound();
    // 410 no longer throws (client returns body); cancelled state renders inline.
    throw err;
  }
}
