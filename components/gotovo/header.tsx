'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { IconClose, IconMoon, IconSun, LogoMark } from '@/components/icons';
import { cn } from '@/lib/utils';

interface HeaderProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function Header({ hasFilters, onClearFilters }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current = mounted ? (resolvedTheme ?? theme) : null;
  const toggle = () => setTheme(current === 'dark' ? 'light' : 'dark');

  return (
    <header className="h-14 px-4 flex items-center bg-background border-b border-divider flex-shrink-0 md:px-6">
      <div className="flex items-center gap-2">
        <LogoMark size={22} />
        <span className="font-heading text-lg font-extrabold text-foreground tracking-tight">
          Gotovo
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {hasFilters && (
          <IconButton
            icon={<IconClose size={14} />}
            label="Clear all filters"
            onClick={onClearFilters}
          />
        )}
        <IconButton
          icon={
            current === 'dark' ? (
              <IconSun size={14} />
            ) : current === 'light' ? (
              <IconMoon size={14} />
            ) : null
          }
          label={current === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          onClick={toggle}
        />
      </div>
    </header>
  );
}

function IconButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'w-9 h-9 rounded-lg',
        'flex items-center justify-center',
        'text-muted-foreground',
        'transition-colors hover:bg-offset hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
