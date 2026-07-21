import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { Header } from '@/components/gotovo/header';
import { ThemeProvider } from '@/components/theme-provider';
import en from '../../../messages/en.json';

const renderHeader = (activeFilterCount = 0, onClearFilters = () => {}) =>
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <Header activeFilterCount={activeFilterCount} onClearFilters={onClearFilters} />
      </ThemeProvider>
    </NextIntlClientProvider>,
  );

describe('Header', () => {
  it('renders the plain-text wordmark', () => {
    const { container } = renderHeader();
    expect(screen.getByText('Gotovo')).toBeInTheDocument();
    // No logo mark / orbit SVG next to the wordmark.
    expect(container.querySelector('header > svg')).toBeNull();
  });

  it('renders a theme toggle button', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /switch to/i })).toBeInTheDocument();
  });

  it('hides Clear with no active filters', () => {
    renderHeader(0);
    expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
  });

  it('shows plain Clear for a single active filter', () => {
    renderHeader(1);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('shows a count for multiple active filters and fires the clear action', () => {
    const onClear = vi.fn();
    renderHeader(3, onClear);
    const button = screen.getByRole('button', { name: 'Clear (3)' });
    fireEvent.click(button);
    expect(onClear).toHaveBeenCalledOnce();
  });
});
