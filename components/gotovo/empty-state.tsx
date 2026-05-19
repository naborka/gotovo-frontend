import { useTranslations } from 'next-intl';
import { IconSearch } from '@/components/icons';

/**
 * Empty state component shown when no events match filters.
 */

export function EmptyState() {
  const t = useTranslations('feed');
  return (
    <div className="flex flex-col items-center text-center px-8 py-16 gap-3">
      <div className="text-4xl text-faint mb-1">
        <IconSearch size={48} />
      </div>
      <p className="font-heading text-lg font-bold text-foreground">{t('empty.title')}</p>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[26ch]">
        {t('empty.description')}
      </p>
    </div>
  );
}
