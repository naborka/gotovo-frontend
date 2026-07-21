import { useTranslations } from 'next-intl';
import { primaryButtonClass } from '@/components/gotovo/ui';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

export default function EventNotFound() {
  const t = useTranslations('event.notFound');
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="max-w-md text-muted-foreground">{t('description')}</p>
      <Link href="/" className={cn(primaryButtonClass, 'rounded-[10px] px-5 py-2.5 text-sm')}>
        {t('home')}
      </Link>
    </main>
  );
}
