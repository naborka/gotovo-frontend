'use client';

import { useLocale, useTranslations } from 'next-intl';
import { categoryDisplayName, cityDisplayName } from '@/lib/display';
import { getCategoryColor } from '@/lib/event-utils';
import { ALL_CATEGORIES, ALL_CITIES, ALL_FILTER } from '@/lib/filters';
import { Chip } from './chip';

/**
 * Single horizontally scrolling filter row:
 * `[All] [Belgrade] … │ [•Hiking] [•Party] …`
 * City is single-select ("All" = none); categories toggle independently.
 */

interface FilterZoneProps {
  activeCity: string;
  setActiveCity: (city: string) => void;
  activeCategories: ReadonlySet<string>;
  toggleCategory: (category: string) => void;
}

export function FilterZone({
  activeCity,
  setActiveCity,
  activeCategories,
  toggleCategory,
}: FilterZoneProps) {
  const t = useTranslations('feed');
  const locale = useLocale() as 'ru' | 'en';

  return (
    <div className="flex flex-shrink-0 items-center gap-1.5 overflow-x-auto border-b border-divider bg-background px-4 py-2.5 scrollbar-hidden md:px-6">
      <Chip
        label={t('filters.all')}
        active={activeCity === ALL_FILTER}
        onClick={() => setActiveCity(ALL_FILTER)}
      />
      {ALL_CITIES.map((city) => (
        <Chip
          key={city}
          label={cityDisplayName(city, locale)}
          active={activeCity === city}
          onClick={() => setActiveCity(activeCity === city ? ALL_FILTER : city)}
        />
      ))}

      <span aria-hidden="true" className="mx-0.5 h-[22px] w-px flex-shrink-0 bg-divider" />

      {ALL_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={categoryDisplayName(category, locale)}
          active={activeCategories.has(category)}
          dotColor={getCategoryColor(category)}
          onClick={() => toggleCategory(category)}
        />
      ))}
    </div>
  );
}
