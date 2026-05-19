import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function EventNotFound() {
  const t = useTranslations('event.notFound');
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
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
