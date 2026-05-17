'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Chip filter button component.
 * Used for category, city, and tag filters.
 * Follows Open/Closed Principle - extendable via activeStyle prop.
 */

interface ChipProps {
  label: string;
  active?: boolean;
  dotColor?: string;
  activeStyle?: CSSProperties;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export function Chip({
  label,
  active = false,
  dotColor,
  activeStyle,
  onClick,
  className,
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full',
        'border border-border bg-surface text-muted-foreground',
        'text-[11px] font-normal whitespace-nowrap',
        'transition-all duration-150 ease-out',
        'hover:border-primary hover:text-primary',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      onClick={onClick}
      aria-pressed={active}
      style={active ? activeStyle : undefined}
    >
      {dotColor && (
        <span
          className="w-[5px] h-[5px] rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
      {label}
    </button>
  );
}
