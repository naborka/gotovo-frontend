import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t border-divider mt-8 py-6 text-center text-xs text-muted-foreground">
      <div className="flex items-center justify-center gap-3">
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          {t('privacy')}
        </Link>
        <span aria-hidden>·</span>
        <Link href="/terms" className="hover:text-foreground transition-colors">
          {t('terms')}
        </Link>
      </div>
    </footer>
  );
}
