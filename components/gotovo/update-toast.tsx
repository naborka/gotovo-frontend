'use client';

import { useSerwist } from '@serwist/turbopack/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { primaryButtonClass } from './ui';

export function UpdateToast() {
  const { serwist } = useSerwist();
  const [waiting, setWaiting] = useState(false);
  const t = useTranslations('pwa.update');

  useEffect(() => {
    if (!serwist) return;
    const onWaiting = () => setWaiting(true);
    // Reload only when a NEW worker takes over after the user accepted the
    // update — reloading on first install would interrupt every first visit.
    const onControlling = (event: { isUpdate?: boolean }) => {
      if (event.isUpdate) window.location.reload();
    };
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
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-divider bg-background p-3 shadow-lg md:left-auto md:right-4 md:max-w-sm">
      <p className="flex-1 text-sm">{t('available')}</p>
      <button
        type="button"
        onClick={apply}
        className={cn(primaryButtonClass, 'rounded-[10px] px-3 py-1.5 text-xs')}
      >
        {t('refresh')}
      </button>
    </div>
  );
}
