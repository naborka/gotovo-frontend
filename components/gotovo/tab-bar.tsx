'use client';

import { useTranslations } from 'next-intl';
import type { TabType } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Tab bar for switching between Timeline and Recently Added views.
 */

interface TabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const t = useTranslations('tabs');
  return (
    <nav className="flex border-b border-divider flex-shrink-0" aria-label="Feed view">
      <TabButton
        label={t('timeline')}
        active={activeTab === 'timeline'}
        onClick={() => onTabChange('timeline')}
      />
      <TabButton
        label={t('recent')}
        active={activeTab === 'recent'}
        onClick={() => onTabChange('recent')}
        showDot
      />
    </nav>
  );
}

/** Individual tab button */
function TabButton({
  label,
  active,
  onClick,
  showDot = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  showDot?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        'px-4 py-2 text-xs font-normal text-muted-foreground',
        'border-b-2 border-transparent -mb-px',
        'flex items-center gap-1.5',
        'transition-colors',
        'hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        active && 'text-foreground font-semibold border-b-primary',
      )}
      role="tab"
      aria-selected={active}
      onClick={onClick}
    >
      {label}
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full bg-new-badge animate-pulse-dot"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
