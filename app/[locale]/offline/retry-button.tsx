'use client';

import { primaryButtonClass } from '@/components/gotovo/ui';
import { cn } from '@/lib/utils';

export function RetryButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={cn(primaryButtonClass, 'mt-3 h-11 rounded-[10px] px-5 text-sm')}
    >
      {label}
    </button>
  );
}
