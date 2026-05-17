import { IconSearch } from '@/components/icons';

/**
 * Empty state component shown when no events match filters.
 */

export function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center px-8 py-16 gap-3">
      <div className="text-4xl text-faint mb-1">
        <IconSearch size={48} />
      </div>
      <p className="font-heading text-lg font-bold text-foreground">
        No events match
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[26ch]">
        Try adjusting your filters — new events drop throughout the day.
      </p>
    </div>
  );
}
