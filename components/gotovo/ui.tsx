/**
 * Shared button style recipes for the Schedule redesign. One source of truth
 * for the three button voices; call sites add sizing/layout via `cn`.
 */

/** Quiet 44px control: transparent, chip-tinted on hover (header, back, share). */
export const ghostButtonClass =
  'rounded-[10px] text-muted-foreground transition-colors hover:bg-chip hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Solid foreground-on-background primary action. */
export const primaryButtonClass =
  'bg-foreground text-background font-bold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Hairline-bordered secondary action. */
export const secondaryButtonClass =
  'border border-divider bg-background text-foreground font-semibold transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
