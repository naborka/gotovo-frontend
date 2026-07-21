import { cn } from '@/lib/utils';

/**
 * Filter chip. Active state inverts to foreground-on-background; category
 * chips carry a small colour dot as a scanning aid.
 */

interface ChipProps {
  label: string;
  active?: boolean;
  dotColor?: string;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, active = false, dotColor, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex-shrink-0 inline-flex items-center gap-[7px] h-9 px-[13px] rounded-lg',
        'text-[13px] whitespace-nowrap transition-colors duration-100 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-foreground text-background font-semibold'
          : 'bg-chip text-chip-foreground font-medium hover:text-foreground',
        className,
      )}
      onClick={onClick}
      aria-pressed={active}
    >
      {dotColor && (
        <span
          aria-hidden="true"
          className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', active && 'opacity-85')}
          style={{ backgroundColor: active ? 'var(--background)' : dotColor }}
        />
      )}
      {label}
    </button>
  );
}
