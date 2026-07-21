'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { IconClose, IconMoon, IconSun } from '@/components/icons';
import { cn } from '@/lib/utils';
import { ghostButtonClass } from './ui';

interface HeaderProps {
  /** Count of active filters; 0 hides the Clear button. */
  activeFilterCount: number;
  onClearFilters: () => void;
}

export function Header({ activeFilterCount, onClearFilters }: HeaderProps) {
  const t = useTranslations('header');
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (resolvedTheme ?? theme) : null;
  const toggle = () => setTheme(current === 'dark' ? 'light' : 'dark');

  return (
    <header className="h-14 pl-4 pr-2 flex items-center bg-background border-b border-divider flex-shrink-0 md:pl-6 md:pr-4">
      <span className="text-[19px] font-extrabold tracking-tight text-foreground">Gotovo</span>

      <div className="ml-auto flex items-center">
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onClearFilters}
            className={cn(
              ghostButtonClass,
              'flex h-11 items-center gap-1.5 px-3 text-[13px] font-semibold',
            )}
          >
            <IconClose size={13} strokeWidth={2.2} aria-hidden="true" />
            {activeFilterCount > 1 ? t('clearWithCount', { count: activeFilterCount }) : t('clear')}
          </button>
        )}
        <button
          type="button"
          onClick={toggle}
          title={current === 'dark' ? t('switchToLight') : t('switchToDark')}
          aria-label={current === 'dark' ? t('switchToLight') : t('switchToDark')}
          className={cn(ghostButtonClass, 'flex h-11 w-11 items-center justify-center')}
        >
          {current === 'dark' ? (
            <IconSun size={17} />
          ) : current === 'light' ? (
            <IconMoon size={17} />
          ) : null}
        </button>
      </div>
    </header>
  );
}
