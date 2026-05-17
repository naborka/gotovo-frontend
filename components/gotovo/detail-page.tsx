'use client';

import { useEffect } from 'react';
import { IconBack, IconDirections, IconExternal, IconShare } from '@/components/icons';
import {
  daysBetween,
  formatDateLong,
  getCategoryStyle,
  getPriceStyle,
  isNewEvent,
} from '@/lib/event-utils';
import type { GotovoEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Pill } from './pill';

/**
 * Event detail page component.
 * Full-screen slide-in panel with event information.
 */

interface DetailPageProps {
  event: GotovoEvent | null;
  onClose: () => void;
}

export function DetailPage({ event, onClose }: DetailPageProps) {
  const isOpen = !!event;

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when detail is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Detail panel */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full max-w-lg bg-background z-50',
          'flex flex-col shadow-2xl',
          'transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="h-14 px-4 flex items-center gap-3 bg-background border-b border-divider flex-shrink-0">
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-primary-highlight transition-colors"
            onClick={onClose}
            aria-label="Back to feed"
          >
            <IconBack size={18} />
          </button>
          <span className="font-heading text-sm font-bold text-foreground tracking-tight overflow-hidden whitespace-nowrap text-ellipsis">
            {event?.cat ?? ''}
          </span>
        </header>

        {/* Content */}
        {event && (
          <div className="flex-1 overflow-y-auto scrollbar-hidden">
            <div className="p-5 pb-12">
              <EventDetailContent event={event} />
            </div>
          </div>
        )}

        {/* Bottom action bar */}
        {event && (
          <div className="flex-shrink-0 px-4 py-3 bg-background border-t border-divider flex gap-2 items-center">
            <ActionButton icon={<IconBack size={18} />} label="Back" onClick={onClose} />
            <ActionButton icon={<IconDirections size={18} />} label="Directions" />
            <ActionButton icon={<IconShare size={16} />} label="Share" />
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex-1 bg-primary text-primary-foreground rounded-xl',
                  'px-4 py-3.5 text-sm font-bold',
                  'flex items-center justify-center gap-2',
                  'transition-colors hover:bg-new-badge',
                )}
              >
                <IconExternal size={15} />
                View Source
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/** Action button for bottom bar */
function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'w-12 h-12 flex-shrink-0 rounded-xl',
        'border border-border bg-offset',
        'flex items-center justify-center text-muted-foreground',
        'transition-all hover:bg-dynamic hover:text-foreground hover:border-primary-border',
      )}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

/** Event detail content */
function EventDetailContent({ event }: { event: GotovoEvent }) {
  const catStyle = getCategoryStyle(event.cat);
  const priceStyle = getPriceStyle(event.price);
  const isNew = isNewEvent(event);
  const multiDaySpan = event.endDate ? daysBetween(event.startDate, event.endDate) : 0;

  return (
    <>
      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <Pill
          label={event.cat}
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

      {/* Title */}
      <h1 className="font-heading text-2xl font-extrabold tracking-tight leading-tight text-foreground mb-3">
        {event.title}
      </h1>

      {/* Description */}
      {event.description && (
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
          {event.description}
        </p>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <DateTimeSection event={event} />

        {/* Location */}
        <InfoCell label="Location" fullWidth>
          {event.city ? (
            <p className="cell-value">
              {event.city}
              {event.loc && (
                <span className="block text-[11px] text-muted-foreground mt-0.5">{event.loc}</span>
              )}
            </p>
          ) : event.loc ? (
            <p>{event.loc}</p>
          ) : (
            <p className="text-faint italic">TBA</p>
          )}
        </InfoCell>

        {/* Price */}
        <InfoCell label="Price">
          <div className="mt-0.5">
            <Pill
              label={event.price ?? 'TBA'}
              color={priceStyle.color}
              highlight={priceStyle.highlight}
              border={priceStyle.border}
              className="text-xs"
            />
          </div>
        </InfoCell>

        {/* Confidence */}
        <InfoCell label="Confidence">
          <div className="flex items-center gap-1.5 mt-1">
            {Array.from({ length: Math.min(event.sourceCount, 5) }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: confidence-dot count is stable per render
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: i < event.sourceCount ? 'var(--green)' : 'var(--divider)',
                }}
              />
            ))}
            <span className="font-mono text-[10px] text-muted-foreground ml-0.5">
              {event.sourceCount} source{event.sourceCount !== 1 ? 's' : ''}
            </span>
          </div>
        </InfoCell>
      </div>

      {/* Tags */}
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

/** Date/time section for detail view */
function DateTimeSection({ event }: { event: GotovoEvent }) {
  const { startDate, endDate, startTime, endTime } = event;
  const isMultiDay = !!endDate;

  if (isMultiDay) {
    const startLabel = [formatDateLong(startDate), startTime].filter(Boolean).join(' · ');
    const endLabel = [formatDateLong(endDate), endTime].filter(Boolean).join(' · ');

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

  return (
    <>
      <InfoCell label="Date">
        <p>{formatDateLong(startDate)}</p>
      </InfoCell>
      <InfoCell label="Time">
        {startTime ? (
          <p className="text-amber font-heading text-[15px]">
            {startTime}
            {endTime ? ` – ${endTime}` : ''}
          </p>
        ) : (
          <p className="text-faint italic">All day</p>
        )}
      </InfoCell>
    </>
  );
}

/** Info cell for grid layout */
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
