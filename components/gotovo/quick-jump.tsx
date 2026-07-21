'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { belgradeDateKey, isWeekendInBelgrade, relativeDayKind } from '@/lib/datetime';
import { getFeedScrollContainer } from '@/lib/use-scroll-snapshot';

/**
 * "Today · Tomorrow · Weekend" strip. Buttons scroll (never filter) to the
 * matching date group and render only when that group is in the loaded list.
 */

interface QuickJumpProps {
  /** Sorted YYYY-MM-DD keys of the currently loaded date groups. */
  groupKeys: string[];
}

/** Scrolls the feed container so the group's sticky header lands at the top. */
const jumpTo = (key: string): void => {
  const container = getFeedScrollContainer();
  if (!container) return;
  const target = container.querySelector<HTMLElement>(`[data-datekey="${key}"]`);
  if (!target) return;
  const offset =
    target.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop;
  container.scrollTo({ top: offset });
};

export function QuickJump({ groupKeys }: QuickJumpProps) {
  const t = useTranslations('feed.jump');

  const jumps = useMemo(() => {
    const todayKey = belgradeDateKey(Date.now());
    const list: Array<{ label: string; key: string }> = [];

    const today = groupKeys.find((k) => relativeDayKind(k) === 'today');
    if (today) list.push({ label: t('today'), key: today });

    const tomorrow = groupKeys.find((k) => relativeDayKind(k) === 'tomorrow');
    if (tomorrow) list.push({ label: t('tomorrow'), key: tomorrow });

    const weekend = groupKeys.find((k) => k >= todayKey && isWeekendInBelgrade(k));
    if (weekend && weekend !== today && weekend !== tomorrow) {
      list.push({ label: t('weekend'), key: weekend });
    }
    return list;
  }, [groupKeys, t]);

  if (jumps.length < 2) return null;

  return (
    <div className="flex flex-shrink-0 items-center gap-1 border-b border-divider-2 px-3 py-2">
      {jumps.map(({ label, key }) => (
        <button
          key={key}
          type="button"
          onClick={() => jumpTo(key)}
          className="h-8 rounded-full px-3 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
