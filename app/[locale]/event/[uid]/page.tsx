import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ApiError, getEvent } from '@/lib/api/client';
import { getPopularEventUids } from '@/lib/api/popular';
import { tagEventDetail } from '@/lib/api/tags';
import { clientEnv } from '@/lib/env';
import { EventDetailFullPage } from './_components/EventDetailFullPage';

export const dynamic = 'force-dynamic';

const localePath = (locale: 'ru' | 'en', suffix: string) =>
  locale === routing.defaultLocale ? suffix : `/${locale}${suffix}`;

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
  const base = clientEnv.NEXT_PUBLIC_SITE_URL;
  try {
    const event = await getEvent(uid, {
      locale,
      next: { revalidate: 600, tags: [tagEventDetail(uid)] },
    });
    const url = `${base}${localePath(locale, `/event/${uid}`)}`;
    const description = event.description?.slice(0, 200);
    const ogImage = `${url}/opengraph-image`;
    return {
      title: `${event.title} — Gotovo`,
      description,
      alternates: {
        canonical: url,
        languages: {
          ru: `${base}/event/${uid}`,
          en: `${base}/en/event/${uid}`,
        },
      },
      openGraph: {
        type: 'article',
        url,
        title: event.title,
        description,
        images: [{ url: ogImage, width: 1200, height: 630 }],
        locale: locale === 'ru' ? 'ru_RU' : 'en_US',
        siteName: 'gotovo',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: 'Event — Gotovo',
      description: 'View event details, dates, location, and more on Gotovo.',
    };
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
