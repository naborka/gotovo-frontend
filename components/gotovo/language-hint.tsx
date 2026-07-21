'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { Language } from '@/lib/api/schemas';

const LANGUAGE_NAMES: Record<Language, Record<'ru' | 'en', string>> = {
  ru: { ru: 'русский', en: 'Russian' },
  en: { ru: 'английский', en: 'English' },
  sr: { ru: 'сербский', en: 'Serbian' },
  'sr-Latn': { ru: 'сербский (латиница)', en: 'Serbian (Latin)' },
  'sr-Cyrl': { ru: 'сербский (кириллица)', en: 'Serbian (Cyrillic)' },
};

/** Single quiet line in the detail view: "Original listing in {language}". */
export function LanguageHint({ language }: { language: Language }) {
  const uiLocale = useLocale() as 'ru' | 'en';
  const t = useTranslations('event.detail');

  if (language === uiLocale) return null;

  const name = LANGUAGE_NAMES[language]?.[uiLocale];
  if (!name) return null;

  return <p className="mt-2.5 text-[13px] text-faint">{t('originalLanguage', { name })}</p>;
}
