'use client';

import { useEffect } from 'react';

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[GlobalError]', error);
    }
  }, [error]);

  return (
    <main
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <h1 className="text-2xl font-semibold">Что-то пошло не так</h1>
      <p className="max-w-md text-muted-foreground">
        {error.message || 'Неожиданная ошибка. Попробуйте обновить страницу.'}
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-faint">Идентификатор: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Попробовать снова
      </button>
    </main>
  );
}
