import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type Locale, routing } from '@/i18n/routing';

type Props = { params: Promise<{ locale: Locale }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal.terms');
  return { title: `${t('title')} — Gotovo` };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('legal.terms');
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold mb-2">{t('title')}</h1>
      <p className="text-xs text-muted-foreground mb-8">
        {t('lastUpdated', { date: '2026-05-19' })}
      </p>
      <p className="text-sm leading-relaxed text-foreground">{t('body')}</p>
    </main>
  );
}
