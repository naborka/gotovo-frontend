'use client';

import { useTranslations } from 'next-intl';
import { IconCalendarPlus, IconExternal, IconShare } from '@/components/icons';
import { buildIcs, icsFilename } from '@/lib/calendar';
import type { GotovoEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ghostButtonClass, primaryButtonClass, secondaryButtonClass } from './ui';

/**
 * Detail footer: secondary "Add to calendar" (ICS download) and primary
 * "Open source" — the only two actions in the redesign.
 */
export function DetailActions({ event }: { event: GotovoEvent }) {
  const t = useTranslations('event.actions');

  const downloadIcs = () => {
    const blob = new Blob([buildIcs(event)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = icsFilename(event);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-shrink-0 gap-2.5 border-t border-divider bg-background px-4 py-3">
      <button
        type="button"
        onClick={downloadIcs}
        className={cn(
          secondaryButtonClass,
          'flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm',
        )}
      >
        <IconCalendarPlus size={15} aria-hidden="true" />
        {t('addToCalendar')}
      </button>
      {event.source.url && (
        <a
          href={event.source.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t('viewSource')} — ${t('opensInNewTab')}`}
          className={cn(
            primaryButtonClass,
            'flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-[14.5px]',
          )}
        >
          {t('viewSource')}
          <IconExternal size={14} strokeWidth={2.2} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

/** Header share icon: native share sheet with clipboard fallback. */
export function ShareButton({ title }: { title: string }) {
  const t = useTranslations('event.actions');

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      // Share dismissed or clipboard unavailable — nothing to recover.
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      title={t('share')}
      aria-label={t('share')}
      className={cn(ghostButtonClass, 'flex h-11 w-11 items-center justify-center')}
    >
      <IconShare size={16} aria-hidden="true" />
    </button>
  );
}
