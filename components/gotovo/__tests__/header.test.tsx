import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from '@/components/gotovo/header';
import { ThemeProvider } from '@/components/theme-provider';

const renderHeader = () =>
  render(
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Header hasFilters={false} onClearFilters={() => {}} />
    </ThemeProvider>,
  );

describe('Header theme toggle', () => {
  it('renders a theme toggle button', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: /светлая тема|тёмная тема/i })).toBeInTheDocument();
  });
});
