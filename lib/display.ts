/**
 * Locale-aware display-name helpers for the controlled vocabularies.
 * Wire form (e.g. 'HIKING' / 'novi-sad') is opaque to the UI; these helpers
 * map to user-facing strings.
 */

import type { Category, City } from '@/lib/api/schemas';

type Locale = 'ru' | 'en';

const CATEGORY_NAMES: Record<Category, Record<Locale, string>> = {
  HIKING: { ru: 'Поход', en: 'Hiking' },
  SPORTS: { ru: 'Спорт', en: 'Sports' },
  PARTY: { ru: 'Вечеринка', en: 'Party' },
  WORKSHOP: { ru: 'Мастер-класс', en: 'Workshop' },
  EDUCATION: { ru: 'Образование', en: 'Education' },
  TRIP: { ru: 'Поездка', en: 'Trip' },
  CULTURE: { ru: 'Культура', en: 'Culture' },
  ENTERTAINMENT: { ru: 'Развлечения', en: 'Entertainment' },
  IT_NETWORKING: { ru: 'IT-нетворкинг', en: 'IT / Networking' },
};

const CITY_NAMES: Record<City, Record<Locale, string>> = {
  belgrade: { ru: 'Белград', en: 'Belgrade' },
  'novi-sad': { ru: 'Нови-Сад', en: 'Novi Sad' },
  subotica: { ru: 'Суботица', en: 'Subotica' },
  nis: { ru: 'Ниш', en: 'Niš' },
  kragujevac: { ru: 'Крагуевац', en: 'Kragujevac' },
};

export const categoryDisplayName = (cat: Category, locale: Locale = 'ru'): string =>
  CATEGORY_NAMES[cat][locale];

export const cityDisplayName = (city: City, locale: Locale = 'ru'): string =>
  CITY_NAMES[city][locale];
