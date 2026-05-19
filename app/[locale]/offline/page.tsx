import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, type Locale, routing } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const dynamic = 'force-static';

export default async function OfflinePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('offline');

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="font-heading text-2xl font-bold">{t('title')}</h1>
      <p className="max-w-md text-muted-foreground">{t('description')}</p>
      <Link
        href="/"
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        {t('home')}
      </Link>
    </main>
  );
}
