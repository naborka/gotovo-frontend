'use client';

import { IconPin } from '@/components/icons';
import { daysBetween, getCategoryStyle, getPriceStyle, isNewEvent } from '@/lib/event-utils';
import type { GotovoEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Pill } from './pill';

/**
 * Event card component for displaying event summary in the feed.
 * Handles click/keyboard interactions for opening detail view.
 */

interface EventCardProps {
  event: GotovoEvent;
  onOpen: (event: GotovoEvent) => void;
}

export function EventCard({ event, onOpen }: EventCardProps) {
  const { title, description, startTime, cat, city, price, tags, startDate, endDate } = event;

  const catStyle = getCategoryStyle(cat);
  const priceStyle = getPriceStyle(price);
  const isNew = isNewEvent(event);
  const multiDaySpan = endDate ? daysBetween(startDate, endDate) : 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(event);
    }
  };

  return (
    <article
      className={cn(
        'mx-3 mt-2 p-3 bg-card border border-border rounded-lg cursor-pointer',
        'transition-all duration-150 ease-out',
        'hover:bg-surface-2 hover:border-primary-border hover:shadow-lg hover:-translate-y-0.5',
        'active:translate-y-0 active:shadow-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'md:mx-4',
        isNew && 'border-l-[3px] border-l-primary',
      )}
      onClick={() => onOpen(event)}
      onKeyDown={handleKeyDown}
      aria-label={title}
    >
      {/* Badges row */}
      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
        <Pill
          label={cat}
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
        {startTime ? (
          <span className="ml-auto font-mono text-xs font-medium text-amber flex-shrink-0">
            {startTime}
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
              {city}
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
          label={price ?? 'TBA'}
          color={priceStyle.color}
          highlight={priceStyle.highlight}
          border={priceStyle.border}
        />
      </div>
    </article>
  );
}
