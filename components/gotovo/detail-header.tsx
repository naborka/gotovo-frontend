import { IconBack } from '@/components/icons';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { ShareButton } from './detail-actions';
import { ghostButtonClass } from './ui';

/**
 * Detail-view header chrome, shared by the intercepted modal and the
 * /event/[uid] full page: "‹ Back" control on the left, Share on the right.
 * Pass `onBack` from the modal (client) or `backHref` from the full page.
 */
export function DetailHeader({
  backLabel,
  title,
  onBack,
  backHref,
}: {
  backLabel: string;
  /** Event title, forwarded to the share sheet. */
  title: string;
  onBack?: () => void;
  backHref?: string;
}) {
  const backClass = cn(
    ghostButtonClass,
    'flex h-11 items-center gap-1.5 px-3 text-sm font-semibold text-foreground hover:text-foreground',
  );
  const backContent = (
    <>
      <IconBack size={16} strokeWidth={2.2} aria-hidden="true" />
      {backLabel}
    </>
  );

  return (
    <header className="flex h-[52px] flex-shrink-0 items-center border-b border-divider px-2">
      {onBack ? (
        <button type="button" onClick={onBack} className={backClass}>
          {backContent}
        </button>
      ) : (
        <Link href={backHref ?? '/'} className={backClass}>
          {backContent}
        </Link>
      )}
      <div className="ml-auto">
        <ShareButton title={title} />
      </div>
    </header>
  );
}
