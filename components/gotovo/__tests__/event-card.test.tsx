import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { EventCard } from '@/components/gotovo/event-card';
import type { GotovoEvent } from '@/lib/types';
import messages from '../../../messages/ru.json';

const event: GotovoEvent = {
  uid: 'evt_1',
  title: 'Test',
  description: null,
  category: 'HIKING',
  tags: [],
  city: 'novi-sad',
  location: null,
  startsAt: '2026-05-01T10:00:00+02:00',
  endsAt: null,
  allDay: false,
  timezone: 'Europe/Belgrade',
  price: { kind: 'free', amount: null, currency: null, display: 'Бесплатно' },
  source: { url: null, count: 1 },
  language: 'ru',
  status: 'live',
  createdAt: '2026-04-30T00:00:00Z',
  updatedAt: '2026-04-30T00:00:00Z',
};

const renderCard = () =>
  render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      <EventCard event={event} onOpen={() => {}} />
    </NextIntlClientProvider>,
  );

describe('EventCard', () => {
  it('renders the title', () => {
    renderCard();
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('reserves a 16:9 placeholder', () => {
    const { container } = renderCard();
    expect(container.querySelector('[aria-hidden="true"].aspect-video')).toBeTruthy();
  });
});
