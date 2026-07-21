'use client';

import { useTranslations } from 'next-intl';
import { IconCalendar, IconClock, IconExternal, IconPin, IconTag } from '@/components/icons';
import { mapsUrl } from '@/lib/calendar';
import {
  formatDayMonth,
  formatTime,
  formatWeekdayDayMonth,
  relativeDayHeading,
} from '@/lib/datetime';
import { categoryDisplayName, cityDisplayName } from '@/lib/display';
import { eventDurationDays, getCategoryColor, isNewEvent } from '@/lib/event-utils';
import type { GotovoEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { LanguageHint } from './language-hint';
import { CancelledBanner, PostponedBanner } from './withdrawal-banner';

/**
 * Body of an event-detail view: category chip, title, one bordered
 * settings-list card (Date / Time / Location / Price), description and tags.
 * Shared by the intercepted modal route and the /event/[uid] full page.
 */
export function EventDetailContent({ event, locale }: { event: GotovoEvent; locale: 'ru' | 'en' }) {
  const t = useTranslations('event');
  const tDay = useTranslations('relativeDay');
  const isNew = isNewEvent(event);
  const durationDays = eventDurationDays(event);
  const isCancelled = event.status === 'cancelled';
  const isPostponed = event.status === 'postponed';

  const dateLabel =
    durationDays > 1
      ? `${formatWeekdayDayMonth(event.startsAt, locale)} – ${t('meta.days', { days: durationDays })}`
      : `${relativeDayHeading(event.startsAt, locale, tDay)}, ${formatDayMonth(event.startsAt, locale)}`;
  const timeLabel = event.allDay ? t('badges.allDay') : formatTime(event.startsAt, locale);

  const cityName = event.city ? cityDisplayName(event.city, locale) : null;
  const locationText = [cityName, event.location].filter(Boolean).join(', ');

  return (
    <>
      {isCancelled && <CancelledBanner />}
      {isPostponed && <PostponedBanner />}

      <div className="mb-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-[7px] rounded-full bg-chip px-3 py-[5px] text-[12.5px] font-semibold text-chip-foreground">
          <span
            aria-hidden="true"
            className="h-[7px] w-[7px] rounded-full"
            style={{ backgroundColor: getCategoryColor(event.category) }}
          />
          {categoryDisplayName(event.category, locale)}
        </span>
        {isNew && (
          <span className="text-[11px] font-extrabold uppercase tracking-wide text-accent">
            {t('badges.new')}
          </span>
        )}
      </div>

      <h1
        className={cn(
          'text-[23px] font-extrabold leading-[1.25] tracking-tight text-foreground',
          isCancelled && 'line-through opacity-60',
        )}
      >
        {event.title}
      </h1>

      <div className="mt-[18px] overflow-hidden rounded-[14px] border border-divider">
        <InfoRow icon={<IconCalendar size={18} />} label={t('detail.date')}>
          <p className="mt-px text-[15px] font-semibold text-foreground">{dateLabel}</p>
        </InfoRow>
        <InfoRow icon={<IconClock size={18} />} label={t('detail.time')}>
          <p className="mt-px text-[15px] font-semibold text-foreground tabular-nums">
            {timeLabel}
          </p>
        </InfoRow>
        <InfoRow icon={<IconPin size={18} />} label={t('detail.location')}>
          {locationText ? (
            <>
              <a
                href={mapsUrl(event.location, cityName ?? '')}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${locationText} — ${t('detail.opensInMaps')}`}
                className="mt-px block text-[15px] font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {locationText}
                <IconExternal
                  size={12}
                  strokeWidth={2.2}
                  className="ml-1 inline-block align-[-1px]"
                  aria-hidden="true"
                />
              </a>
              <span className="mt-0.5 block text-xs text-faint">{t('detail.opensInMaps')}</span>
            </>
          ) : (
            <p className="mt-px text-[15px] font-semibold text-faint">{t('detail.tba')}</p>
          )}
        </InfoRow>
        <InfoRow icon={<IconTag size={18} />} label={t('detail.price')} last>
          <p
            className={cn(
              'mt-px text-[15px] font-bold',
              event.price.kind === 'free' ? 'text-green' : 'text-foreground',
            )}
          >
            {event.price.display}
          </p>
        </InfoRow>
      </div>

      {event.description && (
        <p className="mt-[18px] text-[15px] leading-[1.65] text-foreground">{event.description}</p>
      )}

      <LanguageHint language={event.language} />

      {event.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {event.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-divider px-3 py-[5px] text-[12.5px] text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function InfoRow({
  icon,
  label,
  last = false,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3.5 py-[13px]',
        !last && 'border-b border-divider-2',
      )}
    >
      <span aria-hidden="true" className="flex-shrink-0 text-muted-foreground [&>svg]:stroke-[1.8]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        {children}
      </div>
    </div>
  );
}
