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

export function LanguageHint({ language }: { language: Language }) {
  const uiLocale = useLocale() as 'ru' | 'en';
  const t = useTranslations('event.detail');

  if (language === uiLocale) return null;

  const name = LANGUAGE_NAMES[language]?.[uiLocale];
  if (!name) return null;

  return (
    <p className="text-[10px] text-faint mt-1 mb-2 font-medium">
      {t('originalLanguage', { name })}
    </p>
  );
}
