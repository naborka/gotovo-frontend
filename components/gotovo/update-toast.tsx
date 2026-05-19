'use client';

import { useSerwist } from '@serwist/turbopack/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function UpdateToast() {
  const { serwist } = useSerwist();
  const [waiting, setWaiting] = useState(false);
  const t = useTranslations('pwa.update');

  useEffect(() => {
    if (!serwist) return;
    const onWaiting = () => setWaiting(true);
    const onControlling = () => window.location.reload();
    serwist.addEventListener('waiting', onWaiting);
    serwist.addEventListener('controlling', onControlling);
    return () => {
      serwist.removeEventListener('waiting', onWaiting);
      serwist.removeEventListener('controlling', onControlling);
    };
  }, [serwist]);

  if (!waiting || !serwist) return null;

  const apply = () => {
    serwist.messageSkipWaiting();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-lg md:left-auto md:right-4 md:max-w-sm">
      <p className="flex-1 text-sm">{t('available')}</p>
      <button
        type="button"
        onClick={apply}
        className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
      >
        {t('refresh')}
      </button>
    </div>
  );
}
