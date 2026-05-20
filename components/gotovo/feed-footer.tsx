'use client';

import { useTranslations } from 'next-intl';

interface FeedFooterProps {
  loading: boolean;
  hasMore: boolean;
  error: boolean;
  onRetry: () => void;
}

/**
 * Status line below the feed: load spinner, retryable error, or an
 * end-of-list marker. Renders nothing while idle with pages still to load —
 * the IntersectionObserver sentinel handles the silent case.
 */
export function FeedFooter({ loading, hasMore, error, onRetry }: FeedFooterProps) {
  const t = useTranslations('feed');

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-6 md:px-6" role="alert">
        <p className="font-mono text-[11px] text-faint">{t('loadError')}</p>
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-divider px-3 py-1 font-mono text-[11px] text-foreground hover:bg-divider"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 px-3 py-6 md:px-6" role="status">
        <span
          aria-hidden="true"
          className="size-3 animate-spin rounded-full border-2 border-divider border-t-foreground"
        />
        <span className="font-mono text-[11px] text-faint">{t('loading')}</span>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <p className="px-3 py-6 text-center font-mono text-[10px] text-faint md:px-6">{t('end')}</p>
    );
  }

  return null;
}
