import { useTranslations } from 'next-intl';
import { IconSearch } from '@/components/icons';
import { cn } from '@/lib/utils';
import { secondaryButtonClass } from './ui';

/**
 * Empty state shown when no events match the active filters, with a direct
 * way out: the same clear action as the header button.
 */

interface EmptyStateProps {
  onClearFilters: () => void;
}

export function EmptyState({ onClearFilters }: EmptyStateProps) {
  const t = useTranslations('feed');
  return (
    <div className="flex flex-col items-center gap-2 px-8 py-[72px] text-center">
      <IconSearch size={36} className="text-faint" strokeWidth={1.8} aria-hidden="true" />
      <p className="mt-2.5 text-[17px] font-bold text-foreground">{t('empty.title')}</p>
      <p className="max-w-[28ch] text-sm leading-[1.55] text-muted-foreground">
        {t('empty.description')}
      </p>
      <button
        type="button"
        onClick={onClearFilters}
        className={cn(secondaryButtonClass, 'mt-3 h-11 rounded-[10px] px-5 text-sm')}
      >
        {t('empty.clear')}
      </button>
    </div>
  );
}
