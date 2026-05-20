import { LogoMark } from '@/components/icons';
import { getCategoryStyle } from '@/lib/event-utils';
import type { EventCategory } from '@/lib/types';

type Props = {
  category: EventCategory;
  className?: string;
};

export function CategoryGradient({ category, className }: Props) {
  const style = getCategoryStyle(category);

  return (
    <div
      aria-hidden="true"
      className={`relative h-16 w-full overflow-hidden rounded-t-[inherit] ${className ?? ''}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${style.highlight}, ${style.color})`,
      }}
    >
      <LogoMark
        className="absolute inset-0 m-auto size-8 opacity-[0.12] text-foreground"
        aria-hidden="true"
      />
    </div>
  );
}
