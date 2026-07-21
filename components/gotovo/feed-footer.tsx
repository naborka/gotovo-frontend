'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { FeedSkeleton } from './feed-skeleton';
import { secondaryButtonClass } from './ui';

interface FeedFooterProps {
  loading: boolean;
  hasMore: boolean;
  error: boolean;
  onRetry: () => void;
}

/**
 * Status area below the feed: skeleton rows while loading, retryable error,
 * or an end-of-list marker. Renders nothing while idle with pages still to
 * load — the IntersectionObserver sentinel handles the silent case.
 */
export function FeedFooter({ loading, hasMore, error, onRetry }: FeedFooterProps) {
  const t = useTranslations('feed');

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2.5 px-4 py-7" role="alert">
        <p className="text-[13.5px] text-muted-foreground">{t('loadError')}</p>
        <button
          type="button"
          onClick={onRetry}
          className={cn(secondaryButtonClass, 'h-11 rounded-[10px] px-[18px] text-[13.5px]')}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (loading) {
    return <FeedSkeleton rows={4} />;
  }

  if (!hasMore) {
    return <p className="px-4 py-7 text-center text-[13px] text-faint">{t('end')}</p>;
  }

  return null;
}
