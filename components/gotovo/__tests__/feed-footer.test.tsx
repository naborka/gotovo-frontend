import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { FeedFooter } from '@/components/gotovo/feed-footer';
import messages from '../../../messages/ru.json';

const renderFooter = (props: Partial<Parameters<typeof FeedFooter>[0]> = {}) =>
  render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      <FeedFooter loading={false} hasMore={true} error={false} onRetry={() => {}} {...props} />
    </NextIntlClientProvider>,
  );

describe('FeedFooter', () => {
  it('shows skeleton rows while fetching', () => {
    renderFooter({ loading: true });
    const status = screen.getByRole('status');
    expect(status).toHaveAccessibleName(messages.loading.label);
    expect(status.querySelectorAll('.animate-skeleton').length).toBeGreaterThan(0);
  });

  it('shows an error with a retry button that calls onRetry', () => {
    const onRetry = vi.fn();
    renderFooter({ error: true, onRetry });
    expect(screen.getByText(messages.feed.loadError)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: messages.feed.retry }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows an end-of-list message when there is nothing more', () => {
    renderFooter({ hasMore: false });
    expect(screen.getByText(messages.feed.end)).toBeInTheDocument();
  });

  it('renders nothing while idle with more pages available', () => {
    const { container } = renderFooter({ hasMore: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('prefers the error state over loading', () => {
    renderFooter({ loading: true, error: true });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText(messages.feed.loadError)).toBeInTheDocument();
  });
});
