'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  formatDayMonth,
  formatWeekdayDayMonth,
  relativeDayHeading,
  relativeDayKind,
} from '@/lib/datetime';
import type { DateGroup } from '@/lib/types';
import { EmptyState } from './empty-state';
import { EventRow } from './event-row';

/**
 * Event feed: date-grouped schedule rows under sticky date headers.
 * Groups carry `data-datekey` anchors for the quick-jump strip; grouping
 * itself happens once in FeedClient.
 */

interface FeedProps {
  groups: DateGroup[];
  onClearFilters: () => void;
}

export function Feed({ groups, onClearFilters }: FeedProps) {
  const t = useTranslations('feed');
  const tDay = useTranslations('relativeDay');
  const locale = useLocale();

  if (groups.length === 0) {
    return <EmptyState onClearFilters={onClearFilters} />;
  }

  return (
    <div className="pb-6">
      {groups.map((group) => {
        const heading = relativeDayHeading(group.key, locale, tDay);
        const detail =
          relativeDayKind(group.key) === 'other'
            ? formatDayMonth(group.key, locale)
            : formatWeekdayDayMonth(group.key, locale);

        return (
          <section key={group.key} data-datekey={group.key}>
            <div className="sticky top-0 z-10 flex items-baseline border-b border-divider bg-background px-4 pb-2.5 pt-4 md:px-6">
              <h2 className="text-base font-extrabold tracking-tight text-foreground">
                {heading} <span className="font-semibold text-faint">{detail}</span>
              </h2>
              <span className="ml-auto text-xs text-faint">
                {t('groupCount', { count: group.events.length })}
              </span>
            </div>
            {group.events.map((event) => (
              <EventRow key={event.uid} event={event} locale={locale as 'ru' | 'en'} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
