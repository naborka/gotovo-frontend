'use client';

import { useCallback, useEffect } from 'react';
import { EventDetailContent } from '@/components/gotovo/event-detail-content';
import { IconBack, IconDirections, IconExternal, IconShare } from '@/components/icons';
import { useRouter } from '@/i18n/routing';
import { categoryDisplayName } from '@/lib/display';
import type { GotovoEventDetail } from '@/lib/types';
import { cn } from '@/lib/utils';

export function EventDetailModal({
  event,
  locale,
}: {
  event: GotovoEventDetail;
  locale: 'ru' | 'en';
}) {
  const router = useRouter();
  const close = useCallback(() => router.back(), [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [close]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={close}
        aria-hidden="true"
      />
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full max-w-lg bg-background z-50',
          'flex flex-col shadow-2xl translate-x-0',
        )}
        role="dialog"
        aria-modal="true"
      >
        <header className="h-14 px-4 flex items-center gap-3 bg-background border-b border-divider flex-shrink-0">
          <button
            type="button"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-primary-highlight transition-colors"
            onClick={close}
            aria-label="Back to feed"
          >
            <IconBack size={18} />
          </button>
          <span className="font-heading text-sm font-bold text-foreground tracking-tight overflow-hidden whitespace-nowrap text-ellipsis">
            {categoryDisplayName(event.category, locale)}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          <div className="p-5 pb-12">
            <EventDetailContent event={event} locale={locale} />
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-3 bg-background border-t border-divider flex gap-2 items-center">
          <ActionButton icon={<IconBack size={18} />} label="Back" onClick={close} />
          <ActionButton icon={<IconDirections size={18} />} label="Directions" />
          <ActionButton icon={<IconShare size={16} />} label="Share" />
          {event.source.url && (
            <a
              href={event.source.url}
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
      </div>
    </>
  );
}

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
