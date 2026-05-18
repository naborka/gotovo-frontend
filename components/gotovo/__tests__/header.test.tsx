import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { Header } from '@/components/gotovo/header';
import { ThemeProvider } from '@/components/theme-provider';
import messages from '../../../messages/ru.json';

const renderHeader = () =>
  render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <Header hasFilters={false} onClearFilters={() => {}} />
      </ThemeProvider>
    </NextIntlClientProvider>,
  );

describe('Header theme toggle', () => {
  it('renders a theme toggle button', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /светлая тема|тёмная тема/i })).toBeInTheDocument();
  });
});
