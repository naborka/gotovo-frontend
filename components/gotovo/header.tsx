'use client';

import { LogoMark, IconClose, IconSun, IconMoon } from '@/components/icons';
import { cn } from '@/lib/utils';

/**
 * App header with logo, clear filters, and theme toggle.
 */

interface HeaderProps {
  hasFilters: boolean;
  onClearFilters: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({
  hasFilters,
  onClearFilters,
  theme,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="h-14 px-4 flex items-center bg-background border-b border-divider flex-shrink-0 md:px-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <LogoMark size={22} />
        <span className="font-heading text-lg font-extrabold text-foreground tracking-tight">
          Gotovo
        </span>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        {hasFilters && (
          <IconButton
            icon={<IconClose size={14} />}
            label="Clear all filters"
            onClick={onClearFilters}
          />
        )}
        <IconButton
          icon={theme === 'dark' ? <IconSun size={14} /> : <IconMoon size={14} />}
          label="Toggle theme"
          onClick={onToggleTheme}
        />
      </div>
    </header>
  );
}

/** Icon button for header */
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
      className={cn(
        'w-9 h-9 rounded-lg',
        'flex items-center justify-center',
        'text-muted-foreground',
        'transition-colors hover:bg-offset hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
