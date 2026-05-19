'use client';

import { formatDateLong, formatTime } from '@/lib/datetime';
import { categoryDisplayName, cityDisplayName } from '@/lib/display';
import { daysBetween, getCategoryStyle, getPriceStyle, isNewEvent } from '@/lib/event-utils';
import type { GotovoEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Pill } from './pill';
import { CancelledBanner, PostponedBanner } from './withdrawal-banner';

/**
 * Body of an event-detail view. Shared by:
 *   - the in-feed modal (components/gotovo/detail-page.tsx)
 *   - the /event/[uid] full page (app/[locale]/event/[uid]/page.tsx)
 *   - the intercepted modal route (app/[locale]/@modal/(.)event/[uid]/page.tsx)
 */
export function EventDetailContent({ event, locale }: { event: GotovoEvent; locale: 'ru' | 'en' }) {
  const catStyle = getCategoryStyle(event.category);
  const priceStyle = getPriceStyle(event.price);
  const isNew = isNewEvent(event);
  const multiDaySpan = event.endsAt ? daysBetween(event.startsAt, event.endsAt) : 0;
  const sourceCount = event.source.count;
  const isCancelled = event.status === 'cancelled';
  const isPostponed = event.status === 'postponed';

  return (
    <>
      {isCancelled && <CancelledBanner />}
      {isPostponed && <PostponedBanner />}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Pill
          label={categoryDisplayName(event.category, locale)}
          color={catStyle.color}
          highlight={catStyle.highlight}
          border={catStyle.border}
          className="text-[11px]"
        />
        {isNew && (
          <Pill
            label="Just Added"
            color="var(--new-badge)"
            highlight="var(--new-highlight)"
            border="var(--new-border)"
            className="text-[11px]"
          />
        )}
        {multiDaySpan > 0 && (
          <Pill
            label={`${multiDaySpan + 1}-day event`}
            color="var(--amber)"
            highlight="var(--amber-highlight)"
            border="var(--amber-border)"
            className="text-[11px]"
          />
        )}
      </div>

      <h1
        className={cn(
          'font-heading text-2xl font-extrabold tracking-tight leading-tight text-foreground mb-3',
          isCancelled && 'line-through opacity-60',
        )}
      >
        {event.title}
      </h1>

      {event.description && (
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
          {event.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <DateTimeSection event={event} locale={locale} />

        <InfoCell label="Location" fullWidth>
          {event.city ? (
            <p className="cell-value">
              {cityDisplayName(event.city, locale)}
              {event.location && (
                <span className="block text-[11px] text-muted-foreground mt-0.5">
                  {event.location}
                </span>
              )}
            </p>
          ) : event.location ? (
            <p>{event.location}</p>
          ) : (
            <p className="text-faint italic">TBA</p>
          )}
        </InfoCell>

        <InfoCell label="Price">
          <div className="mt-0.5">
            <Pill
              label={event.price.display}
              color={priceStyle.color}
              highlight={priceStyle.highlight}
              border={priceStyle.border}
              className="text-xs"
            />
          </div>
        </InfoCell>

        <InfoCell label="Confidence">
          <div className="flex items-center gap-1.5 mt-1">
            {Array.from({ length: Math.min(sourceCount, 5) }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: confidence-dot count is stable per render
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i < sourceCount ? 'var(--green)' : 'var(--divider)',
                }}
              />
            ))}
            <span className="font-mono text-[10px] text-muted-foreground ml-0.5">
              {sourceCount} source{sourceCount !== 1 ? 's' : ''}
            </span>
          </div>
        </InfoCell>
      </div>

      {event.tags.length > 0 && (
        <>
          <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest font-medium mb-2">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 border border-divider rounded-full font-mono text-[10.5px] text-faint"
              >
                #{tag}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function DateTimeSection({ event, locale }: { event: GotovoEvent; locale: 'ru' | 'en' }) {
  const { startsAt, endsAt, allDay } = event;
  const isMultiDay = !!endsAt;

  if (isMultiDay) {
    const startTime = allDay ? null : formatTime(startsAt, locale);
    const endTime = endsAt ? formatTime(endsAt, locale) : null;
    const startLabel = [formatDateLong(startsAt, locale), startTime].filter(Boolean).join(' · ');
    const endLabel = endsAt
      ? [formatDateLong(endsAt, locale), endTime].filter(Boolean).join(' · ')
      : '';
    return (
      <>
        <InfoCell label="Starts" fullWidth>
          <p className="text-amber font-heading text-[15px]">{startLabel}</p>
        </InfoCell>
        <InfoCell label="Ends" fullWidth>
          {endLabel ? (
            <p className="text-amber font-heading text-[15px]">{endLabel}</p>
          ) : (
            <p className="text-faint italic">End time TBA</p>
          )}
        </InfoCell>
      </>
    );
  }

  const timeLabel = allDay ? null : formatTime(startsAt, locale);
  return (
    <>
      <InfoCell label="Date">
        <p>{formatDateLong(startsAt, locale)}</p>
      </InfoCell>
      <InfoCell label="Time">
        {timeLabel ? (
          <p className="text-amber font-heading text-[15px]">{timeLabel}</p>
        ) : (
          <p className="text-faint italic">All day</p>
        )}
      </InfoCell>
    </>
  );
}

function InfoCell({
  label,
  fullWidth = false,
  children,
}: {
  label: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn('bg-offset border border-divider rounded-lg p-3', fullWidth && 'col-span-2')}
    >
      <p className="font-mono text-[9px] font-medium text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="text-[13px] font-semibold text-foreground leading-snug">{children}</div>
    </div>
  );
}
