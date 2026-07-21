import { getTranslations, setRequestLocale } from 'next-intl/server';
import { IconWifiOff } from '@/components/icons';
import { type Locale, routing } from '@/i18n/routing';
import { RetryButton } from './retry-button';

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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-8 text-center">
      <IconWifiOff size={40} strokeWidth={1.8} className="text-faint" aria-hidden="true" />
      <h1 className="mt-3 text-lg font-bold text-foreground">{t('title')}</h1>
      <p className="max-w-[30ch] text-sm leading-[1.55] text-muted-foreground">
        {t('description')}
      </p>
      <RetryButton label={t('tryAgain')} />
    </main>
  );
}
