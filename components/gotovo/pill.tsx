import { cn } from '@/lib/utils';

/**
 * Pill badge component for displaying categories, prices, and status.
 * Follows Single Responsibility Principle.
 */

interface PillProps {
  label: string;
  color: string;
  highlight: string;
  border: string;
  className?: string;
}

export function Pill({ label, color, highlight, border, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-[10px] font-bold leading-normal whitespace-nowrap',
        className,
      )}
      style={{
        backgroundColor: highlight,
        border: `1px solid ${border}`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}
