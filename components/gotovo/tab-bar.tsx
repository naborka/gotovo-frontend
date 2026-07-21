'use client';

import { useTranslations } from 'next-intl';
import type { TabType } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Tab bar for switching between Timeline and Recently added views.
 * Two full-width halves; the active tab gets a 2px foreground underline.
 */

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const t = useTranslations('tabs');
  return (
    <div
      className="flex border-b border-divider flex-shrink-0"
      aria-label="Feed view"
      role="tablist"
    >
      <TabButton
        label={t('timeline')}
        active={activeTab === 'timeline'}
        onClick={() => onTabChange('timeline')}
      />
      <TabButton
        label={t('recent')}
        active={activeTab === 'recent'}
        onClick={() => onTabChange('recent')}
      />
    </div>
  );
}

/** Individual tab button */
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex-1 h-11 text-sm text-center',
        'border-b-2 border-transparent -mb-px',
        'transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        active
          ? 'text-foreground font-bold border-b-foreground'
          : 'text-muted-foreground font-medium hover:text-foreground',
      )}
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
