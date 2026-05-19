import { notFound } from 'next/navigation';
import { ApiError, getEvent } from '@/lib/api/client';
import { tagEventDetail } from '@/lib/api/tags';
import { EventDetailModal } from './_components/EventDetailModal';

type Props = {
  params: Promise<{ locale: 'ru' | 'en'; uid: string }>;
};

export default async function InterceptedEventDetail({ params }: Props) {
  const { locale, uid } = await params;
  try {
    const event = await getEvent(uid, {
      locale,
      next: { revalidate: 600, tags: [tagEventDetail(uid)] },
    });
    return <EventDetailModal event={event} locale={locale} />;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 410)) {
      // 410 full UX in #0047; for now treat as not-found.
      notFound();
    }
    throw err;
  }
}
