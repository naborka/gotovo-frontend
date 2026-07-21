'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { primaryButtonClass } from '@/components/gotovo/ui';
import { cn } from '@/lib/utils';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('errors');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[GlobalError]', error);
    }
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <div role="alert">
        <h1 className="text-2xl font-semibold">{t('somethingWentWrong')}</h1>
        <p className="max-w-md text-muted-foreground">{error.message || t('genericRetry')}</p>
        {error.digest ? (
          <p className="text-xs text-faint">{t('errorId', { id: error.digest })}</p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className={cn(primaryButtonClass, 'rounded-[10px] px-5 py-2.5 text-sm')}
        >
          {t('tryAgain')}
        </button>
      </div>
    </main>
  );
}
