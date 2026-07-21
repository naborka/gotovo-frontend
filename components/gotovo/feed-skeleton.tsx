import { useTranslations } from 'next-intl';

/**
 * Skeleton placeholder mirroring the schedule-row layout: time block, colour
 * bar and two text blocks per row, with a staggered opacity pulse.
 */

interface FeedSkeletonProps {
  rows?: number;
  /** Also render a date-header-sized block above the rows. */
  withHeader?: boolean;
}

const ROW_WIDTHS: Array<[string, string]> = [
  ['75%', '50%'],
  ['60%', '45%'],
  ['70%', '55%'],
  ['65%', '40%'],
];

export function FeedSkeleton({ rows = 4, withHeader = false }: FeedSkeletonProps) {
  const t = useTranslations('loading');
  return (
    <div role="status" aria-label={t('label')} className="flex flex-col gap-[22px] p-4 md:px-6">
      {withHeader && <div className="h-4 w-[150px] rounded-[5px] bg-chip animate-skeleton" />}
      {Array.from({ length: rows }, (_, i) => {
        const [titleWidth, metaWidth] = ROW_WIDTHS[i % ROW_WIDTHS.length] as [string, string];
        const delay = { animationDelay: `${i * 0.15}s` };
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder list
          <div key={i} className="flex gap-3.5">
            <div className="h-3.5 w-12 rounded-[5px] bg-chip animate-skeleton" style={delay} />
            <div className="w-[3px] rounded-[2px] bg-divider" />
            <div className="flex-1">
              <div
                className="h-[15px] rounded-[5px] bg-chip animate-skeleton"
                style={{ ...delay, width: titleWidth }}
              />
              <div
                className="mt-2 h-3 rounded-[5px] bg-chip animate-skeleton"
                style={{ ...delay, width: metaWidth }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
