import { useTranslations } from 'next-intl';
import { EventDetailContent } from '@/components/gotovo/event-detail-content';
import { IconBack, IconDirections, IconExternal, IconShare } from '@/components/icons';
import { Link } from '@/i18n/routing';
import type { GotovoEventDetail } from '@/lib/types';
import { cn } from '@/lib/utils';

export function EventDetailFullPage({
  event,
  locale,
}: {
  event: GotovoEventDetail;
  locale: 'ru' | 'en';
}) {
  const t = useTranslations('event');
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 px-4 flex items-center gap-3 bg-background border-b border-divider flex-shrink-0">
        <Link
          href="/"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-primary hover:bg-primary-highlight transition-colors"
          aria-label={t('actions.backToFeed')}
        >
          <IconBack size={18} />
        </Link>
        <span className="font-heading text-sm font-bold text-foreground tracking-tight overflow-hidden whitespace-nowrap text-ellipsis">
          {event.title}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-5 pb-12 max-w-2xl mx-auto">
          <EventDetailContent event={event} locale={locale} />
        </div>
      </main>

      <div className="flex-shrink-0 px-4 py-3 bg-background border-t border-divider flex gap-2 items-center max-w-2xl mx-auto w-full">
        <ActionButton icon={<IconDirections size={18} />} label={t('actions.directions')} />
        <ActionButton icon={<IconShare size={16} />} label={t('actions.share')} />
        {event.source.url && (
          <a
            href={event.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex-1 bg-primary text-primary-foreground rounded-xl',
              'px-4 py-3.5 text-sm font-bold',
              'flex items-center justify-center gap-2',
              'transition-colors hover:bg-new-badge',
            )}
          >
            <IconExternal size={15} />
            {t('actions.viewSource')}
          </a>
        )}
      </div>
    </div>
  );
}

function ActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className={cn(
        'w-12 h-12 flex-shrink-0 rounded-xl',
        'border border-border bg-offset',
        'flex items-center justify-center text-muted-foreground',
        'transition-all hover:bg-dynamic hover:text-foreground hover:border-primary-border',
      )}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
