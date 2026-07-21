'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { formatTime } from '@/lib/datetime';
import { categoryDisplayName, cityDisplayName } from '@/lib/display';
import { eventDurationDays, getCategoryColor, isNewEvent } from '@/lib/event-utils';
import type { GotovoEvent } from '@/lib/types';
import { useScrollSnapshot } from '@/lib/use-scroll-snapshot';
import { cn } from '@/lib/utils';

interface EventRowProps {
  event: GotovoEvent;
  locale?: 'ru' | 'en';
}

/**
 * One schedule row: right-aligned time column, category colour bar, title and
 * a single muted meta line. Full-width hairline separators — no card box.
 */
export function EventRow({ event, locale = 'ru' }: EventRowProps) {
  const t = useTranslations('event');
  const { title, category, city, price, startsAt, allDay, uid, status } = event;

  const isNew = isNewEvent(event);
  const durationDays = eventDurationDays(event);
  const timeLabel = allDay ? t('badges.allDay') : formatTime(startsAt, locale);
  const statusLabel =
    status === 'postponed'
      ? t('status.postponed')
      : status === 'cancelled'
        ? t('status.cancelled')
        : null;
  const snapshot = useScrollSnapshot();

  const handleClick = (e: React.MouseEvent) => {
    // Skip snapshot for cmd/middle-click (opens in new tab; no back navigation).
    if (e.metaKey || e.ctrlKey || e.button === 1) return;
    snapshot();
  };

  return (
    <Link
      href={`/event/${uid}`}
      prefetch={false}
      scroll={false}
      onClick={handleClick}
      className="flex gap-3.5 px-4 py-3.5 border-b border-divider-2 cursor-pointer transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:px-6"
      aria-label={title}
    >
      <span
        className={cn(
          'w-12 flex-shrink-0 pt-px text-right text-sm font-bold leading-[1.3] tabular-nums',
          allDay ? 'text-faint' : 'text-foreground',
        )}
      >
        {timeLabel}
      </span>

      <span
        aria-hidden="true"
        className="w-[3px] flex-shrink-0 self-stretch rounded-[2px]"
        style={{ backgroundColor: getCategoryColor(category) }}
      />

      <span className="flex-1 min-w-0">
        <span className="block text-base font-semibold leading-[1.35] text-foreground">
          {title}
          {isNew && (
            <span className="ml-1.5 align-[2px] text-[10.5px] font-extrabold uppercase tracking-wide text-accent">
              {t('badges.new')}
            </span>
          )}
        </span>
        <span className="mt-1 block text-[13px] leading-[1.4] text-muted-foreground">
          {categoryDisplayName(category, locale)}
          {city && <> · {cityDisplayName(city, locale)}</>}
          {durationDays > 1 && <> · {t('meta.days', { days: durationDays })}</>}
          {' · '}
          <span className={price.kind === 'free' ? 'font-semibold text-green' : undefined}>
            {price.display}
          </span>
          {statusLabel && (
            <>
              {' · '}
              <span className="font-semibold text-amber">{statusLabel}</span>
            </>
          )}
        </span>
      </span>
    </Link>
  );
}
