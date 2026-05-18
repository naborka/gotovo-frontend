import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EventCard } from '@/components/gotovo/event-card';

const event = {
  uid: 'evt_1',
  title: 'Test',
  startDate: new Date('2026-05-01T00:00:00Z'),
  startTime: '10:00',
  cat: 'Adventure' as const,
  city: 'Novi Sad',
  tags: [],
  createdAt: new Date('2026-04-30T00:00:00Z'),
  sourceCount: 1,
};

describe('EventCard', () => {
  it('renders the title', () => {
    render(<EventCard event={event} onOpen={() => {}} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('reserves a 16:9 placeholder', () => {
    const { container } = render(<EventCard event={event} onOpen={() => {}} />);
    expect(container.querySelector('[aria-hidden="true"].aspect-video')).toBeTruthy();
  });
});
