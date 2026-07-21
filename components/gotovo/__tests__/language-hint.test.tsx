import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import enMsgs from '@/messages/en.json';
import ruMsgs from '@/messages/ru.json';
import { LanguageHint } from '../language-hint';

const wrap = (locale: 'ru' | 'en', children: React.ReactNode) => (
  <NextIntlClientProvider locale={locale} messages={locale === 'ru' ? ruMsgs : enMsgs}>
    {children}
  </NextIntlClientProvider>
);

describe('LanguageHint', () => {
  it('renders nothing when content language matches UI locale', () => {
    const { container } = render(wrap('ru', <LanguageHint language="ru" />));
    expect(container.firstChild).toBeNull();
  });

  it('renders "Original listing in Russian" in English UI for Russian content', () => {
    render(wrap('en', <LanguageHint language="ru" />));
    expect(screen.getByText(/Original listing in Russian/)).toBeInTheDocument();
  });

  it('renders "Оригинал: английский" in Russian UI for English content', () => {
    render(wrap('ru', <LanguageHint language="en" />));
    expect(screen.getByText(/Оригинал: английский/)).toBeInTheDocument();
  });

  it('renders nothing for matching en/en', () => {
    const { container } = render(wrap('en', <LanguageHint language="en" />));
    expect(container.firstChild).toBeNull();
  });

  it('renders "Original listing in Serbian" in English UI for Serbian content', () => {
    render(wrap('en', <LanguageHint language="sr" />));
    expect(screen.getByText(/Original listing in Serbian/)).toBeInTheDocument();
  });
});
