import { SerwistProvider } from '@serwist/turbopack/react';
import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { DM_Mono, DM_Sans, Syne } from 'next/font/google';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import type { ReactNode } from 'react';
import { UpdateToast } from '@/components/gotovo/update-toast';
import { ThemeProvider } from '@/components/theme-provider';
import { type Locale, routing } from '@/i18n/routing';
import '../globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

export const metadata: Metadata = {
  applicationName: 'gotovo',
  title: 'Gotovo - Event Discovery',
  description: 'Discover events in Novi Sad and Belgrade. Music, art, food, adventure, and more.',
  generator: 'v0.app',
  keywords: ['events', 'Novi Sad', 'Belgrade', 'Serbia', 'music', 'art', 'food'],
  authors: [{ name: 'Gotovo' }],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'gotovo',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f2ff' },
    { media: '(prefers-color-scheme: dark)', color: '#0d0c12' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

type Props = {
  children: ReactNode;
  modal: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const themeScript = `
(function() {
  try {
    var cookie = document.cookie.match('(^|;)\\\\s*gotovo-theme\\\\s*=\\\\s*([^;]+)');
    var theme = cookie ? cookie.pop() : null;
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.className = document.documentElement.className.replace(/(^|\\\\s)dark(\\\\s|$)/, '$1').trim();
      document.documentElement.classList.add(theme);
    } else {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.matches) document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default async function LocaleLayout({ children, modal, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get('gotovo-theme')?.value;
  const initialClass = themeCookie === 'dark' ? 'dark' : '';

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${dmMono.variable} ${syne.variable} ${initialClass}`.trim()}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static inline theme script, no user content */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased bg-background">
        <SerwistProvider swUrl="/serwist/sw.js">
          <NextIntlClientProvider messages={messages} locale={locale}>
            <NuqsAdapter>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                {modal}
                <UpdateToast />
              </ThemeProvider>
            </NuqsAdapter>
          </NextIntlClientProvider>
        </SerwistProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
