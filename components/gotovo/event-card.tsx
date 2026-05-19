'use client';

import { IconPin } from '@/components/icons';
import { Link } from '@/i18n/routing';
import { formatTime } from '@/lib/datetime';
import { categoryDisplayName, cityDisplayName } from '@/lib/display';
import { daysBetween, getCategoryStyle, getPriceStyle, isNewEvent } from '@/lib/event-utils';
import type { GotovoEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CategoryGradient } from './category-gradient';
import { Pill } from './pill';

interface EventCardProps {
  event: GotovoEvent;
  locale?: 'ru' | 'en';
}

export function EventCard({ event, locale = 'ru' }: EventCardProps) {
  const { title, description, category, city, price, tags, startsAt, endsAt, allDay, uid } = event;

  const catStyle = getCategoryStyle(category);
  const priceStyle = getPriceStyle(price);
  const isNew = isNewEvent(event);
  const multiDaySpan = endsAt ? daysBetween(startsAt, endsAt) : 0;
  const timeLabel = allDay ? null : formatTime(startsAt, locale);

  return (
    <Link
      href={`/event/${uid}`}
      prefetch={false}
      scroll={false}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg mx-3 mt-2 md:mx-4"
      aria-label={title}
    >
      <article
        className={cn(
          'overflow-hidden bg-card border border-border rounded-lg cursor-pointer',
          'transition-all duration-150 ease-out',
          'hover:bg-surface-2 hover:border-primary-border hover:shadow-lg hover:-translate-y-0.5',
          'active:translate-y-0 active:shadow-none',
          isNew && 'border-l-[3px] border-l-primary',
        )}
      >
        <CategoryGradient category={category} />

        <div className="p-3">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <Pill
              label={categoryDisplayName(category, locale)}
              color={catStyle.color}
              highlight={catStyle.highlight}
              border={catStyle.border}
            />
            {isNew && (
              <Pill
                label="New"
                color="var(--new-badge)"
                highlight="var(--new-highlight)"
                border="var(--new-border)"
              />
            )}
            {multiDaySpan > 0 && (
              <Pill
                label={`${multiDaySpan + 1}-day`}
                color="var(--amber)"
                highlight="var(--amber-highlight)"
                border="var(--amber-border)"
              />
            )}
            {timeLabel ? (
              <span className="ml-auto font-mono text-xs font-medium text-amber flex-shrink-0">
                {timeLabel}
              </span>
            ) : (
              <span className="ml-auto text-[10px] text-faint italic">all day</span>
            )}
          </div>

          {/* Title */}
          <span className="block font-heading text-sm font-bold text-foreground leading-tight tracking-tight mb-1">
            {title}
          </span>

          {/* Description */}
          {description && (
            <p className="text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">
              {description}
            </p>
          )}

          {/* Footer: location + tags + price */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
              <IconPin size={10} className="text-faint flex-shrink-0" />
              {city && (
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                  {cityDisplayName(city, locale)}
                </span>
              )}
              {city && tags.length > 0 && <span className="text-[10px] text-faint">·</span>}
              {tags.length > 0 && (
                <span className="text-[10px] text-faint overflow-hidden whitespace-nowrap text-ellipsis">
                  {tags.map((t) => `#${t}`).join(' ')}
                </span>
              )}
            </div>
            <Pill
              label={price.display}
              color={priceStyle.color}
              highlight={priceStyle.highlight}
              border={priceStyle.border}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
