'use client';

import { useLocale } from 'next-intl';
import { IconPin, IconTag } from '@/components/icons';
import { categoryDisplayName, cityDisplayName } from '@/lib/display';
import { getCategoryStyle } from '@/lib/event-utils';
import { ALL_CATEGORIES, ALL_CITIES, ALL_FILTER } from '@/lib/filters';
import type { EventCategory } from '@/lib/types';
import { Chip } from './chip';

/**
 * Filter zone component containing category, city, and tag filters.
 * Manages filter presentation while delegating state to parent.
 */

interface FilterZoneProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeCity: string;
  setActiveCity: (city: string) => void;
  activeTags: Set<string>;
  toggleTag: (tag: string) => void;
  /** Tag options to render. Server-derived from current page events (or facets in Phase 2). */
  availableTags: string[];
}

export function FilterZone({
  activeCategory,
  setActiveCategory,
  activeCity,
  setActiveCity,
  activeTags,
  toggleTag,
  availableTags,
}: FilterZoneProps) {
  const locale = useLocale() as 'ru' | 'en';
  const getCatActiveStyle = (cat: EventCategory) => {
    const style = getCategoryStyle(cat);
    return {
      background: style.highlight,
      border: `1px solid ${style.border}`,
      color: style.color,
      fontWeight: 600,
    };
  };

  const cityActiveStyle = {
    background: 'var(--amber-highlight)',
    border: '1px solid var(--amber-border)',
    color: 'var(--amber)',
    fontWeight: 600,
  };

  const primaryActiveStyle = {
    background: 'var(--primary-highlight)',
    border: '1px solid var(--primary-border)',
    color: 'var(--primary)',
    fontWeight: 600,
  };

  return (
    <div className="bg-background border-b border-divider flex-shrink-0">
      {/* Category filters */}
      <div className="flex items-center px-3 py-1.5 overflow-x-auto scrollbar-hidden gap-1.5 md:px-6">
        <Chip
          label="All"
          active={activeCategory === ALL_FILTER}
          activeStyle={primaryActiveStyle}
          onClick={() => setActiveCategory(ALL_FILTER)}
        />
        {ALL_CATEGORIES.map((cat) => (
          <Chip
            key={cat}
            label={categoryDisplayName(cat, locale)}
            active={activeCategory === cat}
            dotColor={getCategoryStyle(cat).color}
            activeStyle={getCatActiveStyle(cat)}
            onClick={() => setActiveCategory(activeCategory === cat ? ALL_FILTER : cat)}
          />
        ))}
      </div>

      <div className="h-px bg-divider mx-3 md:mx-6" />

      {/* City filters */}
      <div className="flex items-center px-3 py-1.5 overflow-x-auto scrollbar-hidden gap-1.5 md:px-6">
        <span className="flex-shrink-0 text-faint mr-1">
          <IconPin size={11} />
        </span>
        <Chip
          label="All cities"
          active={activeCity === ALL_FILTER}
          activeStyle={cityActiveStyle}
          onClick={() => setActiveCity(ALL_FILTER)}
        />
        {ALL_CITIES.map((city) => (
          <Chip
            key={city}
            label={cityDisplayName(city, locale)}
            active={activeCity === city}
            activeStyle={cityActiveStyle}
            onClick={() => setActiveCity(activeCity === city ? ALL_FILTER : city)}
          />
        ))}
      </div>

      <div className="h-px bg-divider mx-3 md:mx-6" />

      {/* Tag filters - multi-select */}
      <div className="flex items-center px-3 py-1.5 pb-2 overflow-x-auto scrollbar-hidden gap-1.5 md:px-6">
        <span className="flex-shrink-0 text-faint mr-1">
          <IconTag size={11} />
        </span>
        {availableTags.map((tag) => {
          const isActive = activeTags.has(tag);
          return (
            <Chip
              key={tag}
              label={`#${tag}`}
              active={isActive}
              activeStyle={primaryActiveStyle}
              onClick={() => toggleTag(tag)}
              className="font-mono text-[10px]"
            />
          );
        })}
      </div>
    </div>
  );
}
