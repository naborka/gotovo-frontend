import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventRow } from '@/components/gotovo/event-row';
import type { GotovoEvent } from '@/lib/types';
import messages from '../../../messages/en.json';

const makeEvent = (overrides: Partial<GotovoEvent> = {}): GotovoEvent => ({
  uid: 'evt_1',
  title: 'Test event',
  description: null,
  category: 'HIKING',
  tags: [],
  city: 'novi-sad',
  location: null,
  startsAt: '2026-05-01T10:00:00+02:00',
  endsAt: null,
  allDay: false,
  timezone: 'Europe/Belgrade',
  price: { kind: 'free', amount: null, currency: null, display: 'Free' },
  source: { url: null, count: 1 },
  language: 'en',
  status: 'live',
  createdAt: '2026-04-25T00:00:00Z',
  updatedAt: '2026-04-25T00:00:00Z',
  ...overrides,
});

const renderRow = (event: GotovoEvent) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <EventRow event={event} locale="en" />
    </NextIntlClientProvider>,
  );

beforeEach(() => {
  vi.setSystemTime(new Date('2026-05-01T00:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('EventRow', () => {
  it('renders title, time and the single meta line', () => {
    renderRow(makeEvent());
    expect(screen.getByText('Test event')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    const meta = screen.getByText(/Hiking/);
    expect(meta.textContent).toContain('Novi Sad');
    expect(meta.textContent).toContain('Free');
  });

  it('shows "All day" in place of the time for all-day events', () => {
    renderRow(makeEvent({ allDay: true }));
    expect(screen.getByText(messages.event.badges.allDay)).toBeInTheDocument();
  });

  it('shows the NEW marker only for events created in the last 24h', () => {
    renderRow(makeEvent({ createdAt: '2026-04-30T12:00:00Z' }));
    expect(screen.getByText(messages.event.badges.new)).toBeInTheDocument();
  });

  it('hides the NEW marker for older events', () => {
    renderRow(makeEvent({ createdAt: '2026-04-25T00:00:00Z' }));
    expect(screen.queryByText(messages.event.badges.new)).not.toBeInTheDocument();
  });

  it('appends a multi-day duration to the meta line', () => {
    renderRow(makeEvent({ endsAt: '2026-05-02T10:00:00+02:00' }));
    expect(screen.getByText(/2 days/)).toBeInTheDocument();
  });

  it('appends the status label for postponed events', () => {
    renderRow(makeEvent({ status: 'postponed' }));
    expect(screen.getByText(messages.event.status.postponed)).toBeInTheDocument();
  });

  it('renders no description, tags or pin icon', () => {
    const { container } = renderRow(makeEvent({ description: 'long text', tags: ['jazz'] }));
    expect(screen.queryByText('long text')).not.toBeInTheDocument();
    expect(screen.queryByText('#jazz')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
});
