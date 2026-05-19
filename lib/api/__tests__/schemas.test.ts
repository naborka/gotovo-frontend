import { describe, expect, it } from 'vitest';
import { Event, EventDetail, EventsPage, Facets, Health, Problem } from '@/lib/api/schemas';
import eventJson from './fixtures/event.json';
import eventDetailJson from './fixtures/event-detail.json';
import eventsPageJson from './fixtures/events-page.json';
import facetsJson from './fixtures/facets.json';
import healthJson from './fixtures/health.json';
import problemJson from './fixtures/problem.json';

describe('Event schema', () => {
  it('parses a contract-shaped event', () => {
    expect(Event.parse(eventJson)).toMatchObject({ uid: eventJson.uid });
  });

  it('rejects an event missing a required field', () => {
    const { startsAt, ...rest } = eventJson;
    expect(() => Event.parse(rest)).toThrow();
  });

  it('rejects an unknown category', () => {
    expect(() => Event.parse({ ...eventJson, category: 'UNKNOWN' })).toThrow();
  });

  it('accepts null for nullable fields', () => {
    const parsed = Event.parse({
      ...eventJson,
      description: null,
      city: null,
      location: null,
      endsAt: null,
    });
    expect(parsed.city).toBeNull();
  });
});

describe('EventDetail schema', () => {
  it('parses a contract-shaped detail', () => {
    expect(EventDetail.parse(eventDetailJson).details.images).toHaveLength(0);
  });

  it('rejects a detail without details object', () => {
    const { details, ...rest } = eventDetailJson;
    expect(() => EventDetail.parse(rest)).toThrow();
  });
});

describe('EventsPage schema', () => {
  it('parses the paginated response envelope', () => {
    const parsed = EventsPage.parse(eventsPageJson);
    expect(parsed.data).toHaveLength(1);
    expect(parsed.page.hasMore).toBe(true);
  });

  it('rejects when data is not an array', () => {
    expect(() => EventsPage.parse({ ...eventsPageJson, data: {} })).toThrow();
  });
});

describe('Facets schema', () => {
  it('parses facet counts', () => {
    const parsed = Facets.parse(facetsJson);
    expect(parsed.categories[0]?.value).toBe('HIKING');
    expect(parsed.truncated.tags).toBe(false);
  });

  it('rejects negative counts', () => {
    const bad = {
      ...facetsJson,
      categories: [{ value: 'HIKING', count: -1 }],
    };
    expect(() => Facets.parse(bad)).toThrow();
  });
});

describe('Health schema', () => {
  it('parses health 200 body', () => {
    expect(Health.parse(healthJson).status).toBe('ok');
  });

  it('rejects unknown status', () => {
    expect(() => Health.parse({ ...healthJson, status: 'broken' })).toThrow();
  });
});

describe('Problem schema', () => {
  it('parses a problem+json body', () => {
    expect(Problem.parse(problemJson).status).toBe(400);
  });

  it('tolerates missing optional fields', () => {
    const parsed = Problem.parse({
      type: 'about:blank',
      title: 'Bad request',
      status: 400,
    });
    expect(parsed.detail).toBeUndefined();
  });
});
